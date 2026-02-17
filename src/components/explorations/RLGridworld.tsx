import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RLGridworldProps {
  onClose: () => void;
  onComplete?: () => void;
}

// --- Constants ---
const GRID_SIZE = 6;
const CELL_PX = 70;
const GRID_PX = GRID_SIZE * CELL_PX;
const CHART_HEIGHT = 120;
const CHART_WIDTH = GRID_PX;

const ACTIONS = [0, 1, 2, 3] as const; // up, right, down, left
type Action = (typeof ACTIONS)[number];
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

// Default layout
const WALLS: [number, number][] = [
  [1, 2],
  [2, 2],
  [3, 4],
  [4, 1],
  [0, 4],
];
const PITS: [number, number][] = [
  [2, 4],
  [4, 3],
];
const START: [number, number] = [0, 0];
const GOAL: [number, number] = [5, 5];

const REWARDS = { goal: 10, pit: -10, step: -0.1 };
const MAX_STEPS_PER_EPISODE = 200;

// --- Colors ---
const COLORS = {
  bg: '#0f172a',
  gridLine: '#1e293b',
  cell: '#1e293b',
  wall: '#334155',
  wallHash: '#475569',
  pit: '#7f1d1d',
  pitAccent: '#dc2626',
  goal: '#22c55e',
  goalGlow: 'rgba(34,197,94,0.3)',
  agent: '#06b6d4',
  agentGlow: 'rgba(6,182,212,0.4)',
  arrow: '#94a3b8',
  arrowActive: '#e2e8f0',
  text: '#e2e8f0',
  textDim: '#64748b',
  textMuted: '#475569',
  panelBg: '#1e293b',
  panelBorder: '#334155',
  tabActive: '#0ea5e9',
  tabInactive: '#334155',
  buttonPrimary: '#0ea5e9',
  buttonPrimaryHover: '#0284c7',
  buttonSecondary: '#334155',
  buttonSecondaryHover: '#475569',
  chartLine: '#0ea5e9',
  chartFill: 'rgba(14,165,233,0.15)',
  qLow: '#0f172a',
  qHigh: '#0ea5e9',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

// --- Helpers ---
function isWall(r: number, c: number): boolean {
  return WALLS.some(([wr, wc]) => wr === r && wc === c);
}
function isPit(r: number, c: number): boolean {
  return PITS.some(([pr, pc]) => pr === r && pc === c);
}
function isGoal(r: number, c: number): boolean {
  return r === GOAL[0] && c === GOAL[1];
}
function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}
function isValidCell(r: number, c: number): boolean {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && !isWall(r, c);
}
function nextPos(r: number, c: number, a: Action): [number, number] {
  const nr = r + DR[a];
  const nc = c + DC[a];
  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || isWall(nr, nc)) {
    return [r, c]; // stay
  }
  return [nr, nc];
}

function lerpColor(t: number): string {
  // Lerp from dark bg to bright cyan
  const r = Math.round(15 + t * (14 - 15));
  const g = Math.round(23 + t * (165 - 23));
  const b = Math.round(42 + t * (233 - 42));
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}

// --- Draw helpers ---
function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dir: Action,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dir * Math.PI) / 2 - Math.PI / 2); // up = 0
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size * 0.5, size * 0.4);
  ctx.lineTo(size * 0.5, size * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  color: string,
  glowColor?: string
) {
  if (glowColor) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
  }
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (glowColor) ctx.restore();
}

function drawHashPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const spacing = 8;
  ctx.beginPath();
  for (let i = -h; i < w; i += spacing) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
  }
  for (let i = -h; i < w; i += spacing) {
    ctx.moveTo(x + i + h, y);
    ctx.lineTo(x + i, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

// --- Q-Learning helpers ---
function createQTable(): Record<string, number[]> {
  const q: Record<string, number[]> = {};
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!isWall(r, c)) {
        q[cellKey(r, c)] = [0, 0, 0, 0];
      }
    }
  }
  return q;
}

function greedyAction(q: Record<string, number[]>, r: number, c: number): Action {
  const vals = q[cellKey(r, c)] || [0, 0, 0, 0];
  let bestA = 0;
  let bestV = vals[0];
  for (let a = 1; a < 4; a++) {
    if (vals[a] > bestV) {
      bestV = vals[a];
      bestA = a;
    }
  }
  return bestA as Action;
}

function epsilonGreedy(
  q: Record<string, number[]>,
  r: number,
  c: number,
  epsilon: number
): Action {
  if (Math.random() < epsilon) {
    return ACTIONS[Math.floor(Math.random() * 4)];
  }
  return greedyAction(q, r, c);
}

// ================================
// Component
// ================================
export const RLGridworld: React.FC<RLGridworldProps> = ({ onClose, onComplete }) => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<'manual' | 'qlearning'>('manual');

  // --- Manual policy state ---
  const [policy, setPolicy] = useState<Record<string, number>>(() => {
    // -1 = none, 0=up, 1=right, 2=down, 3=left
    const p: Record<string, number> = {};
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!isWall(r, c) && !isGoal(r, c) && !isPit(r, c)) {
          p[cellKey(r, c)] = -1;
        }
      }
    }
    return p;
  });
  const [manualAgent, setManualAgent] = useState<[number, number] | null>(null);
  const [manualResult, setManualResult] = useState<string | null>(null);
  const [manualAnimating, setManualAnimating] = useState(false);
  const manualPathRef = useRef<[number, number][]>([]);
  const manualAnimFrameRef = useRef(0);

  // --- Q-Learning state ---
  const [qTable, setQTable] = useState<Record<string, number[]>>(createQTable);
  const [epsilon, setEpsilon] = useState(0.3);
  const [alpha, setAlpha] = useState(0.1);
  const [gamma, setGamma] = useState(0.95);
  const [qRunning, setQRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [cumReward, setCumReward] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<number[]>([]);
  const [consecutiveGoals, setConsecutiveGoals] = useState(0);
  const [qAgentPos, setQAgentPos] = useState<[number, number]>([START[0], START[1]]);
  const [completed, setCompleted] = useState(false);

  // Refs for Q-learning loop
  const qTableRef = useRef(qTable);
  const qRunningRef = useRef(false);
  const speedRef = useRef(speed);
  const epsilonRef = useRef(epsilon);
  const alphaRef = useRef(alpha);
  const gammaRef = useRef(gamma);
  const episodeCountRef = useRef(0);
  const consecutiveGoalsRef = useRef(0);
  const rewardHistoryRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const animFrameRef = useRef(0);

  // Sync refs
  useEffect(() => { qTableRef.current = qTable; }, [qTable]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { epsilonRef.current = epsilon; }, [epsilon]);
  useEffect(() => { alphaRef.current = alpha; }, [alpha]);
  useEffect(() => { gammaRef.current = gamma; }, [gamma]);

  // --- Drawing the grid ---
  const drawGrid = useCallback(
    (
      agentPos: [number, number] | null,
      qTableDraw: Record<string, number[]> | null,
      policyDraw: Record<string, number> | null,
      showQColors: boolean
    ) => {
      const canvas = gridCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== GRID_PX * dpr || canvas.height !== GRID_PX * dpr) {
        canvas.width = GRID_PX * dpr;
        canvas.height = GRID_PX * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, GRID_PX, GRID_PX);
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, GRID_PX, GRID_PX);

      // Compute max Q for color scaling
      let maxQ = 0.01;
      if (showQColors && qTableDraw) {
        for (const key of Object.keys(qTableDraw)) {
          const mv = Math.max(...qTableDraw[key]);
          if (mv > maxQ) maxQ = mv;
        }
      }

      // Draw cells
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const x = c * CELL_PX;
          const y = r * CELL_PX;

          // Cell background
          if (isWall(r, c)) {
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(x, y, CELL_PX, CELL_PX);
            drawHashPattern(ctx, x, y, CELL_PX, CELL_PX, COLORS.wallHash);
          } else if (isPit(r, c)) {
            ctx.fillStyle = COLORS.pit;
            ctx.fillRect(x, y, CELL_PX, CELL_PX);
            // Subtle X
            ctx.strokeStyle = COLORS.pitAccent;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(x + 15, y + 15);
            ctx.lineTo(x + CELL_PX - 15, y + CELL_PX - 15);
            ctx.moveTo(x + CELL_PX - 15, y + 15);
            ctx.lineTo(x + 15, y + CELL_PX - 15);
            ctx.stroke();
            ctx.globalAlpha = 1;
          } else if (isGoal(r, c)) {
            ctx.fillStyle = COLORS.cell;
            ctx.fillRect(x, y, CELL_PX, CELL_PX);
            // Goal glow
            const grd = ctx.createRadialGradient(
              x + CELL_PX / 2,
              y + CELL_PX / 2,
              5,
              x + CELL_PX / 2,
              y + CELL_PX / 2,
              CELL_PX * 0.45
            );
            grd.addColorStop(0, COLORS.goalGlow);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(x, y, CELL_PX, CELL_PX);
            drawStar(
              ctx,
              x + CELL_PX / 2,
              y + CELL_PX / 2,
              16,
              7,
              5,
              COLORS.goal,
              COLORS.goalGlow
            );
          } else {
            // Normal cell - possibly Q-colored
            if (showQColors && qTableDraw) {
              const vals = qTableDraw[cellKey(r, c)] || [0, 0, 0, 0];
              const mv = Math.max(...vals);
              const t = maxQ > 0.01 ? Math.max(0, mv) / maxQ : 0;
              ctx.fillStyle = lerpColor(t * 0.6);
            } else {
              ctx.fillStyle = COLORS.cell;
            }
            ctx.fillRect(x, y, CELL_PX, CELL_PX);

            // Draw policy arrow (manual mode)
            if (policyDraw !== null) {
              const dir = policyDraw[cellKey(r, c)];
              if (dir !== undefined && dir >= 0) {
                drawArrow(
                  ctx,
                  x + CELL_PX / 2,
                  y + CELL_PX / 2,
                  dir as Action,
                  14,
                  COLORS.arrowActive
                );
              }
            }

            // Draw greedy policy arrow (Q-learning mode)
            if (showQColors && qTableDraw) {
              const vals = qTableDraw[cellKey(r, c)] || [0, 0, 0, 0];
              const hasNonZero = vals.some((v) => v !== 0);
              if (hasNonZero) {
                const bestA = greedyAction(qTableDraw, r, c);
                drawArrow(ctx, x + CELL_PX / 2, y + CELL_PX / 2, bestA, 10, 'rgba(255,255,255,0.5)');
              }
            }
          }

          // Grid lines
          ctx.strokeStyle = COLORS.gridLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, CELL_PX - 1, CELL_PX - 1);
        }
      }

      // Draw Start label
      ctx.fillStyle = COLORS.textDim;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('START', START[1] * CELL_PX + CELL_PX / 2, START[0] * CELL_PX + 12);

      // Draw Goal label
      ctx.fillStyle = COLORS.goal;
      ctx.font = 'bold 9px monospace';
      ctx.fillText('GOAL', GOAL[1] * CELL_PX + CELL_PX / 2, GOAL[0] * CELL_PX + 12);

      // Draw agent
      if (agentPos) {
        const ax = agentPos[1] * CELL_PX + CELL_PX / 2;
        const ay = agentPos[0] * CELL_PX + CELL_PX / 2;

        // Glow
        ctx.save();
        ctx.shadowColor = COLORS.agentGlow;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(ax, ay, 14, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.agent;
        ctx.fill();
        ctx.restore();

        // Inner ring
        ctx.beginPath();
        ctx.arc(ax, ay, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(ax - 3, ay - 4, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();
      }
    },
    []
  );

  // --- Draw chart ---
  const drawChart = useCallback((history: number[]) => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CHART_WIDTH * dpr || canvas.height !== CHART_HEIGHT * dpr) {
      canvas.width = CHART_WIDTH * dpr;
      canvas.height = CHART_HEIGHT * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, CHART_WIDTH, CHART_HEIGHT);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

    const pad = { top: 15, bottom: 20, left: 40, right: 10 };
    const plotW = CHART_WIDTH - pad.left - pad.right;
    const plotH = CHART_HEIGHT - pad.top - pad.bottom;

    // Axis labels
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Episode Rewards (last 100)', CHART_WIDTH / 2, 11);

    if (history.length < 2) {
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for data...', CHART_WIDTH / 2, CHART_HEIGHT / 2 + 5);
      return;
    }

    const data = history.slice(-100);
    const minV = Math.min(...data, -1);
    const maxV = Math.max(...data, 1);
    const range = maxV - minV || 1;

    // Grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      const val = maxV - (i / 4) * range;
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), pad.left - 4, y + 3);
    }

    // Line + fill
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1)) * plotW;
      const y = pad.top + ((maxV - data[i]) / range) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = COLORS.chartLine;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill under
    const lastX = pad.left + plotW;
    ctx.lineTo(lastX, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = COLORS.chartFill;
    ctx.fill();
  }, []);

  // --- Redraw on state changes ---
  useEffect(() => {
    if (mode === 'manual') {
      drawGrid(manualAgent, null, policy, false);
    } else {
      drawGrid(qRunning ? qAgentPos : null, qTable, null, true);
      drawChart(rewardHistory);
    }
  }, [
    mode,
    manualAgent,
    policy,
    qTable,
    qAgentPos,
    qRunning,
    rewardHistory,
    drawGrid,
    drawChart,
  ]);

  // --- Manual mode: click to cycle policy ---
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== 'manual' || manualAnimating) return;
      const canvas = gridCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = GRID_PX / rect.width;
      const scaleY = GRID_PX / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const c = Math.floor(mx / CELL_PX);
      const r = Math.floor(my / CELL_PX);

      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
      if (isWall(r, c) || isGoal(r, c) || isPit(r, c)) return;

      const key = cellKey(r, c);
      setPolicy((prev) => {
        const cur = prev[key] ?? -1;
        const next = cur >= 3 ? -1 : cur + 1;
        return { ...prev, [key]: next };
      });
      setManualResult(null);
    },
    [mode, manualAnimating]
  );

  // --- Manual mode: run agent ---
  const runManualAgent = useCallback(() => {
    if (manualAnimating) return;
    setManualResult(null);

    // Build path
    const path: [number, number][] = [[START[0], START[1]]];
    let r = START[0];
    let c = START[1];
    const visited = new Set<string>();
    visited.add(cellKey(r, c));
    let result = 'Stuck in loop!';

    for (let step = 0; step < MAX_STEPS_PER_EPISODE; step++) {
      const dir = policy[cellKey(r, c)];
      if (dir === undefined || dir < 0) {
        result = 'Stuck in loop!';
        break;
      }
      const [nr, nc] = nextPos(r, c, dir as Action);
      path.push([nr, nc]);

      if (isGoal(nr, nc)) {
        result = 'Reached goal!';
        break;
      }
      if (isPit(nr, nc)) {
        result = 'Fell in pit!';
        break;
      }
      if (nr === r && nc === c) {
        result = 'Stuck in loop!';
        break;
      }
      const nKey = cellKey(nr, nc);
      if (visited.has(nKey)) {
        result = 'Stuck in loop!';
        break;
      }
      visited.add(nKey);
      r = nr;
      c = nc;
    }

    manualPathRef.current = path;
    manualAnimFrameRef.current = 0;
    setManualAnimating(true);

    const animate = () => {
      const idx = manualAnimFrameRef.current;
      if (idx < path.length) {
        setManualAgent(path[idx]);
        manualAnimFrameRef.current = idx + 1;
        animFrameRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 120);
        });
      } else {
        setManualAnimating(false);
        setManualResult(result);
      }
    };
    animate();
  }, [policy, manualAnimating]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // --- Q-Learning loop ---
  const runQLearningLoop = useCallback(() => {
    qRunningRef.current = true;
    const localQ = { ...qTableRef.current };
    // Deep copy Q values
    for (const key of Object.keys(localQ)) {
      localQ[key] = [...localQ[key]];
    }

    let localEpisode = episodeCountRef.current;
    let localConsecGoals = consecutiveGoalsRef.current;
    let localHistory = [...rewardHistoryRef.current];

    const runEpisode = () => {
      if (!qRunningRef.current || completedRef.current) return;

      const spd = speedRef.current;
      const eps = epsilonRef.current;
      const alph = alphaRef.current;
      const gam = gammaRef.current;

      const episodesToRun = spd;

      for (let ep = 0; ep < episodesToRun; ep++) {
        if (!qRunningRef.current) break;

        let r = START[0];
        let c = START[1];
        let totalReward = 0;
        let reachedGoal = false;

        for (let step = 0; step < MAX_STEPS_PER_EPISODE; step++) {
          const a = epsilonGreedy(localQ, r, c, eps);
          const [nr, nc] = nextPos(r, c, a);

          let reward = REWARDS.step;
          let done = false;

          if (isGoal(nr, nc)) {
            reward = REWARDS.goal;
            done = true;
            reachedGoal = true;
          } else if (isPit(nr, nc)) {
            reward = REWARDS.pit;
            done = true;
          }

          totalReward += reward;

          // Q-learning update
          const sKey = cellKey(r, c);
          const nsKey = cellKey(nr, nc);
          const oldQ = localQ[sKey][a];
          const maxNextQ = done ? 0 : Math.max(...(localQ[nsKey] || [0, 0, 0, 0]));
          localQ[sKey][a] = oldQ + alph * (reward + gam * maxNextQ - oldQ);

          if (done) break;
          r = nr;
          c = nc;
        }

        localEpisode++;
        localHistory.push(totalReward);
        if (localHistory.length > 100) localHistory = localHistory.slice(-100);

        if (reachedGoal) {
          localConsecGoals++;
        } else {
          localConsecGoals = 0;
        }

        // Check completion
        if (localConsecGoals >= 10 && !completedRef.current) {
          completedRef.current = true;
          setCompleted(true);
          onComplete?.();
        }
      }

      // Update React state for rendering
      // Deep copy for state
      const qCopy: Record<string, number[]> = {};
      for (const key of Object.keys(localQ)) {
        qCopy[key] = [...localQ[key]];
      }
      qTableRef.current = qCopy;
      setQTable(qCopy);
      episodeCountRef.current = localEpisode;
      setEpisodeCount(localEpisode);
      consecutiveGoalsRef.current = localConsecGoals;
      setConsecutiveGoals(localConsecGoals);
      rewardHistoryRef.current = localHistory;
      setRewardHistory([...localHistory]);
      setCumReward(localHistory.length > 0 ? localHistory[localHistory.length - 1] : 0);

      // Animate agent pos on last step (cosmetic)
      let showR = START[0];
      let showC = START[1];
      for (let step = 0; step < 30; step++) {
        const a = greedyAction(qCopy, showR, showC);
        const [nr, nc] = nextPos(showR, showC, a);
        if (isGoal(nr, nc) || isPit(nr, nc)) break;
        if (nr === showR && nc === showC) break;
        showR = nr;
        showC = nc;
      }
      setQAgentPos([showR, showC]);

      if (qRunningRef.current && !completedRef.current) {
        const delay = spd >= 100 ? 16 : spd >= 10 ? 50 : 150;
        animFrameRef.current = requestAnimationFrame(() => {
          setTimeout(runEpisode, delay);
        });
      }
    };

    runEpisode();
  }, [onComplete]);

  const startQLearning = useCallback(() => {
    if (qRunning) return;
    setQRunning(true);
    qRunningRef.current = true;
    runQLearningLoop();
  }, [qRunning, runQLearningLoop]);

  const pauseQLearning = useCallback(() => {
    setQRunning(false);
    qRunningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const resetQLearning = useCallback(() => {
    pauseQLearning();
    const freshQ = createQTable();
    qTableRef.current = freshQ;
    setQTable(freshQ);
    episodeCountRef.current = 0;
    setEpisodeCount(0);
    consecutiveGoalsRef.current = 0;
    setConsecutiveGoals(0);
    rewardHistoryRef.current = [];
    setRewardHistory([]);
    setCumReward(0);
    setQAgentPos([START[0], START[1]]);
    completedRef.current = false;
    setCompleted(false);
  }, [pauseQLearning]);

  // Stop Q-learning on mode switch or unmount
  useEffect(() => {
    if (mode === 'manual') {
      pauseQLearning();
    }
    return () => {
      qRunningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, pauseQLearning]);

  // --- Reset manual agent on mode switch ---
  useEffect(() => {
    if (mode === 'manual') {
      setManualAgent(null);
      setManualResult(null);
      setManualAnimating(false);
    }
  }, [mode]);

  // --- Styles ---
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  const panelStyle: React.CSSProperties = {
    background: COLORS.bg,
    borderRadius: '16px',
    border: `1px solid ${COLORS.panelBorder}`,
    maxWidth: '900px',
    width: '100%',
    maxHeight: '95vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.panelBorder}`,
  };

  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 0,
  };

  const canvasContainerStyle: React.CSSProperties = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  };

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    minWidth: '280px',
    borderLeft: `1px solid ${COLORS.panelBorder}`,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: active ? COLORS.tabActive : COLORS.tabInactive,
    color: active ? '#fff' : COLORS.textDim,
    transition: 'all 0.2s',
  });

  const buttonStyle = (
    variant: 'primary' | 'secondary' | 'danger' = 'primary',
    disabled = false
  ): React.CSSProperties => ({
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    background:
      variant === 'primary'
        ? COLORS.buttonPrimary
        : variant === 'danger'
        ? COLORS.error
        : COLORS.buttonSecondary,
    color: '#fff',
    transition: 'all 0.2s',
  });

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const sliderLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: COLORS.textDim,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '11px',
    fontFamily: 'monospace',
    color: COLORS.text,
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    accentColor: COLORS.tabActive,
  };

  const statBoxStyle: React.CSSProperties = {
    background: COLORS.panelBg,
    border: `1px solid ${COLORS.panelBorder}`,
    borderRadius: '8px',
    padding: '10px 12px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: COLORS.textDim,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: 'monospace',
    color: COLORS.text,
    marginTop: '2px',
  };

  const resultStyle = (result: string | null): React.CSSProperties => ({
    padding: '10px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    fontSize: '13px',
    fontWeight: 600,
    background:
      result === 'Reached goal!'
        ? 'rgba(34,197,94,0.15)'
        : result === 'Fell in pit!'
        ? 'rgba(239,68,68,0.15)'
        : 'rgba(245,158,11,0.15)',
    color:
      result === 'Reached goal!'
        ? COLORS.success
        : result === 'Fell in pit!'
        ? COLORS.error
        : COLORS.warning,
    border: `1px solid ${
      result === 'Reached goal!'
        ? 'rgba(34,197,94,0.3)'
        : result === 'Fell in pit!'
        ? 'rgba(239,68,68,0.3)'
        : 'rgba(245,158,11,0.3)'
    }`,
  });

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              RL Gridworld
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '11px',
                color: COLORS.textDim,
              }}
            >
              Design policies or watch Q-learning discover optimal paths
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textDim,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '12px 20px',
            borderBottom: `1px solid ${COLORS.panelBorder}`,
          }}
        >
          <button
            style={tabStyle(mode === 'manual')}
            onClick={() => setMode('manual')}
          >
            Manual Policy
          </button>
          <button
            style={tabStyle(mode === 'qlearning')}
            onClick={() => setMode('qlearning')}
          >
            Q-Learning
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Canvas area */}
          <div style={canvasContainerStyle}>
            <canvas
              ref={gridCanvasRef}
              width={GRID_PX}
              height={GRID_PX}
              style={{
                width: `${GRID_PX}px`,
                height: `${GRID_PX}px`,
                borderRadius: '8px',
                cursor: mode === 'manual' ? 'pointer' : 'default',
              }}
              onClick={handleGridClick}
            />
            {mode === 'qlearning' && (
              <canvas
                ref={chartCanvasRef}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                style={{
                  width: `${CHART_WIDTH}px`,
                  height: `${CHART_HEIGHT}px`,
                  borderRadius: '8px',
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div style={sidebarStyle}>
            {mode === 'manual' ? (
              <>
                {/* Manual mode sidebar */}
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Instructions</div>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '11px',
                      color: COLORS.textDim,
                      lineHeight: 1.5,
                    }}
                  >
                    Click cells to set direction arrows. The agent will follow
                    your policy from START to GOAL. Avoid pits!
                  </p>
                </div>

                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Legend</div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginTop: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: COLORS.agent,
                          boxShadow: `0 0 6px ${COLORS.agentGlow}`,
                        }}
                      />
                      <span style={{ color: COLORS.textDim }}>Agent</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: COLORS.goal,
                          boxShadow: `0 0 6px ${COLORS.goalGlow}`,
                        }}
                      />
                      <span style={{ color: COLORS.textDim }}>Goal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '2px',
                          background: COLORS.wall,
                        }}
                      />
                      <span style={{ color: COLORS.textDim }}>Wall</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '2px',
                          background: COLORS.pit,
                        }}
                      />
                      <span style={{ color: COLORS.textDim }}>Pit</span>
                    </div>
                  </div>
                </div>

                <button
                  style={buttonStyle('primary', manualAnimating)}
                  disabled={manualAnimating}
                  onClick={runManualAgent}
                >
                  {manualAnimating ? 'Running...' : 'Run Agent'}
                </button>

                <button
                  style={buttonStyle('secondary')}
                  onClick={() => {
                    setManualAgent(null);
                    setManualResult(null);
                    setPolicy((prev) => {
                      const p = { ...prev };
                      for (const key of Object.keys(p)) {
                        p[key] = -1;
                      }
                      return p;
                    });
                  }}
                >
                  Clear Policy
                </button>

                {manualResult && (
                  <div style={resultStyle(manualResult)}>{manualResult}</div>
                )}
              </>
            ) : (
              <>
                {/* Q-Learning mode sidebar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <div style={statBoxStyle}>
                    <div style={statLabelStyle}>Episodes</div>
                    <div style={statValueStyle}>{episodeCount}</div>
                  </div>
                  <div style={statBoxStyle}>
                    <div style={statLabelStyle}>Last Reward</div>
                    <div
                      style={{
                        ...statValueStyle,
                        color: cumReward >= 0 ? COLORS.success : COLORS.error,
                      }}
                    >
                      {cumReward.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Consecutive Goals</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        background: COLORS.panelBorder,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (consecutiveGoals / 10) * 100)}%`,
                          background:
                            consecutiveGoals >= 10
                              ? COLORS.success
                              : COLORS.tabActive,
                          borderRadius: '3px',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color:
                          consecutiveGoals >= 10
                            ? COLORS.success
                            : COLORS.text,
                        fontWeight: 600,
                        minWidth: '30px',
                        textAlign: 'right',
                      }}
                    >
                      {consecutiveGoals}/10
                    </span>
                  </div>
                </div>

                {completed && (
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: 'rgba(34,197,94,0.15)',
                      color: COLORS.success,
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    Optimal policy learned!
                  </div>
                )}

                {/* Sliders */}
                <div style={sliderContainerStyle}>
                  <div style={sliderLabelStyle}>
                    <span style={labelStyle}>Epsilon (exploration)</span>
                    <span style={valueStyle}>{epsilon.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={epsilon}
                    onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                    style={sliderStyle}
                  />
                </div>

                <div style={sliderContainerStyle}>
                  <div style={sliderLabelStyle}>
                    <span style={labelStyle}>Alpha (learning rate)</span>
                    <span style={valueStyle}>{alpha.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    style={sliderStyle}
                  />
                </div>

                <div style={sliderContainerStyle}>
                  <div style={sliderLabelStyle}>
                    <span style={labelStyle}>Gamma (discount)</span>
                    <span style={valueStyle}>{gamma.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={0.99}
                    step={0.01}
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    style={sliderStyle}
                  />
                </div>

                {/* Speed selector */}
                <div>
                  <div style={{ ...labelStyle, marginBottom: '6px' }}>Speed</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 10, 100].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        style={{
                          ...tabStyle(speed === s),
                          flex: 1,
                          padding: '5px 8px',
                          fontSize: '11px',
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!qRunning ? (
                    <button
                      style={{ ...buttonStyle('primary'), flex: 1 }}
                      onClick={startQLearning}
                    >
                      {episodeCount > 0 ? 'Resume' : 'Start'}
                    </button>
                  ) : (
                    <button
                      style={{ ...buttonStyle('secondary'), flex: 1 }}
                      onClick={pauseQLearning}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    style={buttonStyle('danger')}
                    onClick={resetQLearning}
                  >
                    Reset
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: COLORS.textMuted,
                    lineHeight: 1.5,
                    marginTop: '4px',
                  }}
                >
                  Q(s,a) += &alpha; &middot; (r + &gamma; &middot; max Q(s') - Q(s,a))
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
