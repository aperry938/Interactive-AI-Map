import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ClusteringProps {
  onComplete?: () => void;
}

interface Point {
  x: number;
  y: number;
  cluster: number; // assigned cluster index (-1 = unassigned)
}

interface Centroid {
  x: number;
  y: number;
}

const CLUSTER_COLORS = [
  '#00e5ff', // cyan
  '#ff00e5', // magenta
  '#39ff14', // green
  '#ff9100', // orange
  '#ffea00', // yellow
  '#ff4081', // pink
];

const randn = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

type DatasetType = 'blobs' | 'uniform' | 'rings';

const generateBlobs = (n: number): Point[] => {
  const pts: Point[] = [];
  const centers = [[-2, -1.5], [2, 1.5], [-1, 2], [1.5, -2]];
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    pts.push({ x: c[0] + randn() * 0.7, y: c[1] + randn() * 0.7, cluster: -1 });
  }
  return pts;
};

const generateUniform = (n: number): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 6, cluster: -1 });
  }
  return pts;
};

const generateRings = (n: number): Point[] => {
  const pts: Point[] = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = 1.0 + randn() * 0.15;
    pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), cluster: -1 });
  }
  for (let i = 0; i < n - half; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = 2.8 + randn() * 0.2;
    pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), cluster: -1 });
  }
  return pts;
};

const GENERATORS: Record<DatasetType, (n: number) => Point[]> = {
  blobs: generateBlobs,
  uniform: generateUniform,
  rings: generateRings,
};

export const Clustering: React.FC<ClusteringProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [k, setK] = useState(3);
  const [dataset, setDataset] = useState<DatasetType>('blobs');
  const [points, setPoints] = useState<Point[]>(() => generateBlobs(60));
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [iteration, setIteration] = useState(0);
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const runningRef = useRef(false);

  // Reset
  const handleReset = useCallback((ds?: DatasetType) => {
    const gen = GENERATORS[ds ?? dataset];
    const newPoints = gen(60);
    setPoints(newPoints);
    setCentroids([]);
    setIteration(0);
    setConverged(false);
    setRunning(false);
    runningRef.current = false;
  }, [dataset]);

  // Initialize centroids randomly from data points
  const initCentroids = useCallback(() => {
    const shuffled = [...points].sort(() => Math.random() - 0.5);
    const initial = shuffled.slice(0, k).map(p => ({ x: p.x, y: p.y }));
    setCentroids(initial);
    setIteration(0);
    setConverged(false);
    // Assign initial clusters
    setPoints(prev => prev.map(p => {
      let minDist = Infinity;
      let minIdx = 0;
      initial.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < minDist) { minDist = d; minIdx = i; }
      });
      return { ...p, cluster: minIdx };
    }));
  }, [points, k]);

  // Single K-means step
  const step = useCallback(() => {
    if (centroids.length === 0) return false;

    // 1. Compute new centroids from current assignments
    const sums: Array<{ sx: number; sy: number; count: number }> = Array.from(
      { length: k }, () => ({ sx: 0, sy: 0, count: 0 })
    );
    for (const p of points) {
      if (p.cluster >= 0 && p.cluster < k) {
        sums[p.cluster].sx += p.x;
        sums[p.cluster].sy += p.y;
        sums[p.cluster].count++;
      }
    }
    const newCentroids = centroids.map((c, i) => {
      if (sums[i].count === 0) return c;
      return { x: sums[i].sx / sums[i].count, y: sums[i].sy / sums[i].count };
    });

    // 2. Reassign points to nearest centroid
    let changed = false;
    const newPoints = points.map(p => {
      let minDist = Infinity;
      let minIdx = 0;
      newCentroids.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < minDist) { minDist = d; minIdx = i; }
      });
      if (minIdx !== p.cluster) changed = true;
      return { ...p, cluster: minIdx };
    });

    setCentroids(newCentroids);
    setPoints(newPoints);
    setIteration(prev => prev + 1);

    if (!changed) {
      setConverged(true);
      setRunning(false);
      runningRef.current = false;
      onComplete?.();
      return false;
    }
    return true;
  }, [centroids, points, k, onComplete]);

  // Auto-run
  useEffect(() => {
    if (!running) return;
    runningRef.current = true;
    const interval = setInterval(() => {
      if (!runningRef.current) { clearInterval(interval); return; }
      const cont = step();
      if (!cont) { clearInterval(interval); }
    }, 500);
    return () => clearInterval(interval);
  }, [running, step]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Coordinate transform: data space [-5,5] → canvas
    const padX = 40, padY = 40;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const toCanvasX = (x: number) => padX + ((x + 5) / 10) * plotW;
    const toCanvasY = (y: number) => padY + ((5 - y) / 10) * plotH;

    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let v = -4; v <= 4; v += 2) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(v), padY);
      ctx.lineTo(toCanvasX(v), height - padY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padX, toCanvasY(v));
      ctx.lineTo(width - padX, toCanvasY(v));
      ctx.stroke();
    }

    // Voronoi regions (if centroids exist)
    if (centroids.length > 0) {
      for (let px = padX; px < width - padX; px += 4) {
        for (let py = padY; py < height - padY; py += 4) {
          const dx = ((px - padX) / plotW) * 10 - 5;
          const dy = 5 - ((py - padY) / plotH) * 10;
          let minDist = Infinity;
          let minIdx = 0;
          centroids.forEach((c, i) => {
            const d = (dx - c.x) ** 2 + (dy - c.y) ** 2;
            if (d < minDist) { minDist = d; minIdx = i; }
          });
          const color = CLUSTER_COLORS[minIdx % CLUSTER_COLORS.length];
          ctx.fillStyle = color.replace(')', ',0.04)').replace('rgb', 'rgba').replace('#', '');
          // Hex to rgba for region fill
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},0.04)`;
          ctx.fillRect(px, py, 4, 4);
        }
      }
    }

    // Draw points
    for (const p of points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const color = p.cluster >= 0 ? CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length] : 'rgba(255,255,255,0.3)';

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw centroids
    for (let i = 0; i < centroids.length; i++) {
      const c = centroids[i];
      const cx = toCanvasX(c.x);
      const cy = toCanvasY(c.y);
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];

      // Glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
      grad.addColorStop(0, color.replace(')', ',0.3)').replace('rgb', 'rgba'));
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
      glowGrad.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Cross marker
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy + 7);
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Iteration counter
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText(`iteration: ${iteration}`, padX, height - 12);

    if (converged) {
      ctx.fillStyle = '#39ff14';
      ctx.textAlign = 'right';
      ctx.fillText('CONVERGED', width - padX, height - 12);
    }
  }, [points, centroids, iteration, converged]);

  // Click to add point
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const padX = 40, padY = 40;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const dataX = ((mx - padX) / plotW) * 10 - 5;
    const dataY = 5 - ((my - padY) / plotH) * 10;

    if (dataX < -5 || dataX > 5 || dataY < -5 || dataY > 5) return;

    setPoints(prev => [...prev, { x: dataX, y: dataY, cluster: -1 }]);
  }, []);

  return (
    <div className="h-full flex flex-col md:flex-row" style={{ backgroundColor: '#0a0e17' }}>
      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative min-h-[300px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Control panel */}
      <div className="w-full md:w-[260px] p-4 flex flex-col gap-4 border-l border-white/[0.06]" style={{ backgroundColor: '#0b1121' }}>
        <h3 className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold">K-Means Clustering</h3>

        {/* K selector */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.15em] text-white/30 block mb-1">Clusters (K)</label>
          <div className="flex gap-1.5">
            {[2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => { setK(v); setCentroids([]); setIteration(0); setConverged(false); }}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  k === v ? 'bg-white/15 text-white/80' : 'bg-white/[0.06] text-white/30 hover:bg-white/10'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.15em] text-white/30 block mb-1">Dataset</label>
          <div className="flex flex-col gap-1">
            {(['blobs', 'uniform', 'rings'] as DatasetType[]).map(ds => (
              <button
                key={ds}
                onClick={() => { setDataset(ds); handleReset(ds); }}
                className={`px-3 py-1.5 text-xs rounded text-left capitalize transition-colors ${
                  dataset === ds ? 'bg-white/15 text-white/80' : 'bg-white/[0.06] text-white/30 hover:bg-white/10'
                }`}
              >
                {ds}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {centroids.length === 0 ? (
            <button
              onClick={initCentroids}
              className="px-4 py-2 text-xs uppercase tracking-wider rounded bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30 transition-colors"
            >
              Initialize
            </button>
          ) : (
            <>
              <button
                onClick={() => { if (!converged) step(); }}
                disabled={converged}
                className="px-4 py-2 text-xs uppercase tracking-wider rounded bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors disabled:opacity-30"
              >
                Step
              </button>
              <button
                onClick={() => { setRunning(!running); runningRef.current = !running; }}
                disabled={converged}
                className={`px-4 py-2 text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-30 ${
                  running ? 'bg-[#ff9100]/20 text-[#ff9100]' : 'bg-[#ffea00]/20 text-[#ffea00]'
                }`}
              >
                {running ? 'Pause' : 'Auto-Run'}
              </button>
            </>
          )}
          <button
            onClick={() => handleReset()}
            className="px-4 py-2 text-xs uppercase tracking-wider rounded bg-white/[0.06] text-white/40 hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Stats */}
        {centroids.length > 0 && (
          <div className="mt-auto pt-4 border-t border-white/[0.06]">
            <div className="text-[9px] uppercase tracking-[0.15em] text-white/25 mb-2">Cluster Sizes</div>
            <div className="space-y-1">
              {Array.from({ length: k }, (_, i) => {
                const count = points.filter(p => p.cluster === i).length;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[i] }} />
                    <span className="text-xs text-white/40 font-mono">{count} points</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-white/15 leading-relaxed mt-2">
          Click canvas to add points. Initialize to place random centroids, then step or auto-run to watch K-means converge.
        </p>
      </div>
    </div>
  );
};
