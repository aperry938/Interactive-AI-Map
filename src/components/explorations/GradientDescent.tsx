import React, { useState, useRef, useEffect, useCallback } from 'react';

interface GradientDescentProps {
    onComplete?: () => void;
    onClose?: () => void;
}

interface Point {
    x: number;
    y: number;
}

interface GDState {
    w: number;
    b: number;
}

// --- Math utilities ---

const generateData = (n: number, trueW: number, trueB: number, noise: number): Point[] => {
    const points: Point[] = [];
    for (let i = 0; i < n; i++) {
        const x = Math.random() * 10;
        const y = trueW * x + trueB + (Math.random() - 0.5) * noise;
        points.push({ x, y });
    }
    return points;
};

const computeMSE = (w: number, b: number, data: Point[]): number => {
    if (data.length === 0) return 0;
    let sum = 0;
    for (const p of data) {
        const pred = w * p.x + b;
        sum += (pred - p.y) ** 2;
    }
    return sum / data.length;
};

const computeGradient = (w: number, b: number, data: Point[]): { dw: number; db: number } => {
    if (data.length === 0) return { dw: 0, db: 0 };
    let dw = 0, db = 0;
    for (const p of data) {
        const pred = w * p.x + b;
        const err = pred - p.y;
        dw += 2 * err * p.x;
        db += 2 * err;
    }
    return { dw: dw / data.length, db: db / data.length };
};

// --- Color helpers ---

const lerpColor = (t: number): string => {
    // blue(low) -> cyan -> green -> yellow -> red(high)
    t = Math.max(0, Math.min(1, t));
    const stops = [
        [0, 100, 255],
        [0, 220, 255],
        [0, 255, 100],
        [255, 255, 0],
        [255, 60, 30],
    ];
    const idx = t * (stops.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, stops.length - 1);
    const f = idx - lo;
    const r = Math.round(stops[lo][0] + f * (stops[hi][0] - stops[lo][0]));
    const g = Math.round(stops[lo][1] + f * (stops[hi][1] - stops[lo][1]));
    const b = Math.round(stops[lo][2] + f * (stops[hi][2] - stops[lo][2]));
    return `rgb(${r},${g},${b})`;
};

// --- 3D projection helpers ---

const project3D = (
    x: number, y: number, z: number,
    azimuth: number, elevation: number,
    cx: number, cy: number, scale: number
): { sx: number; sy: number; depth: number } => {
    const cosA = Math.cos(azimuth);
    const sinA = Math.sin(azimuth);
    const cosE = Math.cos(elevation);
    const sinE = Math.sin(elevation);

    const rx = cosA * x + sinA * z;
    const rz = -sinA * x + cosA * z;
    const ry2 = cosE * y - sinE * rz;
    const rz2 = sinE * y + cosE * rz;

    const perspective = 4 / (4 + rz2 * 0.3);
    return {
        sx: cx + rx * scale * perspective,
        sy: cy - ry2 * scale * perspective,
        depth: rz2,
    };
};

// --- Constants ---
const NEON_CYAN = '#00e5ff';
const NEON_MAGENTA = '#ff00e5';
const NEON_GREEN = '#39ff14';
const NEON_ORANGE = '#ff9100';
const NEON_YELLOW = '#ffea00';
const DARK_BG = '#0a0e17';
const PANEL_BG = '#111827';
const BORDER_COLOR = '#1e293b';

export const GradientDescent: React.FC<GradientDescentProps> = ({ onComplete, onClose }) => {
    // Data
    const [data, setData] = useState<Point[]>(() => generateData(15, 2.5, 3, 4));

    // Model params
    const [weight, setWeight] = useState(0.5);
    const [bias, setBias] = useState(0.5);

    // GD config
    const [learningRate, setLearningRate] = useState(0.05);
    const [useMomentum, setUseMomentum] = useState(false);
    const [beta, setBeta] = useState(0.9);

    // GD state
    const [gdPath, setGdPath] = useState<GDState[]>([{ w: 0.5, b: 0.5 }]);
    const [steps, setSteps] = useState(0);
    const [autoRun, setAutoRun] = useState(false);
    const autoRunRef = useRef(false);

    // Momentum velocity
    const velW = useRef(0);
    const velB = useRef(0);

    // 3D surface rotation
    const [azimuth, setAzimuth] = useState(0.6);
    const [elevation, setElevation] = useState(0.5);
    const dragging3D = useRef(false);
    const lastMouse3D = useRef({ x: 0, y: 0 });

    // Learning rate comparison
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonPaths, setComparisonPaths] = useState<{ left: GDState[]; right: GDState[] }>({ left: [], right: [] });
    const [comparisonRunning, setComparisonRunning] = useState(false);

    // Canvas refs
    const scatterRef = useRef<HTMLCanvasElement>(null);
    const surfaceRef = useRef<HTMLCanvasElement>(null);
    const compLeftRef = useRef<HTMLCanvasElement>(null);
    const compRightRef = useRef<HTMLCanvasElement>(null);

    // Completion tracking
    const completedRef = useRef(false);

    const mse = computeMSE(weight, bias, data);

    // Check completion
    useEffect(() => {
        if (mse < 0.5 && !completedRef.current && onComplete) {
            completedRef.current = true;
            onComplete();
        }
    }, [mse, onComplete]);

    // --- Generate new data ---
    const regenerateData = useCallback(() => {
        const trueW = 1.5 + Math.random() * 2;
        const trueB = 1 + Math.random() * 5;
        const noise = 2 + Math.random() * 4;
        setData(generateData(15, trueW, trueB, noise));
        resetGD();
    }, []);

    // --- GD step ---
    const doStep = useCallback(() => {
        const grad = computeGradient(weight, bias, data);

        let newW: number, newB: number;
        if (useMomentum) {
            velW.current = beta * velW.current + (1 - beta) * grad.dw;
            velB.current = beta * velB.current + (1 - beta) * grad.db;
            newW = weight - learningRate * velW.current;
            newB = bias - learningRate * velB.current;
        } else {
            newW = weight - learningRate * grad.dw;
            newB = bias - learningRate * grad.db;
        }

        // Clamp to prevent divergence going way off screen
        newW = Math.max(-10, Math.min(10, newW));
        newB = Math.max(-20, Math.min(30, newB));

        setWeight(newW);
        setBias(newB);
        setGdPath(prev => [...prev, { w: newW, b: newB }]);
        setSteps(s => s + 1);
    }, [weight, bias, data, learningRate, useMomentum, beta]);

    const resetGD = useCallback(() => {
        setWeight(0.5);
        setBias(0.5);
        setGdPath([{ w: 0.5, b: 0.5 }]);
        setSteps(0);
        setAutoRun(false);
        autoRunRef.current = false;
        velW.current = 0;
        velB.current = 0;
        completedRef.current = false;
    }, []);

    // Auto-run loop
    useEffect(() => {
        autoRunRef.current = autoRun;
    }, [autoRun]);

    useEffect(() => {
        if (!autoRun) return;

        let frameId: number;
        let lastTime = 0;
        const interval = 50; // ms per step

        const loop = (time: number) => {
            if (!autoRunRef.current) return;
            if (time - lastTime >= interval) {
                lastTime = time;
                doStep();
            }
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [autoRun, doStep]);

    // --- Click to add/remove points on scatter canvas ---
    const handleScatterClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = scatterRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        const pad = 40;
        const W = canvas.width;
        const H = canvas.height;
        const xMin = 0, xMax = 10;
        const yMin = -5, yMax = 35;
        const dataX = xMin + ((px - pad) / (W - 2 * pad)) * (xMax - xMin);
        const dataY = yMax - ((py - pad) / (H - 2 * pad)) * (yMax - yMin);

        if (e.shiftKey) {
            // Remove nearest point
            if (data.length <= 2) return;
            let minDist = Infinity;
            let minIdx = 0;
            data.forEach((p, i) => {
                const d = (p.x - dataX) ** 2 + (p.y - dataY) ** 2;
                if (d < minDist) { minDist = d; minIdx = i; }
            });
            setData(prev => prev.filter((_, i) => i !== minIdx));
        } else {
            // Add point
            if (dataX >= xMin && dataX <= xMax && dataY >= yMin && dataY <= yMax) {
                setData(prev => [...prev, { x: dataX, y: dataY }]);
            }
        }
    }, [data]);

    // --- Draw scatter plot ---
    const drawScatter = useCallback(() => {
        const canvas = scatterRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const pad = 40;

        ctx.fillStyle = DARK_BG;
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(100,200,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = pad + (i / 10) * (W - 2 * pad);
            ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
            const y = pad + (i / 10) * (H - 2 * pad);
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
        }

        // Axes labels
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('x', W / 2, H - 8);
        ctx.save();
        ctx.translate(12, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('y', 0, 0);
        ctx.restore();

        // Axis tick labels
        const xMin = 0, xMax = 10, yMin = -5, yMax = 35;
        const sx = (v: number) => pad + ((v - xMin) / (xMax - xMin)) * (W - 2 * pad);
        const sy = (v: number) => H - pad - ((v - yMin) / (yMax - yMin)) * (H - 2 * pad);

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 10; i += 2) {
            ctx.fillText(String(i), sx(i), H - pad + 14);
        }
        ctx.textAlign = 'right';
        for (let v = 0; v <= 30; v += 10) {
            ctx.fillText(String(v), pad - 6, sy(v) + 3);
        }

        // Residual lines
        ctx.strokeStyle = 'rgba(255,0,229,0.2)';
        ctx.lineWidth = 1;
        for (const p of data) {
            const pred = weight * p.x + bias;
            ctx.beginPath();
            ctx.moveTo(sx(p.x), sy(p.y));
            ctx.lineTo(sx(p.x), sy(pred));
            ctx.stroke();
        }

        // Regression line
        ctx.beginPath();
        ctx.moveTo(sx(xMin), sy(weight * xMin + bias));
        ctx.lineTo(sx(xMax), sy(weight * xMax + bias));
        ctx.strokeStyle = NEON_CYAN;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = NEON_CYAN;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Data points
        for (const p of data) {
            ctx.beginPath();
            ctx.arc(sx(p.x), sy(p.y), 5, 0, 2 * Math.PI);
            ctx.fillStyle = NEON_MAGENTA;
            ctx.shadowColor = NEON_MAGENTA;
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,0,229,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // MSE display
        ctx.fillStyle = NEON_YELLOW;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = NEON_YELLOW;
        ctx.shadowBlur = 6;
        ctx.fillText(`MSE: ${mse.toFixed(3)}`, pad + 8, pad + 18);
        ctx.shadowBlur = 0;

        // Hint text
        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Click to add point | Shift+click to remove', W - pad - 4, pad + 14);
    }, [data, weight, bias, mse]);

    // --- Draw 3D cost surface ---
    const drawSurface = useCallback(() => {
        const canvas = surfaceRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = DARK_BG;
        ctx.fillRect(0, 0, W, H);

        const wMin = -1, wMax = 5, bMin = -5, bMax = 15;
        const gridRes = 20;

        // Precompute MSE grid
        const mseGrid: number[][] = [];
        let maxMSE = 0;
        for (let i = 0; i <= gridRes; i++) {
            const row: number[] = [];
            for (let j = 0; j <= gridRes; j++) {
                const w = wMin + (j / gridRes) * (wMax - wMin);
                const b = bMin + (i / gridRes) * (bMax - bMin);
                const v = computeMSE(w, b, data);
                row.push(v);
                if (v > maxMSE) maxMSE = v;
            }
            mseGrid.push(row);
        }

        const cx = W / 2;
        const cy = H / 2 + 20;
        const scale = Math.min(W, H) * 0.28;

        // Project grid to 3D
        const projected: { sx: number; sy: number; depth: number }[][] = [];
        for (let i = 0; i <= gridRes; i++) {
            const row: { sx: number; sy: number; depth: number }[] = [];
            for (let j = 0; j <= gridRes; j++) {
                const nx = (j / gridRes) * 2 - 1;
                const nz = (i / gridRes) * 2 - 1;
                const ny = Math.min(mseGrid[i][j] / (maxMSE * 0.4), 1) * 1.5;
                row.push(project3D(nx, ny, nz, azimuth, elevation, cx, cy, scale));
            }
            projected.push(row);
        }

        // Collect quads with depth for painter's sort
        const quads: { depth: number; points: { sx: number; sy: number }[]; color: string }[] = [];
        for (let i = 0; i < gridRes; i++) {
            for (let j = 0; j < gridRes; j++) {
                const p0 = projected[i][j];
                const p1 = projected[i][j + 1];
                const p2 = projected[i + 1][j + 1];
                const p3 = projected[i + 1][j];
                const avgDepth = (p0.depth + p1.depth + p2.depth + p3.depth) / 4;
                const avgMSE = (mseGrid[i][j] + mseGrid[i][j + 1] + mseGrid[i + 1][j + 1] + mseGrid[i + 1][j]) / 4;
                const norm = Math.min(avgMSE / (maxMSE * 0.4), 1);
                quads.push({
                    depth: avgDepth,
                    points: [p0, p1, p2, p3],
                    color: lerpColor(norm),
                });
            }
        }

        // Sort back to front
        quads.sort((a, b) => b.depth - a.depth);

        // Draw filled quads
        for (const q of quads) {
            ctx.beginPath();
            ctx.moveTo(q.points[0].sx, q.points[0].sy);
            for (let k = 1; k < q.points.length; k++) {
                ctx.lineTo(q.points[k].sx, q.points[k].sy);
            }
            ctx.closePath();
            ctx.fillStyle = q.color;
            ctx.globalAlpha = 0.55;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Draw GD trail on surface
        if (gdPath.length > 1) {
            ctx.beginPath();
            let first = true;
            for (const pt of gdPath) {
                const nxP = ((pt.w - wMin) / (wMax - wMin)) * 2 - 1;
                const nzP = ((pt.b - bMin) / (bMax - bMin)) * 2 - 1;
                const mseP = computeMSE(pt.w, pt.b, data);
                const nyP = Math.min(mseP / (maxMSE * 0.4), 1) * 1.5;
                const pp = project3D(nxP, nyP, nzP, azimuth, elevation, cx, cy, scale);
                if (first) { ctx.moveTo(pp.sx, pp.sy); first = false; }
                else ctx.lineTo(pp.sx, pp.sy);
            }
            ctx.strokeStyle = NEON_GREEN;
            ctx.lineWidth = 2;
            ctx.shadowColor = NEON_GREEN;
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Current position marker
        const curNx = ((weight - wMin) / (wMax - wMin)) * 2 - 1;
        const curNz = ((bias - bMin) / (bMax - bMin)) * 2 - 1;
        const curMSE = computeMSE(weight, bias, data);
        const curNy = Math.min(curMSE / (maxMSE * 0.4), 1) * 1.5;
        const curP = project3D(curNx, curNy, curNz, azimuth, elevation, cx, cy, scale);

        ctx.beginPath();
        ctx.arc(curP.sx, curP.sy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = NEON_YELLOW;
        ctx.shadowColor = NEON_YELLOW;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Momentum ghost ball
        if (useMomentum && gdPath.length > 2) {
            const prev = gdPath[gdPath.length - 2];
            const ghostNx = ((prev.w - wMin) / (wMax - wMin)) * 2 - 1;
            const ghostNz = ((prev.b - bMin) / (bMax - bMin)) * 2 - 1;
            const ghostMSE = computeMSE(prev.w, prev.b, data);
            const ghostNy = Math.min(ghostMSE / (maxMSE * 0.4), 1) * 1.5;
            const ghostP = project3D(ghostNx, ghostNy, ghostNz, azimuth, elevation, cx, cy, scale);

            ctx.beginPath();
            ctx.arc(ghostP.sx, ghostP.sy, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,234,0,0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,234,0,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const wLabel = project3D(0, -0.15, 1.15, azimuth, elevation, cx, cy, scale);
        ctx.fillText('weight', wLabel.sx, wLabel.sy);
        const bLabel = project3D(1.15, -0.15, 0, azimuth, elevation, cx, cy, scale);
        ctx.fillText('bias', bLabel.sx, bLabel.sy);

        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Drag to rotate', 10, H - 10);
    }, [data, weight, bias, gdPath, azimuth, elevation, useMomentum]);

    // 3D surface mouse drag
    const handleSurfaceMouseDown = useCallback((e: React.MouseEvent) => {
        dragging3D.current = true;
        lastMouse3D.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleSurfaceMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging3D.current) return;
        const dx = e.clientX - lastMouse3D.current.x;
        const dy = e.clientY - lastMouse3D.current.y;
        setAzimuth(prev => prev + dx * 0.01);
        setElevation(prev => Math.max(-1.2, Math.min(1.2, prev + dy * 0.01)));
        lastMouse3D.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleSurfaceMouseUp = useCallback(() => {
        dragging3D.current = false;
    }, []);

    // --- Learning rate comparison ---
    const runComparison = useCallback(() => {
        setShowComparison(true);
        setComparisonRunning(true);

        const leftLR = learningRate;
        const rightLR = learningRate < 0.1 ? Math.min(learningRate * 10, 1.0) : learningRate * 0.1;

        const maxSteps = 200;
        const leftPath: GDState[] = [{ w: 0.5, b: 0.5 }];
        const rightPath: GDState[] = [{ w: 0.5, b: 0.5 }];

        let lw = 0.5, lb = 0.5;
        let rw = 0.5, rb = 0.5;

        for (let i = 0; i < maxSteps; i++) {
            const lg = computeGradient(lw, lb, data);
            lw -= leftLR * lg.dw;
            lb -= leftLR * lg.db;
            lw = Math.max(-10, Math.min(10, lw));
            lb = Math.max(-20, Math.min(30, lb));
            leftPath.push({ w: lw, b: lb });

            const rg = computeGradient(rw, rb, data);
            rw -= rightLR * rg.dw;
            rb -= rightLR * rg.db;
            rw = Math.max(-10, Math.min(10, rw));
            rb = Math.max(-20, Math.min(30, rb));
            rightPath.push({ w: rw, b: rb });
        }

        setComparisonPaths({ left: leftPath, right: rightPath });

        // Animate frame by frame
        let frame = 0;
        const animate = () => {
            frame += 2;
            if (frame >= maxSteps) {
                setComparisonRunning(false);
                return;
            }
            setComparisonPaths({
                left: leftPath.slice(0, frame + 1),
                right: rightPath.slice(0, frame + 1),
            });
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [learningRate, data]);

    // Draw comparison contour plot
    const drawContour = useCallback((
        canvas: HTMLCanvasElement | null,
        path: GDState[],
        lr: number,
        label: string,
        color: string
    ) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const pad = 30;

        ctx.fillStyle = DARK_BG;
        ctx.fillRect(0, 0, W, H);

        const wMin = -1, wMax = 5, bMin = -5, bMax = 15;

        // Contour heatmap
        const res = 3;
        let maxMSE = 0;
        const vals: number[][] = [];
        for (let py = 0; py < H - 2 * pad; py += res) {
            const row: number[] = [];
            for (let px = 0; px < W - 2 * pad; px += res) {
                const w = wMin + (px / (W - 2 * pad)) * (wMax - wMin);
                const b = bMax - (py / (H - 2 * pad)) * (bMax - bMin);
                const v = computeMSE(w, b, data);
                row.push(v);
                if (v > maxMSE) maxMSE = v;
            }
            vals.push(row);
        }

        for (let py = 0; py < vals.length; py++) {
            for (let px = 0; px < vals[py].length; px++) {
                const norm = Math.min(vals[py][px] / (maxMSE * 0.3), 1);
                const brightness = Math.round(10 + norm * 30);
                ctx.fillStyle = `rgb(${brightness},${brightness + 5},${brightness + 15})`;
                ctx.fillRect(pad + px * res, pad + py * res, res, res);
            }
        }

        // Draw contour lines
        const levels = [5, 15, 30, 60, 100, 200];
        ctx.strokeStyle = 'rgba(100,200,255,0.12)';
        ctx.lineWidth = 0.5;
        for (const level of levels) {
            for (let py = 1; py < vals.length; py++) {
                for (let px = 1; px < vals[py].length; px++) {
                    const v00 = vals[py - 1][px - 1];
                    const v10 = vals[py][px - 1];
                    if ((v00 < level) !== (v10 < level)) {
                        const x = pad + px * res;
                        const y = pad + py * res;
                        ctx.beginPath();
                        ctx.moveTo(x - res, y);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                }
            }
        }

        const sw = (w: number) => pad + ((w - wMin) / (wMax - wMin)) * (W - 2 * pad);
        const sb = (b: number) => pad + ((bMax - b) / (bMax - bMin)) * (H - 2 * pad);

        // Path
        if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(sw(path[0].w), sb(path[0].b));
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(sw(path[i].w), sb(path[i].b));
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Current pos
            const last = path[path.length - 1];
            ctx.beginPath();
            ctx.arc(sw(last.w), sb(last.b), 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Start marker
        ctx.beginPath();
        ctx.arc(sw(0.5), sb(0.5), 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.textAlign = 'left';
        ctx.fillText(label, pad + 4, pad + 14);
        ctx.fillText(`LR = ${lr.toFixed(4)}`, pad + 4, pad + 28);
        ctx.shadowBlur = 0;

        // Result
        if (path.length > 1) {
            const finalMSE = computeMSE(path[path.length - 1].w, path[path.length - 1].b, data);
            const diverged = finalMSE > 50;
            ctx.fillStyle = diverged ? '#ff4444' : NEON_GREEN;
            ctx.font = '10px monospace';
            ctx.fillText(diverged ? 'Diverged / Oscillating' : `Converged (MSE: ${finalMSE.toFixed(2)})`, pad + 4, H - pad - 6);
        }

        // Axis labels
        ctx.fillStyle = '#475569';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('weight', W / 2, H - 4);
        ctx.save();
        ctx.translate(8, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('bias', 0, 0);
        ctx.restore();
    }, [data]);

    // --- Redraw canvases ---
    useEffect(() => { drawScatter(); }, [drawScatter]);
    useEffect(() => { drawSurface(); }, [drawSurface]);
    useEffect(() => {
        if (showComparison) {
            const leftLR = learningRate;
            const rightLR = learningRate < 0.1 ? Math.min(learningRate * 10, 1.0) : learningRate * 0.1;
            drawContour(compLeftRef.current, comparisonPaths.left, leftLR, 'Your LR', NEON_CYAN);
            drawContour(compRightRef.current, comparisonPaths.right, rightLR, 'Contrast LR', NEON_ORANGE);
        }
    }, [showComparison, comparisonPaths, drawContour, learningRate]);

    // --- Slider component ---
    const Slider: React.FC<{
        label: string; value: number; min: number; max: number; step: number;
        onChange: (v: number) => void; display: string; color?: string;
    }> = ({ label, value, min, max, step, onChange, display, color = NEON_CYAN }) => (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{label}</span>
                <span style={{ fontSize: 11, color, fontFamily: 'monospace' }}>{display}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: color, height: 4, cursor: 'pointer' }}
            />
        </div>
    );

    // --- Button component ---
    const Btn: React.FC<{
        children: React.ReactNode; onClick: () => void; active?: boolean;
        color?: string; small?: boolean; disabled?: boolean;
    }> = ({ children, onClick, active, color = NEON_CYAN, small, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: small ? '4px 10px' : '6px 14px',
                fontSize: small ? 10 : 11,
                fontFamily: 'monospace',
                fontWeight: 600,
                background: active ? color : 'transparent',
                color: active ? DARK_BG : color,
                border: `1px solid ${active ? color : 'rgba(100,200,255,0.2)'}`,
                borderRadius: 6,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap' as const,
            }}
        >
            {children}
        </button>
    );

    return (
        <div style={{
            background: DARK_BG,
            color: '#e2e8f0',
            fontFamily: 'monospace',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div>
                    <h1 style={{
                        fontSize: 20, fontWeight: 700, margin: 0,
                        color: NEON_CYAN,
                        textShadow: `0 0 10px ${NEON_CYAN}40`,
                    }}>
                        Gradient Descent Explorer
                    </h1>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                        Interactive linear regression with gradient descent visualization
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                        fontSize: 10, color: '#475569', padding: '3px 8px',
                        background: '#1e293b', borderRadius: 4,
                    }}>
                        Steps: {steps}
                    </span>
                    <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: mse < 0.5 ? NEON_GREEN : mse < 5 ? NEON_YELLOW : NEON_ORANGE,
                        padding: '3px 10px',
                        background: '#1e293b', borderRadius: 4,
                        textShadow: `0 0 6px ${mse < 0.5 ? NEON_GREEN : mse < 5 ? NEON_YELLOW : NEON_ORANGE}40`,
                    }}>
                        MSE: {mse.toFixed(3)}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Main content area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                    {/* Top row: Scatter + 3D Surface */}
                    <div style={{ display: 'flex', gap: 1, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                        {/* Scatter plot */}
                        <div style={{ flex: 1, padding: 12, borderRight: `1px solid ${BORDER_COLOR}` }}>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                                2D Regression View
                            </div>
                            <canvas
                                ref={scatterRef}
                                width={500}
                                height={360}
                                onClick={handleScatterClick}
                                style={{
                                    width: '100%', maxHeight: 360, borderRadius: 6,
                                    border: `1px solid ${BORDER_COLOR}`, cursor: 'crosshair',
                                }}
                            />
                        </div>

                        {/* 3D surface */}
                        <div style={{ flex: 1, padding: 12 }}>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                                3D Cost Surface
                            </div>
                            <canvas
                                ref={surfaceRef}
                                width={500}
                                height={360}
                                onMouseDown={handleSurfaceMouseDown}
                                onMouseMove={handleSurfaceMouseMove}
                                onMouseUp={handleSurfaceMouseUp}
                                onMouseLeave={handleSurfaceMouseUp}
                                style={{
                                    width: '100%', maxHeight: 360, borderRadius: 6,
                                    border: `1px solid ${BORDER_COLOR}`, cursor: 'grab',
                                }}
                            />
                        </div>
                    </div>

                    {/* Learning rate comparison */}
                    {showComparison && (
                        <div style={{ padding: 12, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                                    Learning Rate Comparison
                                </div>
                                <Btn onClick={() => setShowComparison(false)} small color="#ef4444">Close</Btn>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <canvas
                                        ref={compLeftRef}
                                        width={400}
                                        height={280}
                                        style={{
                                            width: '100%', maxHeight: 280, borderRadius: 6,
                                            border: `1px solid ${BORDER_COLOR}`,
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <canvas
                                        ref={compRightRef}
                                        width={400}
                                        height={280}
                                        style={{
                                            width: '100%', maxHeight: 280, borderRadius: 6,
                                            border: `1px solid ${BORDER_COLOR}`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls panel */}
                <div style={{
                    width: 260, flexShrink: 0,
                    background: PANEL_BG,
                    borderLeft: `1px solid ${BORDER_COLOR}`,
                    padding: 16,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}>
                    {/* Parameters section */}
                    <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 2 }}>
                        Parameters
                    </div>

                    <Slider
                        label="Learning Rate" value={learningRate}
                        min={0.001} max={1.0} step={0.001}
                        onChange={setLearningRate}
                        display={learningRate.toFixed(3)}
                        color={NEON_CYAN}
                    />
                    <Slider
                        label="Weight (w)" value={weight}
                        min={-2} max={6} step={0.05}
                        onChange={v => { setWeight(v); setAutoRun(false); autoRunRef.current = false; }}
                        display={weight.toFixed(2)}
                        color={NEON_MAGENTA}
                    />
                    <Slider
                        label="Bias (b)" value={bias}
                        min={-10} max={20} step={0.05}
                        onChange={v => { setBias(v); setAutoRun(false); autoRunRef.current = false; }}
                        display={bias.toFixed(2)}
                        color={NEON_MAGENTA}
                    />

                    {/* Momentum section */}
                    <div style={{
                        marginTop: 8, padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${BORDER_COLOR}`,
                        borderRadius: 6,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>
                                Optimizer
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <Btn onClick={() => { setUseMomentum(false); velW.current = 0; velB.current = 0; }} active={!useMomentum} small color={NEON_CYAN}>
                                    SGD
                                </Btn>
                                <Btn onClick={() => setUseMomentum(true)} active={useMomentum} small color={NEON_GREEN}>
                                    Momentum
                                </Btn>
                            </div>
                        </div>
                        {useMomentum && (
                            <Slider
                                label="Beta" value={beta}
                                min={0.0} max={0.99} step={0.01}
                                onChange={setBeta}
                                display={beta.toFixed(2)}
                                color={NEON_GREEN}
                            />
                        )}
                    </div>

                    {/* Action buttons */}
                    <div style={{
                        marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                        <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 2 }}>
                            Controls
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1 }}>
                                <Btn onClick={doStep} disabled={autoRun}>Step</Btn>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Btn
                                    onClick={() => { setAutoRun(!autoRun); autoRunRef.current = !autoRun; }}
                                    active={autoRun}
                                    color={autoRun ? NEON_GREEN : NEON_CYAN}
                                >
                                    {autoRun ? 'Stop' : 'Auto-run'}
                                </Btn>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ flex: 1 }}>
                                <Btn onClick={resetGD} color={NEON_ORANGE}>Reset</Btn>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Btn onClick={regenerateData} color={NEON_MAGENTA}>New Data</Btn>
                            </div>
                        </div>

                        <div style={{ marginTop: 4 }}>
                            <Btn
                                onClick={runComparison}
                                disabled={comparisonRunning}
                                color={NEON_YELLOW}
                            >
                                Compare Learning Rates
                            </Btn>
                        </div>
                    </div>

                    {/* Info section */}
                    <div style={{
                        marginTop: 'auto', paddingTop: 14,
                        borderTop: `1px solid ${BORDER_COLOR}`,
                    }}>
                        <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 6 }}>
                            How it works
                        </div>
                        <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                            Gradient descent iteratively adjusts weight and bias to minimize the Mean Squared Error (MSE) between predictions and actual data points.
                            {useMomentum
                                ? ' Momentum smooths updates using an exponentially weighted average of past gradients, often leading to faster convergence.'
                                : ' Vanilla SGD updates parameters directly by the gradient scaled by the learning rate.'
                            }
                        </p>
                        {mse < 0.5 && (
                            <div style={{
                                marginTop: 8, padding: '6px 10px',
                                background: `${NEON_GREEN}15`,
                                border: `1px solid ${NEON_GREEN}40`,
                                borderRadius: 6,
                                fontSize: 10, color: NEON_GREEN, textAlign: 'center' as const,
                            }}>
                                Excellent fit achieved! MSE &lt; 0.5
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
