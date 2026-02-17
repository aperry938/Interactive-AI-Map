import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DecisionBoundaryProps {
    onClose: () => void;
    onComplete?: () => void;
}

interface Point {
    x: number;
    y: number;
    cls: 0 | 1; // 0 = Class A (cyan), 1 = Class B (red)
}

type DatasetType = 'linear' | 'xor' | 'circles' | 'moons';

// --- Dataset generators ---

const randn = (): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const generateLinear = (): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < 20; i++) {
        pts.push({ x: randn() * 0.6 - 1.2, y: randn() * 0.6 + 1.0, cls: 0 });
    }
    for (let i = 0; i < 20; i++) {
        pts.push({ x: randn() * 0.6 + 1.2, y: randn() * 0.6 - 1.0, cls: 1 });
    }
    return pts;
};

const generateXOR = (): Point[] => {
    const pts: Point[] = [];
    const clusters: [number, number, 0 | 1][] = [
        [-1.2, -1.2, 0], [1.2, 1.2, 0],
        [-1.2, 1.2, 1], [1.2, -1.2, 1],
    ];
    for (const [cx, cy, cls] of clusters) {
        for (let i = 0; i < 10; i++) {
            pts.push({ x: cx + randn() * 0.35, y: cy + randn() * 0.35, cls });
        }
    }
    return pts;
};

const generateCircles = (): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = randn() * 0.2 + 0.6;
        pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), cls: 0 });
    }
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = randn() * 0.25 + 1.8;
        pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), cls: 1 });
    }
    return pts;
};

const generateMoons = (): Point[] => {
    const pts: Point[] = [];
    for (let i = 0; i < 25; i++) {
        const angle = Math.PI * (i / 24);
        pts.push({
            x: Math.cos(angle) + randn() * 0.12,
            y: Math.sin(angle) + randn() * 0.12,
            cls: 0,
        });
    }
    for (let i = 0; i < 25; i++) {
        const angle = Math.PI * (i / 24);
        pts.push({
            x: 1 - Math.cos(angle) + randn() * 0.12,
            y: 0.5 - Math.sin(angle) + randn() * 0.12,
            cls: 1,
        });
    }
    return pts;
};

// --- Classification helpers ---

// Decision line: ax + by + c = 0
// classify: sign(ax + by + c)
const classifyLinear = (px: number, py: number, a: number, b: number, c: number): number => {
    return a * px + b * py + c;
};

// Kernel-lifted classification: use a separating plane in lifted space
// Lifted coords: (x, y, z) where z = x^2 + y^2
// Plane: ax + by + dz + c = 0
const classifyKernel = (
    px: number, py: number,
    a: number, b: number, c: number, d: number
): number => {
    const z = px * px + py * py;
    return a * px + b * py + d * z + c;
};

const computeAccuracy = (
    points: Point[],
    a: number, b: number, c: number,
    kernelWeight: number, d: number
): { accuracy: number; correct: number; total: number; misclassified: boolean[] } => {
    if (points.length === 0) return { accuracy: 0, correct: 0, total: 0, misclassified: [] };
    let correct = 0;
    const misclassified: boolean[] = [];
    for (const p of points) {
        const val = kernelWeight > 0.01
            ? classifyKernel(p.x, p.y, a, b, c, d)
            : classifyLinear(p.x, p.y, a, b, c);
        const predicted = val >= 0 ? 0 : 1;
        const isCorrect = predicted === p.cls;
        misclassified.push(!isCorrect);
        if (isCorrect) correct++;
    }
    return {
        accuracy: correct / points.length,
        correct,
        total: points.length,
        misclassified,
    };
};

// --- Constants ---
const CANVAS_SIZE = 500;
const RANGE = 3; // [-3, 3]
const HEATMAP_RES = 30;

export const DecisionBoundary: React.FC<DecisionBoundaryProps> = ({ onClose, onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [points, setPoints] = useState<Point[]>(() => generateLinear());
    const [datasetType, setDatasetType] = useState<DatasetType>('linear');
    const [addMode, setAddMode] = useState(false);

    // Decision boundary: ax + by + c = 0
    const [lineA, setLineA] = useState(1);
    const [lineB, setLineB] = useState(0);
    const [lineC, setLineC] = useState(0);

    // Kernel plane z-coefficient
    const [kernelD, setKernelD] = useState(-1.0);

    // Feature transform slider
    const [featureTransform, setFeatureTransform] = useState(0);

    // Heatmap toggle
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Dragging state
    const isDragging = useRef(false);
    const dragStart = useRef<{ x: number; y: number; a: number; b: number; c: number } | null>(null);
    const dragType = useRef<'rotate' | 'translate'>('translate');

    // Completion tracking
    const hasCompleted = useRef(false);

    const toCanvas = useCallback((lx: number, ly: number): [number, number] => {
        const cx = ((lx + RANGE) / (2 * RANGE)) * CANVAS_SIZE;
        const cy = ((RANGE - ly) / (2 * RANGE)) * CANVAS_SIZE;
        return [cx, cy];
    }, []);

    const toLogical = useCallback((cx: number, cy: number): [number, number] => {
        const lx = (cx / CANVAS_SIZE) * (2 * RANGE) - RANGE;
        const ly = RANGE - (cy / CANVAS_SIZE) * (2 * RANGE);
        return [lx, ly];
    }, []);

    // Simple perspective projection for 3D view
    const project3D = useCallback((x: number, y: number, z: number, t: number): [number, number] => {
        // Rotation around Y axis for perspective feel
        const rotAngle = 0.6;
        const tiltAngle = 0.5;

        const cosR = Math.cos(rotAngle);
        const sinR = Math.sin(rotAngle);
        const cosT = Math.cos(tiltAngle);
        const sinT = Math.sin(tiltAngle);

        // Rotate around Y
        const x1 = x * cosR - z * sinR;
        const z1 = x * sinR + z * cosR;
        const y1 = y;

        // Tilt around X
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT;

        // Perspective
        const fov = 5;
        const scale = fov / (fov + z2 + 3);

        const sx = CANVAS_SIZE / 2 + x1 * scale * (CANVAS_SIZE / (2 * RANGE));
        const sy = CANVAS_SIZE / 2 - y2 * scale * (CANVAS_SIZE / (2 * RANGE));

        return [sx, sy];
    }, []);

    // Interpolate between 2D and 3D positions
    const getPointPosition = useCallback((x: number, y: number, t: number): [number, number] => {
        const [cx2d, cy2d] = toCanvas(x, y);
        if (t < 0.01) return [cx2d, cy2d];

        const z = (x * x + y * y) * 0.3; // Scale z for visual effect
        const [cx3d, cy3d] = project3D(x, y, z, t);

        return [
            cx2d + (cx3d - cx2d) * t,
            cy2d + (cy3d - cy2d) * t,
        ];
    }, [toCanvas, project3D]);

    const accuracyResult = computeAccuracy(
        points, lineA, lineB, lineC, featureTransform, kernelD
    );

    // Check for completion
    useEffect(() => {
        if (hasCompleted.current) return;
        const isNonLinear = datasetType === 'circles' || datasetType === 'xor';
        if (isNonLinear && featureTransform > 0.5 && accuracyResult.accuracy > 0.9 && points.length > 0) {
            hasCompleted.current = true;
            onComplete?.();
        }
    }, [accuracyResult.accuracy, datasetType, featureTransform, points.length, onComplete]);

    // --- Drawing ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = CANVAS_SIZE;
        const H = CANVAS_SIZE;
        const t = featureTransform;

        // Background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(48, 54, 61, 0.6)';
        ctx.lineWidth = 0.5;
        for (let i = -RANGE; i <= RANGE; i++) {
            if (t < 0.5) {
                const [x1, y1] = toCanvas(i, -RANGE);
                const [x2, y2] = toCanvas(i, RANGE);
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                const [x3, y3] = toCanvas(-RANGE, i);
                const [x4, y4] = toCanvas(RANGE, i);
                ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x4, y4); ctx.stroke();
            }
        }

        // Axes
        if (t < 0.5) {
            ctx.strokeStyle = 'rgba(139, 148, 158, 0.3)';
            ctx.lineWidth = 1;
            const [ox1, oy1] = toCanvas(0, -RANGE);
            const [ox2, oy2] = toCanvas(0, RANGE);
            ctx.beginPath(); ctx.moveTo(ox1, oy1); ctx.lineTo(ox2, oy2); ctx.stroke();
            const [ox3, oy3] = toCanvas(-RANGE, 0);
            const [ox4, oy4] = toCanvas(RANGE, 0);
            ctx.beginPath(); ctx.moveTo(ox3, oy3); ctx.lineTo(ox4, oy4); ctx.stroke();
        }

        // Confidence heatmap
        if (showHeatmap && t < 0.5) {
            const cellW = W / HEATMAP_RES;
            const cellH = H / HEATMAP_RES;
            for (let gx = 0; gx < HEATMAP_RES; gx++) {
                for (let gy = 0; gy < HEATMAP_RES; gy++) {
                    const [lx, ly] = toLogical(
                        (gx + 0.5) * cellW,
                        (gy + 0.5) * cellH
                    );
                    const val = featureTransform > 0.01
                        ? classifyKernel(lx, ly, lineA, lineB, lineC, kernelD)
                        : classifyLinear(lx, ly, lineA, lineB, lineC);

                    // Normalize to [-1, 1] range with sigmoid-like mapping
                    const confidence = Math.tanh(val * 0.5);

                    let r: number, g: number, b: number;
                    if (confidence > 0) {
                        // Class A side -> cyan/blue
                        r = Math.round(13 + (1 - confidence) * 20);
                        g = Math.round(17 + confidence * 40);
                        b = Math.round(23 + confidence * 80);
                    } else {
                        // Class B side -> red/pink
                        const c = -confidence;
                        r = Math.round(13 + c * 80);
                        g = Math.round(17 + (1 - c) * 10);
                        b = Math.round(23 + (1 - c) * 10);
                    }

                    ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
                    ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
                }
            }
        }

        // Decision boundary line (in 2D view)
        if (t < 0.5) {
            // Draw line: ax + by + c = 0
            // Find intersections with viewing area
            const linePoints: [number, number][] = [];
            const mag = Math.sqrt(lineA * lineA + lineB * lineB);
            if (mag > 0.001) {
                if (Math.abs(lineB) > 0.001) {
                    for (const x of [-RANGE, RANGE]) {
                        const y = -(lineA * x + lineC) / lineB;
                        if (y >= -RANGE && y <= RANGE) linePoints.push([x, y]);
                    }
                }
                if (Math.abs(lineA) > 0.001) {
                    for (const y of [-RANGE, RANGE]) {
                        const x = -(lineB * y + lineC) / lineA;
                        if (x >= -RANGE && x <= RANGE) linePoints.push([x, y]);
                    }
                }
            }

            // Deduplicate and take first two
            const unique: [number, number][] = [];
            for (const p of linePoints) {
                if (!unique.some(q => Math.abs(q[0] - p[0]) < 0.01 && Math.abs(q[1] - p[1]) < 0.01)) {
                    unique.push(p);
                }
            }

            if (unique.length >= 2) {
                const [p1x, p1y] = toCanvas(unique[0][0], unique[0][1]);
                const [p2x, p2y] = toCanvas(unique[1][0], unique[1][1]);

                // Glow effect
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 8;
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(p2x, p2y);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Normal direction indicator (small arrow from center)
                const midX = (unique[0][0] + unique[1][0]) / 2;
                const midY = (unique[0][1] + unique[1][1]) / 2;
                const normLen = 0.3;
                const nx = lineA / mag * normLen;
                const ny = lineB / mag * normLen;
                const [mx, my] = toCanvas(midX, midY);
                const [ax, ay] = toCanvas(midX + nx, midY + ny);
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(mx, my);
                ctx.lineTo(ax, ay);
                ctx.stroke();
            }

            // If kernel is active, also show the nonlinear boundary contour
            if (featureTransform > 0.01) {
                // Draw the kernel boundary as a contour: ax + by + d(x^2+y^2) + c = 0
                ctx.strokeStyle = '#ff6b9d';
                ctx.lineWidth = 1.5;
                ctx.shadowColor = '#ff6b9d';
                ctx.shadowBlur = 6;

                // Marching approach: scan grid and connect zero-crossings
                const res = 100;
                const step = (2 * RANGE) / res;
                for (let gi = 0; gi < res; gi++) {
                    for (let gj = 0; gj < res; gj++) {
                        const x0 = -RANGE + gi * step;
                        const y0 = -RANGE + gj * step;
                        const x1 = x0 + step;
                        const y1 = y0 + step;

                        const v00 = classifyKernel(x0, y0, lineA, lineB, lineC, kernelD);
                        const v10 = classifyKernel(x1, y0, lineA, lineB, lineC, kernelD);
                        const v01 = classifyKernel(x0, y1, lineA, lineB, lineC, kernelD);
                        const v11 = classifyKernel(x1, y1, lineA, lineB, lineC, kernelD);

                        const edges: [number, number][] = [];
                        if (v00 * v10 < 0) {
                            const frac = Math.abs(v00) / (Math.abs(v00) + Math.abs(v10));
                            edges.push([x0 + frac * step, y0]);
                        }
                        if (v10 * v11 < 0) {
                            const frac = Math.abs(v10) / (Math.abs(v10) + Math.abs(v11));
                            edges.push([x1, y0 + frac * step]);
                        }
                        if (v01 * v11 < 0) {
                            const frac = Math.abs(v01) / (Math.abs(v01) + Math.abs(v11));
                            edges.push([x0 + frac * step, y1]);
                        }
                        if (v00 * v01 < 0) {
                            const frac = Math.abs(v00) / (Math.abs(v00) + Math.abs(v01));
                            edges.push([x0, y0 + frac * step]);
                        }

                        if (edges.length >= 2) {
                            const [cx1, cy1] = toCanvas(edges[0][0], edges[0][1]);
                            const [cx2, cy2] = toCanvas(edges[1][0], edges[1][1]);
                            ctx.beginPath();
                            ctx.moveTo(cx1, cy1);
                            ctx.lineTo(cx2, cy2);
                            ctx.stroke();
                        }
                    }
                }
                ctx.shadowBlur = 0;
            }
        }

        // 3D separating plane (when in 3D view)
        if (t > 0.3) {
            ctx.globalAlpha = Math.min((t - 0.3) / 0.3, 0.3);
            // Draw a grid of the separating plane in 3D
            // Plane: ax + by + dz + c = 0 => z = -(ax + by + c) / d
            if (Math.abs(kernelD) > 0.001) {
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 0.5;
                const planeRes = 12;
                for (let i = 0; i <= planeRes; i++) {
                    const v = -RANGE + (i / planeRes) * 2 * RANGE;
                    // Draw line along x at fixed y=v
                    ctx.beginPath();
                    let started = false;
                    for (let j = 0; j <= 30; j++) {
                        const u = -RANGE + (j / 30) * 2 * RANGE;
                        const z = (-(lineA * u + lineB * v + lineC) / kernelD) * 0.3;
                        if (z < -1 || z > 4) { started = false; continue; }
                        const [sx, sy] = project3D(u, v, z, t);
                        if (!started) { ctx.moveTo(sx, sy); started = true; }
                        else ctx.lineTo(sx, sy);
                    }
                    ctx.stroke();

                    // Draw line along y at fixed x=v
                    ctx.beginPath();
                    started = false;
                    for (let j = 0; j <= 30; j++) {
                        const u = -RANGE + (j / 30) * 2 * RANGE;
                        const z = (-(lineA * v + lineB * u + lineC) / kernelD) * 0.3;
                        if (z < -1 || z > 4) { started = false; continue; }
                        const [sx, sy] = project3D(v, u, z, t);
                        if (!started) { ctx.moveTo(sx, sy); started = true; }
                        else ctx.lineTo(sx, sy);
                    }
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        }

        // Data points
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const [cx, cy] = getPointPosition(p.x, p.y, t);
            const isMisclassified = accuracyResult.misclassified[i];

            if (p.cls === 0) {
                // Class A: cyan circle
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
                ctx.fillStyle = isMisclassified ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 255, 0.8)';
                ctx.fill();
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else {
                // Class B: red/pink square
                ctx.fillStyle = isMisclassified ? 'rgba(255, 82, 82, 0.3)' : 'rgba(255, 82, 82, 0.8)';
                ctx.strokeStyle = '#ff5252';
                ctx.lineWidth = 1.5;
                ctx.fillRect(cx - 5, cy - 5, 10, 10);
                ctx.strokeRect(cx - 5, cy - 5, 10, 10);
            }

            // X overlay for misclassified
            if (isMisclassified) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy - 4);
                ctx.lineTo(cx + 4, cy + 4);
                ctx.moveTo(cx + 4, cy - 4);
                ctx.lineTo(cx - 4, cy + 4);
                ctx.stroke();
            }
        }

        // Label in corner
        if (t > 0.1) {
            ctx.fillStyle = 'rgba(139, 148, 158, 0.6)';
            ctx.font = '11px monospace';
            ctx.fillText(`z = x\u00B2 + y\u00B2  (kernel lift: ${(t * 100).toFixed(0)}%)`, 10, H - 10);
        }

    }, [
        points, lineA, lineB, lineC, kernelD, featureTransform,
        showHeatmap, toCanvas, toLogical, getPointPosition,
        project3D, accuracyResult.misclassified,
    ]);

    useEffect(() => {
        draw();
    }, [draw]);

    // --- Mouse interaction ---
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;
        const [lx, ly] = toLogical(cx, cy);

        if (addMode) {
            const cls: 0 | 1 = e.shiftKey ? 1 : 0;
            setPoints(prev => [...prev, { x: lx, y: ly, cls }]);
            return;
        }

        // Determine drag type: near the line center = translate, else rotate
        const mag = Math.sqrt(lineA * lineA + lineB * lineB);
        if (mag < 0.001) return;
        const dist = Math.abs(lineA * lx + lineB * ly + lineC) / mag;

        isDragging.current = true;
        dragStart.current = { x: lx, y: ly, a: lineA, b: lineB, c: lineC };
        dragType.current = dist < 0.5 ? 'translate' : 'rotate';
    }, [addMode, lineA, lineB, lineC, toLogical]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging.current || !dragStart.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;
        const [lx, ly] = toLogical(cx, cy);

        const dx = lx - dragStart.current.x;
        const dy = ly - dragStart.current.y;

        if (dragType.current === 'translate') {
            // Move the line along its normal
            const mag = Math.sqrt(dragStart.current.a ** 2 + dragStart.current.b ** 2);
            const normalShift = (dragStart.current.a * dx + dragStart.current.b * dy) / mag;
            setLineC(dragStart.current.c + normalShift * mag);
        } else {
            // Rotate the line around the origin
            const startAngle = Math.atan2(dragStart.current.y, dragStart.current.x);
            const curAngle = Math.atan2(ly, lx);
            const deltaAngle = curAngle - startAngle;
            const origAngle = Math.atan2(dragStart.current.b, dragStart.current.a);
            const newAngle = origAngle + deltaAngle;
            const mag = Math.sqrt(dragStart.current.a ** 2 + dragStart.current.b ** 2);
            setLineA(Math.cos(newAngle) * mag);
            setLineB(Math.sin(newAngle) * mag);
        }
    }, [toLogical]);

    const handleCanvasMouseUp = useCallback(() => {
        isDragging.current = false;
        dragStart.current = null;
    }, []);

    // --- Dataset selection ---
    const selectDataset = useCallback((type: DatasetType) => {
        setDatasetType(type);
        hasCompleted.current = false;
        switch (type) {
            case 'linear': setPoints(generateLinear()); break;
            case 'xor': setPoints(generateXOR()); break;
            case 'circles': setPoints(generateCircles()); break;
            case 'moons': setPoints(generateMoons()); break;
        }
        // Reset boundary
        setLineA(1); setLineB(0); setLineC(0);
        setFeatureTransform(0);
        setKernelD(-1.0);
    }, []);

    const clearPoints = useCallback(() => {
        setPoints([]);
        hasCompleted.current = false;
    }, []);

    const resetBoundary = useCallback(() => {
        setLineA(1);
        setLineB(0);
        setLineC(0);
        setKernelD(-1.0);
        setFeatureTransform(0);
        hasCompleted.current = false;
    }, []);

    const accuracyPct = (accuracyResult.accuracy * 100).toFixed(0);
    const isNonLinear = datasetType === 'circles' || datasetType === 'xor' || datasetType === 'moons';

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100">
                            Decision Boundary Explorer
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Drag the boundary line to classify points. Use the kernel trick for non-linear data.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Canvas */}
                    <div className="flex-1 p-4">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            className="w-full rounded-lg border border-[#30363d] cursor-crosshair"
                            style={{ maxHeight: '500px', aspectRatio: '1' }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        />
                    </div>

                    {/* Controls Panel */}
                    <div className="w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-[#30363d] overflow-y-auto" style={{ maxHeight: '560px' }}>
                        {/* Accuracy Display */}
                        <div className="mb-4 p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
                            <div className="text-xs text-slate-500 mb-1">Accuracy</div>
                            <div className={`text-2xl font-bold font-mono ${
                                accuracyResult.accuracy > 0.9 ? 'text-green-400' :
                                accuracyResult.accuracy > 0.7 ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                                {accuracyPct}%
                                <span className="text-sm text-slate-500 ml-2">
                                    ({accuracyResult.correct}/{accuracyResult.total})
                                </span>
                            </div>
                        </div>

                        {/* Dataset Selector */}
                        <div className="mb-4">
                            <div className="text-xs text-slate-500 mb-2">Dataset</div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(['linear', 'xor', 'circles', 'moons'] as DatasetType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => selectDataset(type)}
                                        className={`px-2 py-1.5 text-xs rounded-md transition-all capitalize ${
                                            datasetType === type
                                                ? 'bg-[#1f6feb] text-white'
                                                : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add Points Toggle */}
                        <div className="mb-4 flex items-center gap-2">
                            <button
                                onClick={() => setAddMode(!addMode)}
                                className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-all ${
                                    addMode
                                        ? 'bg-[#238636] text-white'
                                        : 'bg-[#161b22] text-slate-400 hover:text-slate-200 border border-[#30363d]'
                                }`}
                            >
                                {addMode ? 'Adding Points...' : 'Add Points'}
                            </button>
                            {addMode && (
                                <span className="text-[10px] text-slate-600">
                                    click=A, shift=B
                                </span>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#30363d] my-3" />

                        {/* Kernel Trick Section */}
                        <div className="mb-4">
                            <div className="text-xs text-slate-500 mb-1">Feature Transform (Kernel Trick)</div>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[10px] text-slate-600">2D view</span>
                                <span className="text-xs font-mono text-slate-400">
                                    {(featureTransform * 100).toFixed(0)}%
                                </span>
                                <span className="text-[10px] text-slate-600">3D lift</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={featureTransform}
                                onChange={e => setFeatureTransform(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-[#30363d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1f6feb] [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                        </div>

                        {/* Kernel Z-weight */}
                        {featureTransform > 0.01 && (
                            <div className="mb-4">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-xs text-slate-500">Plane Z-weight</span>
                                    <span className="text-xs font-mono text-slate-400">{kernelD.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={-3}
                                    max={3}
                                    step={0.05}
                                    value={kernelD}
                                    onChange={e => setKernelD(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#30363d] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff6b9d] [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Heatmap toggle */}
                        <div className="mb-4 flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showHeatmap}
                                    onChange={e => setShowHeatmap(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-[#30363d] bg-[#161b22] accent-[#1f6feb]"
                                />
                                <span className="text-xs text-slate-400">Show confidence heatmap</span>
                            </label>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#30363d] my-3" />

                        {/* Action buttons */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={clearPoints}
                                className="flex-1 py-1.5 px-2 text-xs text-slate-400 bg-[#161b22] border border-[#30363d] rounded-md hover:text-slate-200 hover:border-[#484f58] transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={resetBoundary}
                                className="flex-1 py-1.5 px-2 text-xs text-slate-400 bg-[#161b22] border border-[#30363d] rounded-md hover:text-slate-200 hover:border-[#484f58] transition-colors"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Help text */}
                        <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d]">
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {isNonLinear ? (
                                    featureTransform < 0.1 ? (
                                        <>This dataset is not linearly separable. Try increasing the <span className="text-[#1f6feb]">Feature Transform</span> slider to lift points into a higher dimension where a linear boundary can separate them.</>
                                    ) : (
                                        <>The kernel trick maps data to higher dimensions using z = x{'\u00B2'} + y{'\u00B2'}. Adjust the <span className="text-[#ff6b9d]">Plane Z-weight</span> and drag the boundary to find a separating surface. Achieve {'>'}90% accuracy to complete.</>
                                    )
                                ) : (
                                    <>Drag the <span className="text-[#00ff88]">green boundary line</span> to separate cyan circles from red squares. Click near the line to translate it, or further away to rotate.</>
                                )}
                            </p>
                        </div>

                        {/* Completion indicator */}
                        {hasCompleted.current && (
                            <div className="mt-3 p-3 rounded-lg bg-[#238636]/20 border border-[#238636]/40">
                                <p className="text-xs text-green-400 font-medium text-center">
                                    Challenge complete! You found a kernel that separates the data.
                                </p>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-600">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#00ffff] inline-block" />
                                Class A
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#ff5252] inline-block" />
                                Class B
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-[#00ff88] inline-block" />
                                Boundary
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
