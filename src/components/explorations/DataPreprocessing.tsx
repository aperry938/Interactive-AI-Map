import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DataPreprocessingProps {
  onComplete?: () => void;
}

interface Point {
  x: number;
  y: number;
  isOutlier: boolean;
  removed: boolean;
  // animated positions for smooth transitions
  animX: number;
  animY: number;
  cluster?: number;
}

interface Stats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

type NormMode = 'raw' | 'minmax' | 'zscore';

// --- Math utilities ---

function linearRegression(points: Point[]): { m: number; b: number } {
  const active = points.filter(p => !p.removed);
  if (active.length < 2) return { m: 0, b: 0 };
  const n = active.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of active) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { m: 0, b: sumY / n };
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

function computeMSE(points: Point[], m: number, b: number): number {
  const active = points.filter(p => !p.removed);
  if (active.length === 0) return 0;
  let sum = 0;
  for (const p of active) {
    const pred = m * p.x + b;
    sum += (pred - p.y) ** 2;
  }
  return sum / active.length;
}

function computeStats(values: number[]): Stats {
  if (values.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance), min, max };
}

function normalizeMinMax(values: number[]): number[] {
  const { min, max } = computeStats(values);
  const range = max - min;
  if (range < 1e-10) return values.map(() => 0.5);
  return values.map(v => (v - min) / range);
}

function normalizeZScore(values: number[]): number[] {
  const { mean, std } = computeStats(values);
  if (std < 1e-10) return values.map(() => 0);
  return values.map(v => (v - mean) / std);
}

// Simple k-means
function kMeans(
  xs: number[],
  ys: number[],
  k: number,
  maxIter: number = 20
): { assignments: number[]; centroids: { x: number; y: number }[]; iterations: { assignments: number[]; centroids: { x: number; y: number }[] }[] } {
  const n = xs.length;
  if (n === 0) return { assignments: [], centroids: [], iterations: [] };

  // Initialize centroids by picking k random points
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  let centroids = indices.slice(0, k).map(i => ({ x: xs[i], y: ys[i] }));
  let assignments = new Array(n).fill(0);
  const iterations: { assignments: number[]; centroids: { x: number; y: number }[] }[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newAssignments = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestC = 0;
      for (let c = 0; c < k; c++) {
        const dx = xs[i] - centroids[c].x;
        const dy = ys[i] - centroids[c].y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestC = c;
        }
      }
      newAssignments[i] = bestC;
    }

    // Update centroids
    const newCentroids = centroids.map(() => ({ x: 0, y: 0, count: 0 }));
    for (let i = 0; i < n; i++) {
      const c = newAssignments[i];
      newCentroids[c].x += xs[i];
      newCentroids[c].y += ys[i];
      newCentroids[c].count++;
    }
    const updatedCentroids = newCentroids.map((c, idx) =>
      c.count > 0 ? { x: c.x / c.count, y: c.y / c.count } : centroids[idx]
    );

    iterations.push({
      assignments: [...newAssignments],
      centroids: updatedCentroids.map(c => ({ ...c })),
    });

    // Check convergence
    let converged = true;
    for (let i = 0; i < n; i++) {
      if (newAssignments[i] !== assignments[i]) {
        converged = false;
        break;
      }
    }

    assignments = newAssignments;
    centroids = updatedCentroids;
    if (converged && iter > 0) break;
  }

  return { assignments, centroids, iterations };
}

// Silhouette score
function silhouetteScore(xs: number[], ys: number[], assignments: number[], k: number): number {
  const n = xs.length;
  if (n < 2 || k < 2) return 0;

  const scores: number[] = [];
  for (let i = 0; i < n; i++) {
    const ci = assignments[i];
    // a(i): mean distance to same cluster
    let aSum = 0, aCount = 0;
    for (let j = 0; j < n; j++) {
      if (j !== i && assignments[j] === ci) {
        aSum += Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
        aCount++;
      }
    }
    const a = aCount > 0 ? aSum / aCount : 0;

    // b(i): min mean distance to other clusters
    let bMin = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ci) continue;
      let bSum = 0, bCount = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] === c) {
          bSum += Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
          bCount++;
        }
      }
      if (bCount > 0) {
        bMin = Math.min(bMin, bSum / bCount);
      }
    }
    if (bMin === Infinity) bMin = 0;

    const s = Math.max(a, bMin) > 0 ? (bMin - a) / Math.max(a, bMin) : 0;
    scores.push(s);
  }

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// --- Data generation ---

function generateDataset(): Point[] {
  const points: Point[] = [];
  // ~30 points with y ≈ 2x + noise
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * 10;
    const y = 2 * x + (Math.random() - 0.5) * 4 + 3;
    points.push({ x, y, isOutlier: false, removed: false, animX: x, animY: y });
  }
  // 3-4 outliers far from trend
  const outliers = [
    { x: 2, y: 22 + Math.random() * 3 },
    { x: 8, y: 2 + Math.random() * 2 },
    { x: 5, y: 28 + Math.random() * 2 },
    { x: 1, y: 18 + Math.random() * 2 },
  ];
  for (const o of outliers) {
    points.push({ x: o.x, y: o.y, isOutlier: true, removed: false, animX: o.x, animY: o.y });
  }
  return points;
}

const CLUSTER_COLORS = ['#06b6d4', '#d946ef', '#eab308', '#22c55e', '#f97316'];

export const DataPreprocessing: React.FC<DataPreprocessingProps> = ({ onComplete }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const clusterRawRef = useRef<HTMLCanvasElement>(null);
  const clusterNormRef = useRef<HTMLCanvasElement>(null);

  const [points, setPoints] = useState<Point[]>(() => generateDataset());
  const [normMode, setNormMode] = useState<NormMode>('raw');
  const [kValue, setKValue] = useState(3);
  const [showClustering, setShowClustering] = useState(false);
  const [clusterResult, setClusterResult] = useState<{
    raw: { assignments: number[]; centroids: { x: number; y: number }[]; silhouette: number };
    norm: { assignments: number[]; centroids: { x: number; y: number }[]; silhouette: number };
  } | null>(null);
  const [animatingClusters, setAnimatingClusters] = useState(false);
  const [clusterAnimStep, setClusterAnimStep] = useState(0);
  const [rawIterations, setRawIterations] = useState<{ assignments: number[]; centroids: { x: number; y: number }[] }[]>([]);
  const [normIterations, setNormIterations] = useState<{ assignments: number[]; centroids: { x: number; y: number }[] }[]>([]);

  // Milestone tracking
  const [milestones, setMilestones] = useState({
    removedOutlier: false,
    triedNormalization: false,
    ranClustering: false,
  });
  const completeCalled = useRef(false);

  // Animation refs
  const animFrameRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);
  const prevPositionsRef = useRef<{ x: number; y: number }[]>([]);

  // Check milestones for completion
  useEffect(() => {
    if (milestones.removedOutlier && milestones.triedNormalization && milestones.ranClustering) {
      if (!completeCalled.current && onComplete) {
        completeCalled.current = true;
        onComplete();
      }
    }
  }, [milestones, onComplete]);

  // Get active (non-removed) points
  const activePoints = points.filter(p => !p.removed);

  // Compute regression and MSE
  const { m: regM, b: regB } = linearRegression(points);
  const mse = computeMSE(points, regM, regB);

  // Compute normalized positions for display
  const getNormalizedPositions = useCallback(
    (pts: Point[], mode: NormMode): { x: number; y: number }[] => {
      const active = pts.filter(p => !p.removed);
      const rawXs = active.map(p => p.x);
      const rawYs = active.map(p => p.y);

      if (mode === 'raw') {
        return active.map(p => ({ x: p.x, y: p.y }));
      } else if (mode === 'minmax') {
        const normX = normalizeMinMax(rawXs);
        const normY = normalizeMinMax(rawYs);
        return normX.map((x, i) => ({ x: x * 10, y: normY[i] * 25 + 3 }));
      } else {
        const normX = normalizeZScore(rawXs);
        const normY = normalizeZScore(rawYs);
        return normX.map((x, i) => ({ x: x * 2.5 + 5, y: normY[i] * 5 + 13 }));
      }
    },
    []
  );

  // Compute stats for display
  const activeXs = activePoints.map(p => p.x);
  const activeYs = activePoints.map(p => p.y);
  const statsX = computeStats(activeXs);
  const statsY = computeStats(activeYs);

  const getNormStatsLabel = (): { xRange: string; yRange: string; meanX: string; stdX: string } => {
    if (normMode === 'raw') {
      return {
        xRange: `[${statsX.min.toFixed(1)}, ${statsX.max.toFixed(1)}]`,
        yRange: `[${statsY.min.toFixed(1)}, ${statsY.max.toFixed(1)}]`,
        meanX: statsX.mean.toFixed(2),
        stdX: statsX.std.toFixed(2),
      };
    } else if (normMode === 'minmax') {
      return {
        xRange: '[0.00, 1.00]',
        yRange: '[0.00, 1.00]',
        meanX: (normalizeMinMax(activeXs).reduce((a, b) => a + b, 0) / (activeXs.length || 1)).toFixed(2),
        stdX: computeStats(normalizeMinMax(activeXs)).std.toFixed(2),
      };
    } else {
      const normXs = normalizeZScore(activeXs);
      return {
        xRange: `[${Math.min(...normXs).toFixed(2)}, ${Math.max(...normXs).toFixed(2)}]`,
        yRange: `[${Math.min(...normalizeZScore(activeYs)).toFixed(2)}, ${Math.max(...normalizeZScore(activeYs)).toFixed(2)}]`,
        meanX: '0.00',
        stdX: '1.00',
      };
    }
  };

  const normStats = getNormStatsLabel();

  // Animate normalization transitions
  const animateTransition = useCallback(
    (newMode: NormMode) => {
      const active = points.filter(p => !p.removed);
      const prev = prevPositionsRef.current.length === active.length
        ? prevPositionsRef.current
        : active.map(p => ({ x: p.animX, y: p.animY }));

      const target = getNormalizedPositions(points, newMode);

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animStartRef.current = performance.now();
      const duration = 500;

      const animate = (now: number) => {
        const elapsed = now - animStartRef.current;
        const t = Math.min(elapsed / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

        setPoints(pts => {
          const newPts = [...pts];
          let activeIdx = 0;
          for (let i = 0; i < newPts.length; i++) {
            if (!newPts[i].removed) {
              if (activeIdx < prev.length && activeIdx < target.length) {
                newPts[i] = {
                  ...newPts[i],
                  animX: prev[activeIdx].x + (target[activeIdx].x - prev[activeIdx].x) * ease,
                  animY: prev[activeIdx].y + (target[activeIdx].y - prev[activeIdx].y) * ease,
                };
              }
              activeIdx++;
            }
          }
          return newPts;
        });

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          prevPositionsRef.current = target;
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [points, getNormalizedPositions]
  );

  // Switch normalization
  const switchNorm = useCallback(
    (mode: NormMode) => {
      if (mode === normMode) return;
      if (mode !== 'raw') {
        setMilestones(m => ({ ...m, triedNormalization: true }));
      }
      setNormMode(mode);
      animateTransition(mode);
    },
    [normMode, animateTransition]
  );

  // Click handler for toggling point removal
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const pad = 50;
      const W = canvas.width;
      const H = canvas.height;

      // Determine axis bounds based on normMode
      let xMin: number, xMax: number, yMin: number, yMax: number;
      if (normMode === 'raw') {
        xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      } else if (normMode === 'minmax') {
        xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      } else {
        xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      }

      const toCanvasX = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * (W - 2 * pad);
      const toCanvasY = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - 2 * pad);

      let closestIdx = -1;
      let closestDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const cx = toCanvasX(p.animX);
        const cy = toCanvasY(p.animY);
        const dist = Math.sqrt((clickX - cx) ** 2 + (clickY - cy) ** 2);
        if (dist < 18 && dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        setPoints(pts => {
          const newPts = [...pts];
          newPts[closestIdx] = { ...newPts[closestIdx], removed: !newPts[closestIdx].removed };
          return newPts;
        });
        if (!points[closestIdx].removed) {
          setMilestones(m => ({ ...m, removedOutlier: true }));
        }
      }
    },
    [points, normMode]
  );

  // --- Draw main scatter canvas ---
  const drawMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = 50;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Axis bounds
    let xMin: number, xMax: number, yMin: number, yMax: number;
    let xLabel: string, yLabel: string;
    if (normMode === 'raw') {
      xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      xLabel = 'x'; yLabel = 'y';
    } else if (normMode === 'minmax') {
      xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      xLabel = 'x (min-max)'; yLabel = 'y (min-max)';
    } else {
      xMin = -0.5; xMax = 11; yMin = -2; yMax = 32;
      xLabel = 'x (z-score)'; yLabel = 'y (z-score)';
    }

    const toX = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * (W - 2 * pad);
    const toY = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - 2 * pad);

    // Grid lines
    ctx.strokeStyle = 'rgba(100,116,139,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const xVal = xMin + (i / 10) * (xMax - xMin);
      const x = toX(xVal);
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
      const yVal = yMin + (i / 10) * (yMax - yMin);
      const y = toY(yVal);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

    // Tick marks and labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const xVal = xMin + (i / 5) * (xMax - xMin);
      const x = toX(xVal);
      ctx.beginPath(); ctx.moveTo(x, H - pad); ctx.lineTo(x, H - pad + 5); ctx.stroke();
      ctx.fillText(xVal.toFixed(1), x, H - pad + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const yVal = yMin + (i / 5) * (yMax - yMin);
      const y = toY(yVal);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad - 5, y); ctx.stroke();
      ctx.fillText(yVal.toFixed(1), pad - 8, y + 3);
    }

    // Axis labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, W / 2, H - 8);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Regression line (on active points in display space)
    const activeDisplay = points.filter(p => !p.removed);
    if (activeDisplay.length >= 2) {
      const reg = linearRegression(points);
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(reg.m * xMin + reg.b));
      ctx.lineTo(toX(xMax), toY(reg.m * xMax + reg.b));
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw points
    for (const p of points) {
      const cx = toX(p.animX);
      const cy = toY(p.animY);

      if (p.removed) {
        // Faded out
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100,116,139,0.2)';
        ctx.fill();
        // Strikethrough
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.strokeStyle = 'rgba(239,68,68,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        continue;
      }

      // Outlier ring
      if (p.isOutlier) {
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Point
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.isOutlier ? '#fbbf24' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = p.isOutlier ? '#f59e0b' : '#0ea5e9';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [points, normMode]);

  // Draw cluster comparison canvases
  const drawClusterCanvas = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      xs: number[],
      ys: number[],
      assignments: number[],
      centroids: { x: number; y: number }[],
      silScore: number,
      label: string
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const pad = 40;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      if (xs.length === 0) return;

      const xMin = Math.min(...xs) - 0.5;
      const xMax = Math.max(...xs) + 0.5;
      const yMin = Math.min(...ys) - 0.5;
      const yMax = Math.max(...ys) + 0.5;

      const toX = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * (W - 2 * pad);
      const toY = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - 2 * pad);

      // Grid
      ctx.strokeStyle = 'rgba(100,116,139,0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const x = pad + (i / 5) * (W - 2 * pad);
        ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
        const y = pad + (i / 5) * (H - 2 * pad);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

      // Points
      for (let i = 0; i < xs.length; i++) {
        const cx = toX(xs[i]);
        const cy = toY(ys[i]);
        const color = CLUSTER_COLORS[assignments[i] % CLUSTER_COLORS.length];
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Centroids as diamonds
      for (let c = 0; c < centroids.length; c++) {
        const cx = toX(centroids[c].x);
        const cy = toY(centroids[c].y);
        const s = 8;
        const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length];
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s, cy);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 16);

      // Silhouette score
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`Silhouette: ${silScore.toFixed(2)}`, W / 2, H - 8);
    },
    []
  );

  // Run k-means with animation
  const runKMeans = useCallback(() => {
    const active = points.filter(p => !p.removed);
    if (active.length < kValue) return;

    const rawXs = active.map(p => p.x);
    const rawYs = active.map(p => p.y);

    // Normalized data
    const normXs = normalizeMinMax(rawXs);
    const normYs = normalizeMinMax(rawYs);

    // Run k-means on raw
    const rawResult = kMeans(rawXs, rawYs, kValue);
    const rawSil = silhouetteScore(rawXs, rawYs, rawResult.assignments, kValue);

    // Run k-means on normalized
    const normResult = kMeans(normXs, normYs, kValue);
    const normSil = silhouetteScore(normXs, normYs, normResult.assignments, kValue);

    setRawIterations(rawResult.iterations);
    setNormIterations(normResult.iterations);
    setClusterAnimStep(0);
    setAnimatingClusters(true);
    setShowClustering(true);

    setClusterResult({
      raw: { assignments: rawResult.assignments, centroids: rawResult.centroids, silhouette: rawSil },
      norm: { assignments: normResult.assignments, centroids: normResult.centroids, silhouette: normSil },
    });

    setMilestones(m => ({ ...m, ranClustering: true }));
  }, [points, kValue]);

  // Animate k-means iterations
  useEffect(() => {
    if (!animatingClusters) return;
    const maxSteps = Math.max(rawIterations.length, normIterations.length);
    if (clusterAnimStep >= maxSteps - 1) {
      setAnimatingClusters(false);
      return;
    }

    const timer = setTimeout(() => {
      setClusterAnimStep(s => s + 1);
    }, 400);

    return () => clearTimeout(timer);
  }, [animatingClusters, clusterAnimStep, rawIterations.length, normIterations.length]);

  // Redraw main canvas
  useEffect(() => {
    drawMainCanvas();
  }, [drawMainCanvas]);

  // Redraw cluster canvases
  useEffect(() => {
    if (!showClustering) return;

    const active = points.filter(p => !p.removed);
    const rawXs = active.map(p => p.x);
    const rawYs = active.map(p => p.y);
    const normXs = normalizeMinMax(rawXs);
    const normYs = normalizeMinMax(rawYs);

    if (animatingClusters) {
      const rawStep = Math.min(clusterAnimStep, rawIterations.length - 1);
      const normStep = Math.min(clusterAnimStep, normIterations.length - 1);

      if (rawStep >= 0 && rawIterations[rawStep]) {
        drawClusterCanvas(
          clusterRawRef.current,
          rawXs, rawYs,
          rawIterations[rawStep].assignments,
          rawIterations[rawStep].centroids,
          silhouetteScore(rawXs, rawYs, rawIterations[rawStep].assignments, kValue),
          'Raw Data'
        );
      }
      if (normStep >= 0 && normIterations[normStep]) {
        drawClusterCanvas(
          clusterNormRef.current,
          normXs, normYs,
          normIterations[normStep].assignments,
          normIterations[normStep].centroids,
          silhouetteScore(normXs, normYs, normIterations[normStep].assignments, kValue),
          'Normalized Data'
        );
      }
    } else if (clusterResult) {
      drawClusterCanvas(
        clusterRawRef.current,
        rawXs, rawYs,
        clusterResult.raw.assignments,
        clusterResult.raw.centroids,
        clusterResult.raw.silhouette,
        'Raw Data'
      );
      drawClusterCanvas(
        clusterNormRef.current,
        normXs, normYs,
        clusterResult.norm.assignments,
        clusterResult.norm.centroids,
        clusterResult.norm.silhouette,
        'Normalized Data'
      );
    }
  }, [showClustering, clusterResult, animatingClusters, clusterAnimStep, rawIterations, normIterations, points, kValue, drawClusterCanvas]);

  // Initialize animated positions when normMode changes on fresh data
  useEffect(() => {
    const positions = getNormalizedPositions(points, normMode);
    prevPositionsRef.current = positions;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetPoints = () => {
    setPoints(pts => pts.map(p => ({ ...p, removed: false })));
  };

  const generateNewData = () => {
    const newPts = generateDataset();
    setPoints(newPts);
    setNormMode('raw');
    setShowClustering(false);
    setClusterResult(null);
    setAnimatingClusters(false);
    prevPositionsRef.current = newPts.map(p => ({ x: p.x, y: p.y }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(148,163,184,0.15)',
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '95vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#e2e8f0' }}>
              Data Preprocessing Lab
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Remove outliers, normalize data, and compare clustering results
            </p>
          </div>
          <button
            onClick={() => onComplete?.()}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '18px',
              lineHeight: 1,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
          {/* Main area */}
          <div style={{ flex: '1 1 650px', padding: '16px 24px' }}>
            {/* MSE Display */}
            <div
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#fb923c', marginRight: '8px' }}>MSE:</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#f97316', fontFamily: 'monospace' }}>
                {mse.toFixed(2)}
              </span>
            </div>

            {/* Normalization buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {(['raw', 'minmax', 'zscore'] as NormMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => switchNorm(mode)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    borderRadius: '6px',
                    border: normMode === mode ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.2)',
                    background: normMode === mode ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.5)',
                    color: normMode === mode ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode === 'raw' ? 'Raw' : mode === 'minmax' ? 'Min-Max [0,1]' : 'Z-Score'}
                </button>
              ))}
            </div>

            {/* Main scatter plot */}
            <canvas
              ref={mainCanvasRef}
              width={600}
              height={400}
              onClick={handleCanvasClick}
              style={{
                width: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                border: '1px solid rgba(148,163,184,0.1)',
                cursor: 'crosshair',
              }}
            />

            {/* Stats info box */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(15,23,42,0.5)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#94a3b8',
                flexWrap: 'wrap',
              }}
            >
              <span>X range: {normStats.xRange}</span>
              <span>Y range: {normStats.yRange}</span>
              <span>Mean(X): {normStats.meanX}</span>
              <span>Std(X): {normStats.stdX}</span>
              <span>Points: {activePoints.length}</span>
            </div>

            {/* Clustering section */}
            {showClustering && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <canvas
                      ref={clusterRawRef}
                      width={280}
                      height={240}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid rgba(148,163,184,0.1)',
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 260px' }}>
                    <canvas
                      ref={clusterNormRef}
                      width={280}
                      height={240}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid rgba(148,163,184,0.1)',
                      }}
                    />
                  </div>
                </div>
                {animatingClusters && (
                  <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
                    Iteration {clusterAnimStep + 1} / {Math.max(rawIterations.length, normIterations.length)}...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Controls panel */}
          <div
            style={{
              flex: '0 0 260px',
              padding: '16px',
              borderLeft: '1px solid rgba(148,163,184,0.1)',
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 12px' }}>
              Controls
            </h3>

            <button
              onClick={generateNewData}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(56,189,248,0.3)',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8',
                cursor: 'pointer',
                marginBottom: '8px',
                transition: 'all 0.2s',
              }}
            >
              Generate New Data
            </button>

            <button
              onClick={resetPoints}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(30,41,59,0.5)',
                color: '#94a3b8',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s',
              }}
            >
              Reset Points
            </button>

            {/* K slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>K (clusters)</span>
                <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>{kValue}</span>
              </div>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                value={kValue}
                onChange={e => setKValue(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <button
              onClick={runKMeans}
              disabled={animatingClusters || activePoints.length < kValue}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: animatingClusters
                  ? 'rgba(100,116,139,0.3)'
                  : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: '#fff',
                cursor: animatingClusters ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s',
              }}
            >
              {animatingClusters ? 'Running...' : 'Run K-Means'}
            </button>

            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
              Click points on the scatter plot to toggle their removal. Outliers are marked with dashed rings.
              Try removing outliers, switching normalization modes, and running k-means to see how preprocessing affects results.
            </p>

            {/* Milestones */}
            <div
              style={{
                padding: '12px',
                background: 'rgba(15,23,42,0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(148,163,184,0.1)',
              }}
            >
              <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 8px' }}>
                Milestones
              </h4>
              {[
                { key: 'removedOutlier' as const, label: 'Remove an outlier' },
                { key: 'triedNormalization' as const, label: 'Try a normalization' },
                { key: 'ranClustering' as const, label: 'Run clustering' },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '11px',
                  }}
                >
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: milestones[key]
                        ? '1px solid #22c55e'
                        : '1px solid rgba(148,163,184,0.3)',
                      background: milestones[key]
                        ? 'rgba(34,197,94,0.15)'
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#22c55e',
                      fontSize: '10px',
                      flexShrink: 0,
                    }}
                  >
                    {milestones[key] ? '\u2713' : ''}
                  </span>
                  <span style={{ color: milestones[key] ? '#22c55e' : '#64748b' }}>{label}</span>
                </div>
              ))}

              {milestones.removedOutlier && milestones.triedNormalization && milestones.ranClustering && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px',
                    background: 'rgba(34,197,94,0.1)',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#22c55e',
                    fontWeight: 600,
                  }}
                >
                  All milestones complete!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
