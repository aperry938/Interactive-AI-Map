import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

interface AttentionVisualizerProps {
    onComplete?: () => void;
}

// ── Linear algebra helpers ──────────────────────────────────────────────

function randomMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.8)
    );
}

function matMul(A: number[][], B: number[][]): number[][] {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const C: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let sum = 0;
            for (let k = 0; k < inner; k++) sum += A[i][k] * B[k][j];
            C[i][j] = sum;
        }
    }
    return C;
}

function transpose(M: number[][]): number[][] {
    const rows = M.length;
    const cols = M[0].length;
    const T: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) T[j][i] = M[i][j];
    return T;
}

function softmaxRows(M: number[][], temperature: number, dk: number): number[][] {
    const scale = Math.sqrt(dk) * temperature;
    return M.map(row => {
        const scaled = row.map(v => v / scale);
        const maxVal = Math.max(...scaled);
        const exps = scaled.map(v => Math.exp(v - maxVal));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    });
}

function averageMatrices(matrices: number[][][]): number[][] {
    const rows = matrices[0].length;
    const cols = matrices[0][0].length;
    const n = matrices.length;
    return Array.from({ length: rows }, (_, i) =>
        Array.from({ length: cols }, (_, j) => {
            let sum = 0;
            for (const m of matrices) sum += m[i][j];
            return sum / n;
        })
    );
}

// ── Types for attention head data ───────────────────────────────────────

interface HeadData {
    wQ: number[][];
    wK: number[][];
    wV: number[][];
    Q: number[][];
    K: number[][];
    V: number[][];
    scores: number[][];
    attention: number[][];
    output: number[][];
}

function computeHead(
    embeddings: number[][],
    wQ: number[][],
    wK: number[][],
    wV: number[][],
    temperature: number,
    dk: number
): HeadData {
    const Q = matMul(embeddings, wQ);
    const K = matMul(embeddings, wK);
    const V = matMul(embeddings, wV);
    const scores = matMul(Q, transpose(K));
    const attention = softmaxRows(scores, temperature, dk);
    const output = matMul(attention, V);
    return { wQ, wK, wV, Q, K, V, scores, attention, output };
}

// ── Constants ───────────────────────────────────────────────────────────

const DIM = 8;
const DEFAULT_SENTENCE = 'The cat sat on the mat';
const NUM_HEADS = 3;
const STAGE_LABELS = [
    'Embeddings',
    'Q, K, V Projection',
    'QK^T Score',
    'Scaled + Softmax',
    'Output',
];
const HEAD_COLORS = [
    { bg: 'rgba(59,130,246,', label: 'Head 1', border: '#3B82F6' },
    { bg: 'rgba(16,185,129,', label: 'Head 2', border: '#10B981' },
    { bg: 'rgba(168,85,247,', label: 'Head 3', border: '#A855F7' },
];

// ── Component ───────────────────────────────────────────────────────────

export const AttentionVisualizer: React.FC<AttentionVisualizerProps> = ({ onComplete }) => {
    // Input state
    const [inputText, setInputText] = useState(DEFAULT_SENTENCE);
    const [sentence, setSentence] = useState(DEFAULT_SENTENCE);
    const [temperature, setTemperature] = useState(1.0);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
    const [stage, setStage] = useState(0);
    const [multiHead, setMultiHead] = useState(false);
    const [showCombined, setShowCombined] = useState(false);
    const [weightSeed, setWeightSeed] = useState(0);

    // Completion tracking
    const [tempAdjusted, setTempAdjusted] = useState(false);
    const [qkvViewed, setQkvViewed] = useState(false);
    const completeFired = useRef(false);

    const tokens = useMemo(() => sentence.split(/\s+/).filter(Boolean), [sentence]);
    const n = tokens.length;

    // Stable random embeddings per sentence
    const embeddings = useMemo(() => randomMatrix(n, DIM), [n, sentence]);

    // Weight matrices (re-randomize on seed change)
    const allWeights = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _seed = weightSeed; // dependency trigger
        return Array.from({ length: NUM_HEADS }, () => ({
            wQ: randomMatrix(DIM, DIM),
            wK: randomMatrix(DIM, DIM),
            wV: randomMatrix(DIM, DIM),
        }));
    }, [weightSeed, sentence]);

    // Compute all heads
    const heads: HeadData[] = useMemo(
        () => allWeights.map(w => computeHead(embeddings, w.wQ, w.wK, w.wV, temperature, DIM)),
        [embeddings, allWeights, temperature]
    );

    const primaryHead = heads[0];
    const activeAttention = primaryHead.attention;

    const combinedAttention = useMemo(() => averageMatrices(heads.map(h => h.attention)), [heads]);

    // Completion tracking effects
    useEffect(() => {
        if (tempAdjusted && qkvViewed && !completeFired.current) {
            completeFired.current = true;
            onComplete?.();
        }
    }, [tempAdjusted, qkvViewed, onComplete]);

    const handleApplySentence = useCallback(() => {
        const trimmed = inputText.trim();
        if (trimmed) {
            setSentence(trimmed);
            setSelectedToken(null);
            setStage(0);
        }
    }, [inputText]);

    const handleRegenerate = useCallback(() => {
        setWeightSeed(s => s + 1);
    }, []);

    const handleTempChange = useCallback((val: number) => {
        setTemperature(val);
        setTempAdjusted(true);
    }, []);

    const handleStageChange = useCallback((dir: number) => {
        setStage(s => Math.max(0, Math.min(STAGE_LABELS.length - 1, s + dir)));
        if (stage + dir >= 1) setQkvViewed(true);
    }, [stage]);

    // ── Rendering helpers ───────────────────────────────────────────────

    const arcsSvg = useMemo(() => {
        if (selectedToken === null) return null;
        const weights = activeAttention[selectedToken];
        if (!weights) return null;
        const maxW = Math.max(...weights);
        const tokenWidth = 72;
        const svgWidth = n * tokenWidth;
        const baseY = 80;

        return (
            <svg width="100%" height="90" viewBox={`0 0 ${svgWidth} 90`} preserveAspectRatio="xMidYMid meet">
                {weights.map((w, j) => {
                    if (j === selectedToken || w < 0.01) return null;
                    const x1 = selectedToken * tokenWidth + tokenWidth / 2;
                    const x2 = j * tokenWidth + tokenWidth / 2;
                    const midX = (x1 + x2) / 2;
                    const arcH = Math.min(Math.abs(j - selectedToken) * 14 + 18, 70);
                    const opacity = Math.max(0.15, w / maxW);
                    const sw = 1 + (w / maxW) * 5;
                    return (
                        <path
                            key={j}
                            d={`M ${x1} ${baseY} Q ${midX} ${baseY - arcH} ${x2} ${baseY}`}
                            fill="none"
                            stroke="#22D3EE"
                            strokeWidth={sw}
                            opacity={opacity}
                            className="transition-opacity duration-200"
                        />
                    );
                })}
            </svg>
        );
    }, [selectedToken, activeAttention, n]);

    // Matrix cell renderer
    const renderMatrix = (
        matrix: number[][],
        rowLabels: string[],
        colLabels: string[],
        colorFn: (val: number) => string,
        labelPrefix?: string,
        highlightRow?: number | null,
        highlightCol?: number | null,
        onCellHover?: (row: number, col: number) => void,
        onCellLeave?: () => void,
    ) => {
        return (
            <div className="overflow-x-auto">
                {labelPrefix && (
                    <div className="text-xs font-semibold mb-1 text-slate-400" style={{ letterSpacing: '0.05em' }}>
                        {labelPrefix}
                    </div>
                )}
                <table className="border-collapse" style={{ fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th className="w-8"></th>
                            {colLabels.map((c, j) => (
                                <th
                                    key={j}
                                    className="px-1 py-0.5 font-medium text-center truncate max-w-[52px]"
                                    style={{
                                        color: highlightCol === j ? '#22D3EE' : '#94A3B8',
                                    }}
                                >
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i}>
                                <td
                                    className="pr-1 font-medium text-right truncate max-w-[52px]"
                                    style={{
                                        color: highlightRow === i ? '#22D3EE' : '#94A3B8',
                                    }}
                                >
                                    {rowLabels[i]}
                                </td>
                                {row.map((val, j) => (
                                    <td
                                        key={j}
                                        className="text-center cursor-default transition-colors duration-100"
                                        style={{
                                            backgroundColor: colorFn(val),
                                            color: '#E2E8F0',
                                            padding: '3px 4px',
                                            border: '1px solid rgba(51,65,85,0.4)',
                                            fontFamily: 'monospace',
                                            fontWeight:
                                                highlightRow === i && highlightCol === j ? 700 : 400,
                                            outline:
                                                highlightRow === i && highlightCol === j
                                                    ? '2px solid #22D3EE'
                                                    : 'none',
                                        }}
                                        onMouseEnter={() => onCellHover?.(i, j)}
                                        onMouseLeave={onCellLeave}
                                    >
                                        {val.toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const attentionColor = (v: number) => `rgba(59,130,246,${Math.min(1, v).toFixed(3)})`;
    const qColor = (v: number) => {
        const t = Math.min(1, Math.abs(v));
        return `rgba(59,130,246,${(t * 0.7 + 0.08).toFixed(3)})`;
    };
    const kColor = (v: number) => {
        const t = Math.min(1, Math.abs(v));
        return `rgba(16,185,129,${(t * 0.7 + 0.08).toFixed(3)})`;
    };
    const vColor = (v: number) => {
        const t = Math.min(1, Math.abs(v));
        return `rgba(168,85,247,${(t * 0.7 + 0.08).toFixed(3)})`;
    };

    const headHeatmapColor = (headIdx: number) => (v: number) => {
        return `${HEAD_COLORS[headIdx].bg}${Math.min(1, v).toFixed(3)})`;
    };

    const dimLabels = Array.from({ length: DIM }, (_, i) => `d${i}`);

    // ── Layout ──────────────────────────────────────────────────────────

    return (
        <div
            style={{
                background: '#0F172A',
                color: '#E2E8F0',
                minHeight: '100vh',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
        >
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                {/* ── Sidebar controls ──────────────────────────────── */}
                <aside
                    style={{
                        width: 280,
                        flexShrink: 0,
                        borderRight: '1px solid rgba(51,65,85,0.5)',
                        padding: '24px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 24,
                        overflowY: 'auto',
                        background: '#0B1121',
                    }}
                >
                    <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#F1F5F9' }}>
                        Attention Mechanism
                    </h1>

                    {/* Sentence input */}
                    <div>
                        <label style={labelStyle}>Sentence</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleApplySentence()}
                                style={inputStyle}
                                placeholder="Type a sentence..."
                            />
                            <button onClick={handleApplySentence} style={btnPrimary}>
                                Apply
                            </button>
                        </div>
                    </div>

                    {/* Temperature */}
                    <div>
                        <label style={labelStyle}>
                            Temperature: <span style={{ color: '#22D3EE' }}>{temperature.toFixed(2)}</span>
                        </label>
                        <input
                            type="range"
                            min={0.1}
                            max={5.0}
                            step={0.05}
                            value={temperature}
                            onChange={e => handleTempChange(parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: '#22D3EE' }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 10,
                                color: '#64748B',
                                marginTop: 2,
                            }}
                        >
                            <span>Sharp (0.1)</span>
                            <span>Flat (5.0)</span>
                        </div>
                    </div>

                    {/* Regenerate */}
                    <button onClick={handleRegenerate} style={btnSecondary}>
                        Regenerate Weights
                    </button>

                    {/* Multi-head toggle */}
                    <div>
                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={multiHead}
                                onChange={e => setMultiHead(e.target.checked)}
                                style={{ accentColor: '#22D3EE' }}
                            />
                            Multi-Head Mode
                        </label>
                        {multiHead && (
                            <label
                                style={{
                                    ...labelStyle,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    marginTop: 8,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={showCombined}
                                    onChange={e => setShowCombined(e.target.checked)}
                                    style={{ accentColor: '#22D3EE' }}
                                />
                                Show Combined View
                            </label>
                        )}
                    </div>

                    {/* Computation stage */}
                    <div>
                        <label style={labelStyle}>Computation Stage</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                                onClick={() => handleStageChange(-1)}
                                disabled={stage === 0}
                                style={{
                                    ...btnSmall,
                                    opacity: stage === 0 ? 0.3 : 1,
                                }}
                            >
                                Prev
                            </button>
                            <span style={{ fontSize: 12, flex: 1, textAlign: 'center', color: '#CBD5E1' }}>
                                {stage + 1}/{STAGE_LABELS.length}
                            </span>
                            <button
                                onClick={() => handleStageChange(1)}
                                disabled={stage === STAGE_LABELS.length - 1}
                                style={{
                                    ...btnSmall,
                                    opacity: stage === STAGE_LABELS.length - 1 ? 0.3 : 1,
                                }}
                            >
                                Next
                            </button>
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                padding: '6px 10px',
                                background: 'rgba(34,211,238,0.08)',
                                borderRadius: 6,
                                fontSize: 12,
                                color: '#22D3EE',
                                textAlign: 'center',
                                fontWeight: 600,
                            }}
                        >
                            {STAGE_LABELS[stage]}
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
                        <div>Click a token to see attention arcs</div>
                        <div>Hover heatmap cells to highlight tokens</div>
                        <div>Step through stages to see QKV breakdown</div>
                    </div>
                </aside>

                {/* ── Main content ──────────────────────────────────── */}
                <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {/* ── Token arcs ────────────────────────────────── */}
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={sectionTitle}>Tokens &amp; Attention Arcs</h2>
                        <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: '16px 12px', border: '1px solid rgba(51,65,85,0.4)' }}>
                            {arcsSvg}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: selectedToken !== null ? 0 : 8 }}>
                                {tokens.map((tok, i) => {
                                    const isSelected = i === selectedToken;
                                    const isHighlightedRow = hoveredCell?.row === i;
                                    const isHighlightedCol = hoveredCell?.col === i;
                                    const highlighted = isHighlightedRow || isHighlightedCol;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedToken(i === selectedToken ? null : i)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: 6,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                border: isSelected
                                                    ? '2px solid #22D3EE'
                                                    : highlighted
                                                        ? '2px solid rgba(34,211,238,0.5)'
                                                        : '2px solid rgba(51,65,85,0.5)',
                                                background: isSelected
                                                    ? 'rgba(34,211,238,0.15)'
                                                    : highlighted
                                                        ? 'rgba(34,211,238,0.08)'
                                                        : 'rgba(30,41,59,0.7)',
                                                color: isSelected || highlighted ? '#22D3EE' : '#CBD5E1',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {tok}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedToken !== null && (
                                <div style={{ marginTop: 10, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                                    Showing attention from "<span style={{ color: '#22D3EE' }}>{tokens[selectedToken]}</span>" to all other tokens
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Attention heatmap(s) ─────────────────────── */}
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={sectionTitle}>
                            {multiHead ? 'Multi-Head Attention Heatmaps' : 'Attention Heatmap'}
                        </h2>
                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                flexWrap: 'wrap',
                                background: 'rgba(15,23,42,0.6)',
                                borderRadius: 12,
                                padding: 16,
                                border: '1px solid rgba(51,65,85,0.4)',
                            }}
                        >
                            {multiHead ? (
                                <>
                                    {heads.map((head, hIdx) => (
                                        <div key={hIdx} style={{ flex: '1 1 200px', minWidth: 0 }}>
                                            {renderMatrix(
                                                head.attention,
                                                tokens,
                                                tokens,
                                                headHeatmapColor(hIdx),
                                                HEAD_COLORS[hIdx].label,
                                                hoveredCell?.row ?? null,
                                                hoveredCell?.col ?? null,
                                                (r, c) => setHoveredCell({ row: r, col: c }),
                                                () => setHoveredCell(null),
                                            )}
                                        </div>
                                    ))}
                                    {showCombined && (
                                        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                            {renderMatrix(
                                                combinedAttention,
                                                tokens,
                                                tokens,
                                                attentionColor,
                                                'Combined (avg)',
                                                hoveredCell?.row ?? null,
                                                hoveredCell?.col ?? null,
                                                (r, c) => setHoveredCell({ row: r, col: c }),
                                                () => setHoveredCell(null),
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                renderMatrix(
                                    activeAttention,
                                    tokens,
                                    tokens,
                                    attentionColor,
                                    'softmax(QK^T / sqrt(d_k))',
                                    hoveredCell?.row ?? null,
                                    hoveredCell?.col ?? null,
                                    (r, c) => setHoveredCell({ row: r, col: c }),
                                    () => setHoveredCell(null),
                                )
                            )}
                        </div>
                    </section>

                    {/* ── QKV Matrices / Stage breakdown ───────────── */}
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={sectionTitle}>QKV Matrix Breakdown</h2>
                        <div
                            style={{
                                background: 'rgba(15,23,42,0.6)',
                                borderRadius: 12,
                                padding: 16,
                                border: '1px solid rgba(51,65,85,0.4)',
                            }}
                        >
                            {stage === 0 && (
                                <div>
                                    <div style={matrixSectionLabel}>Embedding Matrix (X) &mdash; {n} tokens x {DIM} dims</div>
                                    {renderMatrix(embeddings, tokens, dimLabels, qColor)}
                                </div>
                            )}

                            {stage >= 1 && stage <= 2 && (
                                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{ ...matrixSectionLabel, color: '#3B82F6' }}>Q = X * W_Q</div>
                                        {renderMatrix(primaryHead.Q, tokens, dimLabels, qColor)}
                                    </div>
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{ ...matrixSectionLabel, color: '#10B981' }}>K = X * W_K</div>
                                        {renderMatrix(primaryHead.K, tokens, dimLabels, kColor)}
                                    </div>
                                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                        <div style={{ ...matrixSectionLabel, color: '#A855F7' }}>V = X * W_V</div>
                                        {renderMatrix(primaryHead.V, tokens, dimLabels, vColor)}
                                    </div>
                                </div>
                            )}

                            {stage === 2 && (
                                <div style={{ marginTop: 20 }}>
                                    <div style={matrixSectionLabel}>Raw Scores: QK^T</div>
                                    {renderMatrix(
                                        primaryHead.scores,
                                        tokens,
                                        tokens,
                                        (v) => {
                                            const t = Math.min(1, Math.max(0, (v + 2) / 4));
                                            return `rgba(234,179,8,${(t * 0.7 + 0.08).toFixed(3)})`;
                                        },
                                    )}
                                </div>
                            )}

                            {stage === 3 && (
                                <div>
                                    <div style={matrixSectionLabel}>
                                        Scaled Attention: softmax(QK^T / (sqrt({DIM}) * {temperature.toFixed(2)}))
                                    </div>
                                    {renderMatrix(activeAttention, tokens, tokens, attentionColor)}
                                </div>
                            )}

                            {stage === 4 && (
                                <div>
                                    <div style={matrixSectionLabel}>Output = Attention * V</div>
                                    {renderMatrix(
                                        primaryHead.output,
                                        tokens,
                                        dimLabels,
                                        (v) => {
                                            const t = Math.min(1, Math.abs(v));
                                            return `rgba(251,146,60,${(t * 0.7 + 0.08).toFixed(3)})`;
                                        },
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

// ── Style constants ─────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid rgba(51,65,85,0.6)',
    background: 'rgba(15,23,42,0.8)',
    color: '#E2E8F0',
    fontSize: 13,
    outline: 'none',
};

const btnPrimary: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#22D3EE',
    color: '#0F172A',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(34,211,238,0.3)',
    background: 'rgba(34,211,238,0.08)',
    color: '#22D3EE',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
};

const btnSmall: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid rgba(51,65,85,0.5)',
    background: 'rgba(30,41,59,0.7)',
    color: '#CBD5E1',
    fontWeight: 600,
    fontSize: 11,
    cursor: 'pointer',
};

const sectionTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: '#CBD5E1',
    marginBottom: 12,
    letterSpacing: '0.02em',
};

const matrixSectionLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: '0.03em',
};
