import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { curriculum } from '../../data/curriculum';

interface PreviewNode extends d3.SimulationNodeDatum {
  id: string;
  tier: number;
  radius: number;
  tierX: number;
}

interface PreviewLink extends d3.SimulationLinkDatum<PreviewNode> {
  type: 'prerequisite' | 'connection';
}

/**
 * A simplified, non-interactive D3 force graph for the landing page.
 * Shows the concept structure at a glance — no zoom, pan, or click handlers.
 */
export const GraphPreview: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Build graph data
    const concepts = Object.values(curriculum);
    const tierPositions: Record<number, number> = { 1: 0.12, 2: 0.32, 3: 0.52, 4: 0.72, 5: 0.92 };

    const nodes: PreviewNode[] = concepts.map(c => {
      const connectionCount = c.prerequisites.length + c.connections.length;
      return {
        id: c.id,
        tier: c.tier,
        radius: Math.max(3, Math.min(7, 3 + connectionCount * 0.8)),
        tierX: tierPositions[c.tier] || 0.5,
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links: PreviewLink[] = [];

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

    const sim = d3.forceSimulation<PreviewNode>(nodes)
      .force('link', d3.forceLink<PreviewNode, PreviewLink>(links).id(d => d.id).distance(40).strength(0.2))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('tierX', d3.forceX<PreviewNode>(d => d.tierX * width).strength(0.15))
      .force('tierY', d3.forceY(height / 2).strength(0.05))
      .force('collision', d3.forceCollide<PreviewNode>(d => d.radius + 4))
      .alphaDecay(0.03);

    // Fade-in opacity
    let opacity = 0;

    function draw() {
      if (!ctx) return;
      opacity = Math.min(1, opacity + 0.02);

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      // Draw links
      for (const link of links) {
        const source = link.source as PreviewNode;
        const target = link.target as PreviewNode;
        if (!source.x || !source.y || !target.x || !target.y) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (link.type === 'prerequisite') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 3]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      const tierOpacities: Record<number, number> = { 1: 0.25, 2: 0.30, 3: 0.35, 4: 0.40, 5: 0.45 };

      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const nodeOpacity = tierOpacities[node.tier] || 0.3;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 232, 220, ${nodeOpacity})`;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    sim.on('tick', () => {
      draw();
    });

    // Keep animating for fade-in even after sim stabilizes
    function animate() {
      if (opacity < 1) {
        draw();
      }
      animationRef.current = requestAnimationFrame(animate);
    }
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      sim.stop();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
};
