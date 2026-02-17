import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NeuralNetworkBuilderProps {
    onComplete?: () => void;
    onClose: () => void;
}

type ActivationFn = 'relu' | 'sigmoid' | 'tanh';
type DatasetName = 'xor' | 'circle' | 'linear';

interface Network {
    layerSizes: number[];
    weights: number[][][];  // weights[l][j][i] = weight from neuron i in layer l to neuron j in layer l+1
    biases: number[][];     // biases[l][j] = bias for neuron j in layer l+1
}

interface TrainState {
    step: number;
    lossHistory: number[];
    isTraining: boolean;
    completionFired: boolean;
    lastGradients: number[][][] | null; // weight gradients from last step, for visualization
}

interface AnimState {
    phase: 'idle' | 'forward' | 'backward';
    progress: number; // 0..1
}

// ─── Activation functions & derivatives ──────────────────────────────────────

const ACT: Record<ActivationFn, {
    fn: (x: number) => number;
    dfn: (x: number, out: number) => number;
    label: string;
}> = {
    relu: {
        fn: (x) => Math.max(0, x),
        dfn: (_x, out) => out > 0 ? 1 : 0,
        label: 'ReLU',
    },
    sigmoid: {
        fn: (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
        dfn: (_x, out) => out * (1 - out),
        label: 'Sigmoid',
    },
    tanh: {
        fn: (x) => Math.tanh(x),
        dfn: (_x, out) => 1 - out * out,
        label: 'Tanh',
    },
};

// ─── Datasets ────────────────────────────────────────────────────────────────

const DATASETS: Record<DatasetName, { points: [number, number, number][]; label: string }> = {
    xor: {
        label: 'XOR',
        points: [
            [0, 0, 0],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
        ],
    },
    circle: {
        label: 'Circle',
        points: (() => {
            const pts: [number, number, number][] = [];
            for (let i = 0; i < 80; i++) {
                const x = Math.random();
                const y = Math.random();
                const dist = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
                pts.push([x, y, dist < 0.28 ? 1 : 0]);
            }
            return pts;
        })(),
    },
    linear: {
        label: 'Linear',
        points: (() => {
            const pts: [number, number, number][] = [];
            for (let i = 0; i < 60; i++) {
                const x = Math.random();
                const y = Math.random();
                pts.push([x, y, x + y > 1 ? 1 : 0]);
            }
            return pts;
        })(),
    },
};

// ─── Architecture presets ────────────────────────────────────────────────────

const ARCH_PRESETS: { label: string; layers: number[] }[] = [
    { label: '2-4-1', layers: [2, 4, 1] },
    { label: '2-6-1', layers: [2, 6, 1] },
    { label: '2-4-4-1', layers: [2, 4, 4, 1] },
    { label: '2-8-4-1', layers: [2, 8, 4, 1] },
    { label: '2-6-6-1', layers: [2, 6, 6, 1] },
    { label: '2-4-4-4-1', layers: [2, 4, 4, 4, 1] },
];

// ─── Network helpers ─────────────────────────────────────────────────────────

function createNetwork(layerSizes: number[]): Network {
    const weights: number[][][] = [];
    const biases: number[][] = [];
    for (let l = 0; l < layerSizes.length - 1; l++) {
        const fanIn = layerSizes[l];
        const fanOut = layerSizes[l + 1];
        // Xavier initialization
        const scale = Math.sqrt(2.0 / (fanIn + fanOut));
        const lw: number[][] = [];
        const lb: number[] = [];
        for (let j = 0; j < fanOut; j++) {
            const nw: number[] = [];
            for (let i = 0; i < fanIn; i++) {
                nw.push((Math.random() * 2 - 1) * scale);
            }
            lw.push(nw);
            lb.push(0);
        }
        weights.push(lw);
        biases.push(lb);
    }
    return { layerSizes, weights, biases };
}

function forwardPass(
    net: Network,
    input: number[],
    actFn: (x: number) => number
): { preActivations: number[][]; activations: number[][] } {
    const preActivations: number[][] = [input.slice()];
    const activations: number[][] = [input.slice()];
    let current = input;
    for (let l = 0; l < net.weights.length; l++) {
        const pre: number[] = [];
        const act: number[] = [];
        for (let j = 0; j < net.weights[l].length; j++) {
            let sum = net.biases[l][j];
            for (let i = 0; i < current.length; i++) {
                sum += current[i] * net.weights[l][j][i];
            }
            pre.push(sum);
            // Output layer uses sigmoid for classification
            const isOutputLayer = l === net.weights.length - 1;
            const activated = isOutputLayer ? ACT.sigmoid.fn(sum) : actFn(sum);
            act.push(activated);
        }
        preActivations.push(pre);
        activations.push(act);
        current = act;
    }
    return { preActivations, activations };
}

function backprop(
    net: Network,
    input: number[],
    target: number[],
    actFnKey: ActivationFn
): { weightGrads: number[][][]; biasGrads: number[][]; loss: number } {
    const actFn = ACT[actFnKey].fn;
    const actDfn = ACT[actFnKey].dfn;

    const { preActivations, activations } = forwardPass(net, input, actFn);
    const output = activations[activations.length - 1];

    // MSE loss
    let loss = 0;
    for (let i = 0; i < output.length; i++) {
        loss += (output[i] - target[i]) ** 2;
    }
    loss /= output.length;

    // Initialize gradients
    const weightGrads: number[][][] = net.weights.map(lw =>
        lw.map(nw => nw.map(() => 0))
    );
    const biasGrads: number[][] = net.biases.map(lb => lb.map(() => 0));

    // Output layer delta: d(MSE)/d(output) * sigmoid'(pre)
    const numLayers = net.weights.length;
    let deltas: number[] = [];
    for (let j = 0; j < output.length; j++) {
        const dLoss = 2 * (output[j] - target[j]) / output.length;
        const sigOut = output[j];
        const dAct = sigOut * (1 - sigOut); // sigmoid derivative at output
        deltas.push(dLoss * dAct);
    }

    // Compute gradients layer by layer from output to input
    for (let l = numLayers - 1; l >= 0; l--) {
        const prevAct = activations[l]; // activations of the layer feeding into this one
        for (let j = 0; j < deltas.length; j++) {
            biasGrads[l][j] = deltas[j];
            for (let i = 0; i < prevAct.length; i++) {
                weightGrads[l][j][i] = deltas[j] * prevAct[i];
            }
        }

        // Propagate deltas backward (if not at input layer)
        if (l > 0) {
            const newDeltas: number[] = [];
            for (let i = 0; i < net.layerSizes[l]; i++) {
                let sum = 0;
                for (let j = 0; j < deltas.length; j++) {
                    sum += deltas[j] * net.weights[l][j][i];
                }
                const dAct = actDfn(preActivations[l][i], activations[l][i]);
                newDeltas.push(sum * dAct);
            }
            deltas = newDeltas;
        }
    }

    return { weightGrads, biasGrads, loss };
}

function clipGradients(grads: number[][][], maxNorm: number): number[][][] {
    // Compute global gradient norm
    let normSq = 0;
    for (const lw of grads) {
        for (const nw of lw) {
            for (const g of nw) {
                normSq += g * g;
            }
        }
    }
    const norm = Math.sqrt(normSq);
    if (norm <= maxNorm) return grads;
    const scale = maxNorm / norm;
    return grads.map(lw => lw.map(nw => nw.map(g => g * scale)));
}

function trainStep(
    net: Network,
    data: [number, number, number][],
    lr: number,
    actFnKey: ActivationFn
): { net: Network; loss: number; avgGradients: number[][][] } {
    // Accumulate gradients over all data points
    const totalWG: number[][][] = net.weights.map(lw =>
        lw.map(nw => nw.map(() => 0))
    );
    const totalBG: number[][] = net.biases.map(lb => lb.map(() => 0));
    let totalLoss = 0;

    for (const [x1, x2, y] of data) {
        const { weightGrads, biasGrads, loss } = backprop(
            net,
            [x1, x2],
            [y],
            actFnKey
        );
        totalLoss += loss;
        for (let l = 0; l < weightGrads.length; l++) {
            for (let j = 0; j < weightGrads[l].length; j++) {
                totalBG[l][j] += biasGrads[l][j];
                for (let i = 0; i < weightGrads[l][j].length; i++) {
                    totalWG[l][j][i] += weightGrads[l][j][i];
                }
            }
        }
    }

    const n = data.length;
    // Average gradients
    const avgWG = totalWG.map(lw => lw.map(nw => nw.map(g => g / n)));
    const avgBG = totalBG.map(lb => lb.map(b => b / n));

    // Gradient clipping (max norm = 5.0) to prevent explosions
    const clippedWG = clipGradients(avgWG, 5.0);

    const newWeights = net.weights.map((lw, l) =>
        lw.map((nw, j) =>
            nw.map((w, i) => w - lr * clippedWG[l][j][i])
        )
    );
    const newBiases = net.biases.map((lb, l) =>
        lb.map((b, j) => b - lr * avgBG[l][j])
    );

    return {
        net: { ...net, weights: newWeights, biases: newBiases },
        loss: totalLoss / n,
        avgGradients: avgWG,
    };
}

// ─── Canvas drawing helpers ──────────────────────────────────────────────────

function drawGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string,
    intensity: number
) {
    const gradient = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.5);
    gradient.addColorStop(0, color + Math.round(intensity * 60).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
}

function lerpColor(t: number): string {
    // t: 0 = blue(0), 1 = red(1)
    t = Math.max(0, Math.min(1, t));
    const r = Math.round(40 + t * 215);
    const g = Math.round(120 - t * 80);
    const b = Math.round(255 - t * 200);
    return `rgb(${r},${g},${b})`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const NeuralNetworkBuilder: React.FC<NeuralNetworkBuilderProps> = ({ onComplete, onClose }) => {
    // Refs
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
    const lossCanvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const trainAnimRef = useRef<number>(0);

    // State
    const [archIdx, setArchIdx] = useState(0);
    const [actFnKey, setActFnKey] = useState<ActivationFn>('sigmoid');
    const [datasetKey, setDatasetKey] = useState<DatasetName>('xor');
    const [lr, setLr] = useState(0.5);
    const [network, setNetwork] = useState<Network>(() => createNetwork(ARCH_PRESETS[0].layers));
    const [trainState, setTrainState] = useState<TrainState>({
        step: 0,
        lossHistory: [],
        isTraining: false,
        completionFired: false,
        lastGradients: null,
    });
    const [animState, setAnimState] = useState<AnimState>({ phase: 'idle', progress: 0 });
    const [showGradients, setShowGradients] = useState(false);

    // Refs that mirror state for animation loops
    const networkRef = useRef(network);
    const trainStateRef = useRef(trainState);
    const animStateRef = useRef(animState);
    const lrRef = useRef(lr);
    const actFnKeyRef = useRef(actFnKey);
    const datasetKeyRef = useRef(datasetKey);

    useEffect(() => { networkRef.current = network; }, [network]);
    useEffect(() => { trainStateRef.current = trainState; }, [trainState]);
    useEffect(() => { animStateRef.current = animState; }, [animState]);
    useEffect(() => { lrRef.current = lr; }, [lr]);
    useEffect(() => { actFnKeyRef.current = actFnKey; }, [actFnKey]);
    useEffect(() => { datasetKeyRef.current = datasetKey; }, [datasetKey]);

    // ─── Reset ───────────────────────────────────────────────────────────

    const resetNetwork = useCallback((archIndex?: number) => {
        const idx = archIndex ?? archIdx;
        const net = createNetwork(ARCH_PRESETS[idx].layers);
        setNetwork(net);
        setTrainState({ step: 0, lossHistory: [], isTraining: false, completionFired: false, lastGradients: null });
        setAnimState({ phase: 'idle', progress: 0 });
    }, [archIdx]);

    // ─── Single training step ────────────────────────────────────────────

    const doStep = useCallback(() => {
        const data = DATASETS[datasetKeyRef.current].points;
        const result = trainStep(networkRef.current, data, lrRef.current, actFnKeyRef.current);
        setNetwork(result.net);
        setTrainState(prev => {
            const newHistory = [...prev.lossHistory, result.loss];
            // Keep history manageable
            if (newHistory.length > 500) newHistory.splice(0, newHistory.length - 500);
            let completionFired = prev.completionFired;
            if (result.loss < 0.05 && !completionFired) {
                completionFired = true;
                onComplete?.();
            }
            return {
                ...prev,
                step: prev.step + 1,
                lossHistory: newHistory,
                completionFired,
                lastGradients: result.avgGradients,
            };
        });
    }, [onComplete]);

    // ─── Training loop ──────────────────────────────────────────────────

    useEffect(() => {
        if (!trainState.isTraining) return;

        let running = true;
        const loop = () => {
            if (!running) return;
            for (let i = 0; i < 20; i++) {
                doStep();
            }
            trainAnimRef.current = requestAnimationFrame(loop);
        };
        trainAnimRef.current = requestAnimationFrame(loop);
        return () => {
            running = false;
            cancelAnimationFrame(trainAnimRef.current);
        };
    }, [trainState.isTraining, doStep]);

    // ─── Step with animation ─────────────────────────────────────────────

    const stepWithAnim = useCallback(() => {
        // Trigger forward animation
        setAnimState({ phase: 'forward', progress: 0 });
        const start = performance.now();
        const duration = 600; // ms

        const animate = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);

            if (t < 0.5) {
                setAnimState({ phase: 'forward', progress: t * 2 });
            } else {
                setAnimState({ phase: 'backward', progress: (t - 0.5) * 2 });
            }

            if (t < 0.5) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else if (t >= 0.5 && t < 0.51) {
                // Do the actual training step at midpoint
                doStep();
                animFrameRef.current = requestAnimationFrame(animate);
            } else if (t < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                setAnimState({ phase: 'idle', progress: 0 });
            }
        };
        animFrameRef.current = requestAnimationFrame(animate);
    }, [doStep]);

    // ─── Draw main network canvas ────────────────────────────────────────

    useEffect(() => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const net = network;
        const layers = net.layerSizes;
        const numLayers = layers.length;
        const { activations: acts } = forwardPass(net, [0.5, 0.5], ACT[actFnKey].fn);
        const anim = animState;

        // Background
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, W, H);

        // Subtle grid
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Compute node positions
        const marginX = 70;
        const marginY = 30;
        const layerSpacing = (W - marginX * 2) / (numLayers - 1 || 1);

        const nodePos: { x: number; y: number }[][] = [];
        for (let l = 0; l < numLayers; l++) {
            const count = layers[l];
            const x = numLayers === 1 ? W / 2 : marginX + l * layerSpacing;
            const nodeSpacing = Math.min(40, (H - marginY * 2) / (count + 1));
            const totalH = (count - 1) * nodeSpacing;
            const startY = (H - totalH) / 2;
            const nodes: { x: number; y: number }[] = [];
            for (let n = 0; n < count; n++) {
                nodes.push({ x, y: startY + n * nodeSpacing });
            }
            nodePos.push(nodes);
        }

        // Compute max gradient magnitude for normalization (for gradient viz)
        const grads = trainState.lastGradients;
        let maxGrad = 0;
        if (showGradients && grads) {
            for (const lw of grads) {
                for (const nw of lw) {
                    for (const g of nw) {
                        maxGrad = Math.max(maxGrad, Math.abs(g));
                    }
                }
            }
            if (maxGrad === 0) maxGrad = 1;
        }

        // Draw connections
        for (let l = 0; l < numLayers - 1; l++) {
            for (let i = 0; i < layers[l]; i++) {
                for (let j = 0; j < layers[l + 1]; j++) {
                    const w = net.weights[l][j][i];
                    const absW = Math.min(Math.abs(w), 3);
                    const from = nodePos[l][i];
                    const to = nodePos[l + 1][j];

                    if (showGradients && grads) {
                        // Gradient visualization mode: bright red = large gradient, faint = vanishing
                        const g = grads[l]?.[j]?.[i] ?? 0;
                        const gradMag = Math.abs(g) / maxGrad; // 0..1 normalized
                        const gAlpha = 0.05 + gradMag * 0.85;
                        const gWidth = 0.5 + gradMag * 3;
                        // Yellow-to-red based on magnitude
                        const gR = 255;
                        const gG = Math.round(200 * (1 - gradMag));
                        const gB = Math.round(40 * (1 - gradMag));
                        ctx.strokeStyle = `rgba(${gR}, ${gG}, ${gB}, ${gAlpha})`;
                        ctx.lineWidth = gWidth;
                    } else {
                        // Normal weight visualization: blue for positive, red for negative
                        const posColor = 'rgba(0, 180, 255,';
                        const negColor = 'rgba(255, 80, 80,';
                        const colorBase = w >= 0 ? posColor : negColor;
                        const alpha = 0.15 + (absW / 3) * 0.55;
                        const lineWidth = 0.5 + (absW / 3) * 2.5;
                        ctx.strokeStyle = colorBase + alpha + ')';
                        ctx.lineWidth = lineWidth;
                    }

                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();

                    // Animation pulses
                    if (anim.phase === 'forward') {
                        const layerProgress = anim.progress * (numLayers - 1);
                        if (l <= layerProgress && l + 1 >= layerProgress - 0.5) {
                            const t = Math.max(0, Math.min(1, layerProgress - l));
                            const px = from.x + (to.x - from.x) * t;
                            const py = from.y + (to.y - from.y) * t;
                            drawGlow(ctx, px, py, 4, '#00b4ff', 0.8);
                        }
                    } else if (anim.phase === 'backward') {
                        const layerProgress = (1 - anim.progress) * (numLayers - 1);
                        if (l <= layerProgress && l + 1 >= layerProgress - 0.5) {
                            const t = Math.max(0, Math.min(1, (l + 1) - layerProgress));
                            const px = to.x + (from.x - to.x) * t;
                            const py = to.y + (from.y - to.y) * t;
                            drawGlow(ctx, px, py, 4, '#ff4444', 0.8);
                        }
                    }
                }
            }
        }

        // Draw nodes
        for (let l = 0; l < numLayers; l++) {
            for (let n = 0; n < layers[l]; n++) {
                const pos = nodePos[l][n];
                const val = acts[l]?.[n] ?? 0;
                const absVal = Math.min(Math.abs(val), 2);

                // Glow
                const hue = val >= 0 ? '0, 200, 255' : '255, 100, 60';
                drawGlow(ctx, pos.x, pos.y, 14, val >= 0 ? '#00c8ff' : '#ff6040', 0.3 + absVal * 0.2);

                // Node circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${hue}, ${0.15 + absVal * 0.15})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(${hue}, 0.7)`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Value text
                ctx.fillStyle = '#e0eaff';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(val.toFixed(2), pos.x, pos.y);
            }
        }

        // Layer labels
        ctx.fillStyle = 'rgba(150, 180, 220, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        for (let l = 0; l < numLayers; l++) {
            const x = numLayers === 1 ? W / 2 : marginX + l * layerSpacing;
            const label = l === 0 ? 'Input' : l === numLayers - 1 ? 'Output' : `Hidden ${l}`;
            ctx.fillText(label, x, H - 8);
        }

    }, [network, actFnKey, animState, showGradients, trainState.lastGradients]);

    // ─── Draw heatmap canvas ─────────────────────────────────────────────

    useEffect(() => {
        const canvas = heatmapCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const net = network;
        const actFn = ACT[actFnKey].fn;
        const gridSize = 40;
        const cellW = W / gridSize;
        const cellH = H / gridSize;

        // Draw decision boundary
        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                const x = (gx + 0.5) / gridSize;
                const y = (gy + 0.5) / gridSize;
                const { activations: acts } = forwardPass(net, [x, y], actFn);
                const out = acts[acts.length - 1][0];
                const color = lerpColor(out);
                ctx.fillStyle = color;
                ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
            }
        }

        // Overlay data points
        const data = DATASETS[datasetKey].points;
        for (const [x1, x2, label] of data) {
            const px = x1 * W;
            const py = x2 * H;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fillStyle = label > 0.5 ? '#ff3333' : '#3388ff';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

    }, [network, actFnKey, datasetKey]);

    // ─── Draw loss curve canvas ──────────────────────────────────────────

    useEffect(() => {
        const canvas = lossCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const history = trainState.lossHistory;

        // Background
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (H * i) / 4;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        if (history.length < 2) {
            ctx.fillStyle = 'rgba(150, 180, 220, 0.3)';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Loss curve will appear here', W / 2, H / 2);
            return;
        }

        const maxLoss = Math.max(...history, 0.5);
        const marginB = 20;
        const marginT = 10;
        const plotH = H - marginB - marginT;
        const plotW = W - 10;

        // Loss curve
        ctx.beginPath();
        ctx.strokeStyle = '#00e4ff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00e4ff';
        ctx.shadowBlur = 6;
        for (let i = 0; i < history.length; i++) {
            const x = 5 + (i / (history.length - 1)) * plotW;
            const y = marginT + plotH * (1 - history[i] / maxLoss);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current loss text
        const currentLoss = history[history.length - 1];
        ctx.fillStyle = '#00e4ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Loss: ${currentLoss.toFixed(4)}`, W - 5, marginT + 12);

        // Axis labels
        ctx.fillStyle = 'rgba(150, 180, 220, 0.4)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('0', 2, H - 4);
        ctx.textAlign = 'right';
        ctx.fillText(`${history.length}`, W - 2, H - 4);

    }, [trainState.lossHistory]);

    // ─── Cleanup ─────────────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            cancelAnimationFrame(trainAnimRef.current);
        };
    }, []);

    // ─── Render ──────────────────────────────────────────────────────────

    const currentLoss = trainState.lossHistory.length > 0
        ? trainState.lossHistory[trainState.lossHistory.length - 1]
        : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #0a0e17 0%, #0d1524 50%, #0a0e17 100%)',
                    border: '1px solid rgba(0, 180, 255, 0.15)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-3"
                    style={{ borderBottom: '1px solid rgba(0, 180, 255, 0.1)' }}
                >
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: '#e0eaff' }}>
                            Neural Network Builder
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(150, 180, 220, 0.5)' }}>
                            Real backpropagation with live decision boundary visualization
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentLoss !== null && (
                            <span
                                className="text-xs font-mono px-2 py-1 rounded"
                                style={{
                                    background: currentLoss < 0.05
                                        ? 'rgba(0, 255, 100, 0.15)'
                                        : 'rgba(0, 180, 255, 0.1)',
                                    color: currentLoss < 0.05 ? '#00ff64' : '#00b4ff',
                                    border: `1px solid ${currentLoss < 0.05 ? 'rgba(0,255,100,0.3)' : 'rgba(0,180,255,0.2)'}`,
                                }}
                            >
                                Step {trainState.step} | Loss: {currentLoss.toFixed(4)}
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: 'rgba(150, 180, 220, 0.5)' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row">
                    {/* Left: Visualizations */}
                    <div className="flex-1 p-4 space-y-3">
                        {/* Network Diagram */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgba(0, 180, 255, 0.08)' }}
                        >
                            <canvas
                                ref={mainCanvasRef}
                                style={{ width: '100%', height: '260px', display: 'block' }}
                            />
                        </div>

                        {/* Bottom row: Heatmap + Loss */}
                        <div className="flex gap-3">
                            {/* Heatmap */}
                            <div className="flex-1">
                                <div
                                    className="text-xs mb-1 font-medium"
                                    style={{ color: 'rgba(150, 180, 220, 0.6)' }}
                                >
                                    Decision Boundary
                                </div>
                                <div
                                    className="rounded-lg overflow-hidden"
                                    style={{ border: '1px solid rgba(0, 180, 255, 0.08)' }}
                                >
                                    <canvas
                                        ref={heatmapCanvasRef}
                                        style={{ width: '100%', height: '200px', display: 'block' }}
                                    />
                                </div>
                            </div>

                            {/* Loss curve */}
                            <div className="flex-1">
                                <div
                                    className="text-xs mb-1 font-medium"
                                    style={{ color: 'rgba(150, 180, 220, 0.6)' }}
                                >
                                    Loss Curve
                                </div>
                                <div
                                    className="rounded-lg overflow-hidden"
                                    style={{ border: '1px solid rgba(0, 180, 255, 0.08)' }}
                                >
                                    <canvas
                                        ref={lossCanvasRef}
                                        style={{ width: '100%', height: '200px', display: 'block' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div
                        className="w-full lg:w-72 p-4 space-y-4"
                        style={{ borderLeft: '1px solid rgba(0, 180, 255, 0.08)' }}
                    >
                        {/* Training Controls */}
                        <div>
                            <div className="text-xs font-medium mb-2" style={{ color: 'rgba(150, 180, 220, 0.6)' }}>
                                Training
                            </div>
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={stepWithAnim}
                                    disabled={trainState.isTraining}
                                    className="flex-1 py-2 text-xs rounded-lg font-medium transition-all"
                                    style={{
                                        background: trainState.isTraining
                                            ? 'rgba(0, 180, 255, 0.05)'
                                            : 'rgba(0, 180, 255, 0.15)',
                                        color: trainState.isTraining ? 'rgba(150,180,220,0.3)' : '#00b4ff',
                                        border: '1px solid rgba(0, 180, 255, 0.2)',
                                    }}
                                >
                                    Step
                                </button>
                                <button
                                    onClick={() =>
                                        setTrainState(prev => ({
                                            ...prev,
                                            isTraining: !prev.isTraining,
                                        }))
                                    }
                                    className="flex-1 py-2 text-xs rounded-lg font-medium transition-all"
                                    style={{
                                        background: trainState.isTraining
                                            ? 'rgba(255, 80, 80, 0.2)'
                                            : 'rgba(0, 255, 100, 0.15)',
                                        color: trainState.isTraining ? '#ff5050' : '#00ff64',
                                        border: `1px solid ${trainState.isTraining ? 'rgba(255,80,80,0.3)' : 'rgba(0,255,100,0.3)'}`,
                                    }}
                                >
                                    {trainState.isTraining ? 'Stop' : 'Train'}
                                </button>
                                <button
                                    onClick={() => resetNetwork()}
                                    className="flex-1 py-2 text-xs rounded-lg font-medium transition-all"
                                    style={{
                                        background: 'rgba(150, 180, 220, 0.08)',
                                        color: 'rgba(150, 180, 220, 0.6)',
                                        border: '1px solid rgba(150, 180, 220, 0.12)',
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Learning Rate */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: 'rgba(150, 180, 220, 0.6)' }}>Learning Rate</span>
                                <span className="font-mono" style={{ color: '#00b4ff' }}>
                                    {lr.toFixed(2)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0.01}
                                max={2.0}
                                step={0.01}
                                value={lr}
                                onChange={e => setLr(parseFloat(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #00b4ff ${((lr - 0.01) / 1.99) * 100}%, rgba(150,180,220,0.1) ${((lr - 0.01) / 1.99) * 100}%)`,
                                }}
                            />
                        </div>

                        {/* Dataset */}
                        <div>
                            <div className="text-xs font-medium mb-2" style={{ color: 'rgba(150, 180, 220, 0.6)' }}>
                                Dataset
                            </div>
                            <div className="flex gap-1">
                                {(Object.keys(DATASETS) as DatasetName[]).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setDatasetKey(key);
                                            resetNetwork();
                                        }}
                                        className="flex-1 py-1.5 text-xs rounded-md transition-all"
                                        style={{
                                            background: key === datasetKey
                                                ? 'rgba(0, 180, 255, 0.2)'
                                                : 'rgba(150, 180, 220, 0.05)',
                                            color: key === datasetKey ? '#00b4ff' : 'rgba(150,180,220,0.5)',
                                            border: `1px solid ${key === datasetKey ? 'rgba(0,180,255,0.3)' : 'rgba(150,180,220,0.08)'}`,
                                        }}
                                    >
                                        {DATASETS[key].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Architecture */}
                        <div>
                            <div className="text-xs font-medium mb-2" style={{ color: 'rgba(150, 180, 220, 0.6)' }}>
                                Architecture
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {ARCH_PRESETS.map((preset, idx) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            setArchIdx(idx);
                                            resetNetwork(idx);
                                        }}
                                        className="py-1.5 text-xs rounded-md font-mono transition-all"
                                        style={{
                                            background: idx === archIdx
                                                ? 'rgba(0, 180, 255, 0.2)'
                                                : 'rgba(150, 180, 220, 0.05)',
                                            color: idx === archIdx ? '#00b4ff' : 'rgba(150,180,220,0.5)',
                                            border: `1px solid ${idx === archIdx ? 'rgba(0,180,255,0.3)' : 'rgba(150,180,220,0.08)'}`,
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activation Function */}
                        <div>
                            <div className="text-xs font-medium mb-2" style={{ color: 'rgba(150, 180, 220, 0.6)' }}>
                                Activation Function
                            </div>
                            <div className="flex gap-1">
                                {(Object.keys(ACT) as ActivationFn[]).map(fn => (
                                    <button
                                        key={fn}
                                        onClick={() => {
                                            setActFnKey(fn);
                                            resetNetwork();
                                        }}
                                        className="flex-1 py-1.5 text-xs rounded-md transition-all"
                                        style={{
                                            background: fn === actFnKey
                                                ? 'rgba(0, 180, 255, 0.2)'
                                                : 'rgba(150, 180, 220, 0.05)',
                                            color: fn === actFnKey ? '#00b4ff' : 'rgba(150,180,220,0.5)',
                                            border: `1px solid ${fn === actFnKey ? 'rgba(0,180,255,0.3)' : 'rgba(150,180,220,0.08)'}`,
                                        }}
                                    >
                                        {ACT[fn].label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Gradient Visualization Toggle */}
                        <div>
                            <button
                                onClick={() => setShowGradients(g => !g)}
                                className="w-full py-1.5 text-xs rounded-md font-medium transition-all"
                                style={{
                                    background: showGradients
                                        ? 'rgba(255, 180, 0, 0.2)'
                                        : 'rgba(150, 180, 220, 0.05)',
                                    color: showGradients ? '#ffb400' : 'rgba(150,180,220,0.5)',
                                    border: `1px solid ${showGradients ? 'rgba(255,180,0,0.3)' : 'rgba(150,180,220,0.08)'}`,
                                }}
                            >
                                {showGradients ? 'Hide Gradients' : 'Show Gradients'}
                            </button>
                            {showGradients && (
                                <p className="text-[10px] mt-1" style={{ color: 'rgba(255, 180, 0, 0.5)' }}>
                                    Bright = large gradient, faint = vanishing gradient
                                </p>
                            )}
                        </div>

                        {/* Info */}
                        <div
                            className="p-3 rounded-lg text-xs space-y-1"
                            style={{
                                background: 'rgba(0, 180, 255, 0.04)',
                                border: '1px solid rgba(0, 180, 255, 0.08)',
                            }}
                        >
                            <div style={{ color: 'rgba(150, 180, 220, 0.5)' }}>
                                Network: {ARCH_PRESETS[archIdx].label} | {ACT[actFnKey].label} | {DATASETS[datasetKey].label}
                            </div>
                            <div style={{ color: 'rgba(150, 180, 220, 0.4)' }}>
                                Output uses sigmoid. Training via real backprop with MSE loss, gradient clipping, and chain-rule gradients.
                            </div>
                        </div>

                        {/* Legend */}
                        <div
                            className="flex items-center gap-3 text-xs pt-2 flex-wrap"
                            style={{
                                color: 'rgba(150, 180, 220, 0.4)',
                                borderTop: '1px solid rgba(0, 180, 255, 0.06)',
                            }}
                        >
                            {showGradients ? (
                                <>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-1.5 rounded"
                                            style={{ background: '#ff3300' }}
                                        />
                                        <span>large grad</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-1.5 rounded"
                                            style={{ background: 'rgba(255,200,40,0.3)' }}
                                        />
                                        <span>vanishing</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-1.5 rounded"
                                            style={{ background: '#00b4ff' }}
                                        />
                                        <span>+weight</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-1.5 rounded"
                                            style={{ background: '#ff5050' }}
                                        />
                                        <span>-weight</span>
                                    </div>
                                    <span>opacity = |w|</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
