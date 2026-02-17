import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { curriculum } from '../../data/curriculum';
import { TIER_CONFIG, MASTERY_THRESHOLD } from '../../types';
import type { ConceptNode, Tier } from '../../types';
import { useLearner } from '../../stores/learnerStore';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  concept: ConceptNode;
  radius: number;
  tierX: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: 'prerequisite' | 'connection';
}

interface KnowledgeGraphProps {
  searchTerm?: string;
  onSelectNode: (conceptId: string) => void;
  selectedNodeId?: string | null;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  searchTerm = '',
  onSelectNode,
  selectedNodeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const transformRef = useRef(d3.zoomIdentity);
  const hoveredRef = useRef<string | null>(null);
  const dragRef = useRef<GraphNode | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const previouslyVisibleRef = useRef<Set<string>>(new Set());
  const revealingNodesRef = useRef<Map<string, number>>(new Map());
  // Use refs for props that change frequently to avoid restarting the simulation
  const selectedNodeIdRef = useRef<string | null>(selectedNodeId ?? null);
  const searchTermRef = useRef(searchTerm);
  const onSelectNodeRef = useRef(onSelectNode);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const { getMastery, getConceptState } = useLearner();

  // Keep refs in sync with props
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId ?? null; }, [selectedNodeId]);
  useEffect(() => { searchTermRef.current = searchTerm; }, [searchTerm]);
  useEffect(() => { onSelectNodeRef.current = onSelectNode; }, [onSelectNode]);

  // Build graph data
  const buildGraph = useCallback(() => {
    const concepts = Object.values(curriculum);
    const nodes: GraphNode[] = concepts.map((c) => {
      const connectionCount = c.prerequisites.length + c.connections.length +
        concepts.filter(other => other.prerequisites.includes(c.id)).length;
      const radius = Math.max(12, Math.min(24, 10 + connectionCount * 2));
      const tierPositions: Record<number, number> = { 1: 0.1, 2: 0.3, 3: 0.5, 4: 0.7, 5: 0.9 };
      return {
        id: c.id,
        concept: c,
        radius,
        tierX: tierPositions[c.tier] || 0.5,
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links: GraphLink[] = [];

    for (const c of concepts) {
      for (const preId of c.prerequisites) {
        if (nodeMap.has(preId)) {
          links.push({ source: preId, target: c.id, type: 'prerequisite' });
        }
      }
      for (const connId of c.connections) {
        if (nodeMap.has(connId) && !links.some(l =>
          (l.source === c.id && l.target === connId) ||
          (l.source === connId && l.target === c.id)
        )) {
          links.push({ source: c.id, target: connId, type: 'connection' });
        }
      }
    }

    return { nodes, links };
  }, []);

  // Initialize simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const { nodes: allNodes, links: allLinks } = buildGraph();

    // Progressive reveal: only show reachable nodes (fog-of-war effect)
    const isReachable = (id: string): boolean => {
      const concept = curriculum[id];
      if (!concept) return false;
      // Root nodes (no prerequisites) are always visible
      if (concept.prerequisites.length === 0) return true;
      // Visible if any prerequisite has been explored or attempted
      return concept.prerequisites.some(preId => {
        const state = getConceptState(preId);
        return state.explored || state.attemptHistory.length > 0 || state.masteryProbability > 0.15;
      });
    };

    const visibleNodeIds = new Set(allNodes.filter(n => isReachable(n.id)).map(n => n.id));

    // Detect newly revealed nodes and start their reveal animation
    const now = Date.now();
    for (const id of visibleNodeIds) {
      if (!previouslyVisibleRef.current.has(id)) {
        revealingNodesRef.current.set(id, now);
      }
    }
    previouslyVisibleRef.current = new Set(visibleNodeIds);

    const nodes = allNodes.filter(n => visibleNodeIds.has(n.id));
    const links = allLinks.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
      const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    nodesRef.current = nodes;
    linksRef.current = links;

    // Set initial positions based on tier
    for (const node of nodes) {
      node.x = node.tierX * width;
      node.y = height * 0.3 + Math.random() * height * 0.4;
    }

    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(80)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('tierX', d3.forceX<GraphNode>(d => d.tierX * width).strength(0.15))
      .force('tierY', d3.forceY(height / 2).strength(0.05))
      .force('collision', d3.forceCollide<GraphNode>(d => d.radius + 8))
      .alphaDecay(0.02);

    simRef.current = sim;

    // Draw function
    const draw = () => {
      const t = transformRef.current;
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      const search = searchTermRef.current.toLowerCase();
      const hovered = hoveredRef.current;

      // Determine which nodes match search
      const matchesSearch = (id: string) => {
        if (!search) return true;
        const c = curriculum[id];
        return c && (c.name.toLowerCase().includes(search) || c.id.includes(search));
      };

      // Get connected nodes for hover highlight
      const connectedToHovered = new Set<string>();
      if (hovered) {
        connectedToHovered.add(hovered);
        for (const link of links) {
          const s = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
          const t2 = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
          if (s === hovered) connectedToHovered.add(t2);
          if (t2 === hovered) connectedToHovered.add(s);
        }
      }

      // Draw links — warm monotone
      for (const link of links) {
        const source = link.source as GraphNode;
        const target = link.target as GraphNode;
        if (!source.x || !source.y || !target.x || !target.y) continue;

        const dimmed = hovered && !connectedToHovered.has(source.id) && !connectedToHovered.has(target.id);
        const searchDimmed = search && (!matchesSearch(source.id) && !matchesSearch(target.id));

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (link.type === 'prerequisite') {
          ctx.strokeStyle = dimmed || searchDimmed ? 'rgba(44,26,26,0.06)' : 'rgba(44,26,26,0.15)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = dimmed || searchDimmed ? 'rgba(44,26,26,0.03)' : 'rgba(44,26,26,0.08)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead for prerequisites
        if (link.type === 'prerequisite' && !dimmed && !searchDimmed) {
          const angle = Math.atan2(target.y - source.y, target.x - source.x);
          const arrowDist = target.radius + 4;
          const ax = target.x - Math.cos(angle) * arrowDist;
          const ay = target.y - Math.sin(angle) * arrowDist;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - 6 * Math.cos(angle - 0.4), ay - 6 * Math.sin(angle - 0.4));
          ctx.lineTo(ax - 6 * Math.cos(angle + 0.4), ay - 6 * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fillStyle = 'rgba(44,26,26,0.2)';
          ctx.fill();
        }
      }

      // Draw nodes — monotone warm aesthetic
      const drawTime = Date.now();
      let hasActiveReveal = false;
      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const c = node.concept;
        const mastery = getMastery(c.id);
        const isSearchMatch = matchesSearch(c.id);
        const isHovered = hovered === c.id;
        const isSelected = selectedNodeIdRef.current === c.id;
        const isConnected = connectedToHovered.has(c.id);
        const dimmed = (hovered && !isConnected) || (search && !isSearchMatch);

        // Check prerequisites met
        const prereqsMet = c.prerequisites.every(p => getMastery(p) >= MASTERY_THRESHOLD);
        const locked = c.prerequisites.length > 0 && !prereqsMet;

        // Reveal animation
        const revealStart = revealingNodesRef.current.get(c.id);
        let revealScale = 1;
        let revealGlowAlpha = 0;
        if (revealStart !== undefined) {
          const elapsed = drawTime - revealStart;
          const REVEAL_DURATION = 500;
          const GLOW_DURATION = 1000;
          if (elapsed < REVEAL_DURATION) {
            const t = elapsed / REVEAL_DURATION;
            revealScale = 1 - Math.pow(1 - t, 3);
            hasActiveReveal = true;
          }
          if (elapsed < GLOW_DURATION) {
            revealGlowAlpha = 1 - (elapsed / GLOW_DURATION);
            hasActiveReveal = true;
          } else {
            revealingNodesRef.current.delete(c.id);
          }
        }

        const effectiveRadius = node.radius * revealScale;

        // Reveal glow ring — soft white
        if (revealGlowAlpha > 0 && !dimmed) {
          const glowGrad = ctx.createRadialGradient(node.x, node.y, effectiveRadius, node.x, node.y, effectiveRadius + 20);
          glowGrad.addColorStop(0, `rgba(255,255,255,${(revealGlowAlpha * 0.3).toFixed(2)})`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 20, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Mastery glow — soft warm
        if (mastery > 0.2 && !dimmed && revealScale > 0.5) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 6 + mastery * 8, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(node.x, node.y, effectiveRadius, node.x, node.y, effectiveRadius + 6 + mastery * 8);
          grad.addColorStop(0, `rgba(255,255,255,${(mastery * 0.2).toFixed(2)})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Node circle — white/cream monotone
        if (effectiveRadius > 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);

          if (dimmed) {
            ctx.fillStyle = 'rgba(44,26,26,0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(44,26,26,0.06)';
            ctx.lineWidth = 1;
          } else if (locked) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
          } else {
            // Active nodes: white with opacity based on tier (higher tiers slightly more opaque)
            const tierOpacity = 0.5 + (c.tier as number) * 0.08;
            const masteryBoost = mastery * 0.2;
            ctx.fillStyle = `rgba(255,255,255,${(tierOpacity + masteryBoost).toFixed(2)})`;
            ctx.fill();
            ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.9)' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
          }
          ctx.stroke();
        }

        // Lock icon
        if (locked && !dimmed && revealScale > 0.7) {
          const lockColor = 'rgba(44,26,26,0.3)';
          const lockSize = effectiveRadius * 0.35;
          ctx.fillStyle = lockColor;
          ctx.strokeStyle = lockColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y - lockSize * 0.3, lockSize * 0.5, Math.PI, 0, false);
          ctx.stroke();
          ctx.fillRect(node.x - lockSize * 0.6, node.y - lockSize * 0.3, lockSize * 1.2, lockSize * 1.0);
        }
        // Mastery checkmark
        else if (mastery >= MASTERY_THRESHOLD && !dimmed && revealScale > 0.7) {
          ctx.fillStyle = 'rgba(44,26,26,0.6)';
          ctx.font = `bold ${effectiveRadius * 0.8}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u2713', node.x, node.y);
        }

        // Label — warm tones
        if ((!dimmed || isSearchMatch) && revealScale > 0.5) {
          ctx.font = `${isHovered || isSelected ? '600' : '400'} 11px "Inter", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const labelY = node.y + effectiveRadius + 6;
          const textWidth = ctx.measureText(c.name).width;
          ctx.globalAlpha = revealScale;
          // Label background
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(node.x - textWidth / 2 - 3, labelY - 1, textWidth + 6, 14);
          // Label text
          ctx.fillStyle = dimmed ? 'rgba(44,26,26,0.3)' : isSearchMatch && search ? '#D94436' : 'rgba(44,26,26,0.7)';
          ctx.fillText(c.name, node.x, labelY);
          ctx.globalAlpha = 1;
        }
      }

      // Keep the animation loop running if there are active reveal animations
      if (hasActiveReveal) {
        requestAnimationFrame(draw);
      }

      ctx.restore();
    };

    sim.on('tick', draw);

    // Hit testing
    const getNodeAt = (mx: number, my: number): GraphNode | null => {
      const t = transformRef.current;
      const x = (mx - t.x) / t.k;
      const y = (my - t.y) / t.k;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!n.x || !n.y) continue;
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy < (n.radius + 4) * (n.radius + 4)) return n;
      }
      return null;
    };

    // Zoom behavior — filter out clicks/taps on nodes so they don't start a pan
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 3])
      .filter((event: any) => {
        // Always allow wheel zoom
        if (event.type === 'wheel') return true;
        // Block context menu / right-click
        if (event.ctrlKey || event.button) return false;
        // Don't start pan when clicking/touching a node
        if (event.type === 'mousedown' || event.type === 'touchstart') {
          const rect = canvas.getBoundingClientRect();
          const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
          const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;
          const node = getNodeAt(clientX - rect.left, clientY - rect.top);
          if (node) return false;
        }
        return true;
      })
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        draw();
      });

    const canvasSel = d3.select(canvas);
    canvasSel.call(zoom as any);

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);
      hoveredRef.current = node?.id || null;
      setHoveredNode(node?.id || null);
      canvas.style.cursor = node ? 'pointer' : 'grab';
      if (dragRef.current && dragRef.current.x !== undefined && dragRef.current.y !== undefined) {
        const t = transformRef.current;
        dragRef.current.fx = (mx - t.x) / t.k;
        dragRef.current.fy = (my - t.y) / t.k;
        sim.alpha(0.3).restart();
      }
      draw();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseDownPosRef.current = { x: mx, y: my };
      const node = getNodeAt(mx, my);
      if (node) {
        dragRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const downPos = mouseDownPosRef.current;
        const dx = downPos ? mx - downPos.x : 0;
        const dy = downPos ? my - downPos.y : 0;
        const distSq = dx * dx + dy * dy;

        // If moved less than 5px, treat as click
        if (distSq < 25) {
          onSelectNodeRef.current(dragRef.current.id);
        }
        dragRef.current.fx = null;
        dragRef.current.fy = null;
        dragRef.current = null;
        sim.alpha(0.1).restart();
      }
      mouseDownPosRef.current = null;
    };

    const handleDblClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
      if (node) {
        node.fx = null;
        node.fy = null;
        sim.alpha(0.3).restart();
      }
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // Only handle single touch
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      mouseDownPosRef.current = { x: mx, y: my };
      const node = getNodeAt(mx, my);
      if (node) {
        dragRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      const t = transformRef.current;
      dragRef.current.fx = (mx - t.x) / t.k;
      dragRef.current.fy = (my - t.y) / t.k;
      sim.alpha(0.3).restart();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (dragRef.current) {
        const touch = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const mx = touch.clientX - rect.left;
        const my = touch.clientY - rect.top;
        const downPos = mouseDownPosRef.current;
        const dx = downPos ? mx - downPos.x : 0;
        const dy = downPos ? my - downPos.y : 0;
        const distSq = dx * dx + dy * dy;

        // If moved less than 10px, treat as tap (more forgiving than mouse)
        if (distSq < 100) {
          onSelectNodeRef.current(dragRef.current.id);
        }
        dragRef.current.fx = null;
        dragRef.current.fy = null;
        dragRef.current = null;
        sim.alpha(0.1).restart();
      }
      mouseDownPosRef.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDblClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const newCtx = canvas.getContext('2d');
      if (newCtx) newCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      sim.force('center', d3.forceCenter(w / 2, h / 2));
      sim.force('tierX', d3.forceX<GraphNode>(d => d.tierX * w).strength(0.15));
      sim.force('tierY', d3.forceY(h / 2).strength(0.05));
      sim.alpha(0.3).restart();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      sim.stop();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('dblclick', handleDblClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, [buildGraph, getMastery, getConceptState]);

  // Redraw when mastery, search, or selection changes (without restarting simulation)
  useEffect(() => {
    if (simRef.current) {
      simRef.current.alpha(0.01).restart();
    }
  }, [getMastery, searchTerm, selectedNodeId]);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const concepts = Object.values(curriculum);
    const currentIdx = focusedNodeId ? concepts.findIndex(c => c.id === focusedNodeId) : -1;

    if (e.key === 'Enter' && focusedNodeId) {
      e.preventDefault();
      onSelectNode(focusedNodeId);
      return;
    }

    if (e.key === 'Escape') {
      setFocusedNodeId(null);
      setSrAnnouncement('Selection cleared');
      return;
    }

    let nextIdx: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = currentIdx < concepts.length - 1 ? currentIdx + 1 : 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = currentIdx > 0 ? currentIdx - 1 : concepts.length - 1;
    } else {
      return;
    }

    const nextConcept = concepts[nextIdx];
    if (nextConcept) {
      setFocusedNodeId(nextConcept.id);
      onSelectNode(nextConcept.id);
      setSrAnnouncement(`${nextConcept.name}, Tier ${nextConcept.tier}, Mastery ${Math.round(getMastery(nextConcept.id) * 100)}%`);
    }
  }, [focusedNodeId, onSelectNode, getMastery]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        tabIndex={0}
        role="application"
        aria-label="Knowledge graph. Use arrow keys to navigate between concepts, Enter to open details, Escape to deselect."
        onKeyDown={handleKeyDown}
      />
      {/* Tier legend — monotone */}
      <div className="absolute bottom-4 left-4 flex gap-3 glass rounded-2xl px-3 py-2">
        {([1, 2, 3, 4, 5] as Tier[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full bg-white/60"
              style={{ opacity: 0.4 + t * 0.12 }}
            />
            <span className="text-her-dark/40 dark:text-her-cream/40">
              T{t}
            </span>
          </div>
        ))}
      </div>
      {/* Revealed node count */}
      <div className="absolute bottom-4 right-4 glass rounded-2xl px-3 py-2 text-xs text-her-dark/40 dark:text-her-cream/40">
        {Object.keys(curriculum).length} concepts
      </div>
      {/* Hovered node tooltip */}
      {hoveredNode && curriculum[hoveredNode] && (
        <div className="absolute top-4 right-4 glass-strong rounded-2xl p-3 max-w-xs pointer-events-none animate-fade-in">
          <div className="text-sm font-semibold text-her-dark dark:text-her-cream">
            {curriculum[hoveredNode].name}
          </div>
          <div className="text-xs text-her-dark/50 dark:text-her-cream/50 mt-1">
            {curriculum[hoveredNode].description}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] uppercase tracking-wider text-her-dark/30 dark:text-her-cream/30">
              Tier {curriculum[hoveredNode].tier}
            </span>
            <span className="text-[10px] text-her-dark/30 dark:text-her-cream/30">
              {Math.round(getMastery(hoveredNode) * 100)}% mastery
            </span>
          </div>
        </div>
      )}
      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {srAnnouncement}
      </div>
    </div>
  );
};
