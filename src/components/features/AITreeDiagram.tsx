import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { TreeNode } from '../../types';

export const AITreeDiagram: React.FC<{
  data: TreeNode;
  searchTerm: string;
  onNodeSelect: (node: TreeNode | null) => void;
  resetViewToggle: boolean;
  masteredNodes: string[];
  isDark: boolean;
}> = ({ data, searchTerm, onNodeSelect, resetViewToggle, masteredNodes, isDark }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<d3.HierarchyPointNode<TreeNode> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialTransformRef = useRef<d3.ZoomTransform | null>(null);
  const masteredSet = useMemo(() => new Set(masteredNodes), [masteredNodes]);

  const colors = useMemo(() => ({
    link: 'rgba(255,255,255,0.15)',
    nodeFillParent: 'rgba(255,255,255,0.10)',
    nodeFillLeaf: 'rgba(255,255,255,0.06)',
    nodeFillMastered: 'rgba(242,232,220,0.40)',
    nodeStrokeParent: 'rgba(255,255,255,0.25)',
    nodeStrokeLeaf: 'rgba(255,255,255,0.12)',
    nodeStrokeMastered: 'rgba(242,232,220,0.50)',
    labelFill: 'rgba(255,255,255,0.60)',
    labelFillMastered: 'rgba(242,232,220,0.70)',
    labelStroke: 'rgba(10,7,7,0.90)',
    hoverStroke: 'rgba(242,232,220,0.60)',
  }), []);

  const root = useMemo(() => {
    const hierarchy = d3.hierarchy<TreeNode>(data);
    hierarchy.descendants().forEach((d: any) => {
      if (d.depth >= 2) {
        d._children = d.children;
        d.children = null;
      }
    });
    return hierarchy;
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 * 0.85;

    const treeLayout = d3.tree<TreeNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent == b.parent ? 2 : 3) / a.depth);

    if (!gRef.current) {
      const defs = svg.append("defs");

      const glowFilter = defs.append("filter").attr("id", "sage-glow");
      glowFilter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
      glowFilter.append("feFlood").attr("flood-color", "#F2E8DC").attr("flood-opacity", "0.4").attr("result", "color");
      glowFilter.append("feComposite").attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "colorBlur");
      const feMerge = glowFilter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "colorBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      const masteredGlow = defs.append("filter").attr("id", "mastered-glow");
      masteredGlow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
      masteredGlow.append("feFlood").attr("flood-color", "#F2E8DC").attr("flood-opacity", "0.6").attr("result", "color");
      masteredGlow.append("feComposite").attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "colorBlur");
      const feMergeMastered = masteredGlow.append("feMerge");
      feMergeMastered.append("feMergeNode").attr("in", "colorBlur");
      feMergeMastered.append("feMergeNode").attr("in", "SourceGraphic");

      const searchGlow = defs.append("filter").attr("id", "search-glow");
      searchGlow.append("feGaussianBlur").attr("stdDeviation", "5").attr("result", "blur");
      searchGlow.append("feFlood").attr("flood-color", "#F2E8DC").attr("flood-opacity", "0.5").attr("result", "color");
      searchGlow.append("feComposite").attr("in", "color").attr("in2", "blur").attr("operator", "in").attr("result", "colorBlur");
      const feMergeSearch = searchGlow.append("feMerge");
      feMergeSearch.append("feMergeNode").attr("in", "colorBlur");
      feMergeSearch.append("feMergeNode").attr("in", "SourceGraphic");

      gRef.current = svg.append("g");

      zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          gRef.current?.attr("transform", event.transform.toString());
        });

      svg.call(zoomRef.current);
      initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
      svg.call(zoomRef.current.transform, initialTransformRef.current);
    }

    const g = gRef.current;
    if (!g) return;

    const update = (source: any) => {
      const duration = 400;
      const nodes = root.descendants().reverse();
      const links = root.links();

      treeLayout(root);

      // Links
      const link = g.selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>(".link")
        .data(links, (d: any) => d.target.data.id);

      const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("d", () => {
          const o = { x: source.x0 || source.x, y: source.y0 || source.y };
          return d3.linkRadial()
            .angle((d: any) => d.x)
            .radius((d: any) => d.y)({ source: o, target: o } as any);
        });

      link.merge(linkEnter).transition().duration(duration)
        .attr("d", d3.linkRadial<any, d3.HierarchyPointNode<TreeNode>>()
          .angle(d => d.x)
          .radius(d => d.y) as any
        )
        .attr("fill", "none")
        .attr("stroke", colors.link)
        .attr("stroke-opacity", 0.35)
        .attr("stroke-width", 1.5);

      link.exit().transition().duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return d3.linkRadial()
            .angle((d: any) => d.x)
            .radius((d: any) => d.y)({ source: o, target: o } as any);
        }).remove();

      // Nodes
      const node = g.selectAll<SVGGElement, d3.HierarchyPointNode<TreeNode>>(".node")
        .data(nodes, (d: any) => d.data.id);

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", `translate(${d3.pointRadial(source.x0 || source.x, source.y0 || source.y)})`)
        .on("click", (event: MouseEvent, d: any) => {
          if (event.ctrlKey || event.metaKey) {
            toggleChildren(d);
            update(d);
          }
          onNodeSelect(d.data);
        })
        .on("mouseover", function () {
          d3.select(this).select("circle")
            .transition().duration(200)
            .attr("r", 9)
            .style("stroke-width", 2.5)
            .style("stroke", colors.hoverStroke);
        })
        .on("mouseout", function (_event: MouseEvent, d: any) {
          const isMastered = masteredSet.has(d.data.id);
          d3.select(this).select("circle")
            .transition().duration(200)
            .attr("r", 6)
            .style("stroke-width", 1.5)
            .style("stroke", isMastered ? colors.nodeStrokeMastered : (d.children || d._children ? colors.nodeStrokeParent : colors.nodeStrokeLeaf));
        });

      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", (d: any) => {
          if (masteredSet.has(d.data.id)) return colors.nodeFillMastered;
          return d.children || d._children ? colors.nodeFillParent : colors.nodeFillLeaf;
        })
        .style("stroke", (d: any) => {
          if (masteredSet.has(d.data.id)) return colors.nodeStrokeMastered;
          return d.children || d._children ? colors.nodeStrokeParent : colors.nodeStrokeLeaf;
        })
        .style("stroke-width", 1.5)
        .style("filter", (d: any) => masteredSet.has(d.data.id) ? "url(#mastered-glow)" : "none");

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .text((d: any) => d.data.name)
        .style("fill-opacity", 1e-6)
        .style("font-family", "'Inter', sans-serif")
        .style("font-size", "12px")
        .style("font-weight", "300")
        .style("fill", (d: any) => masteredSet.has(d.data.id) ? colors.labelFillMastered : colors.labelFill)
        .style("pointer-events", "none")
        .style("paint-order", "stroke")
        .style("stroke", colors.labelStroke)
        .style("stroke-width", "3px")
        .style("stroke-linecap", "butt")
        .style("stroke-linejoin", "miter");

      const nodeUpdate = node.merge(nodeEnter);

      nodeUpdate.transition().duration(duration)
        .attr("transform", (d: any) => `translate(${d3.pointRadial(d.x, d.y)})`);

      nodeUpdate.select("circle")
        .transition().duration(duration)
        .attr("r", 6)
        .style("fill", (d: any) => {
          if (masteredSet.has(d.data.id)) return colors.nodeFillMastered;
          return d.children || d._children ? colors.nodeFillParent : colors.nodeFillLeaf;
        })
        .style("stroke", (d: any) => {
          if (masteredSet.has(d.data.id)) return colors.nodeStrokeMastered;
          return d.children || d._children ? colors.nodeStrokeParent : colors.nodeStrokeLeaf;
        })
        .style("filter", (d: any) => masteredSet.has(d.data.id) ? "url(#mastered-glow)" : "none");

      nodeUpdate.each(function (d: any) {
        const group = d3.select(this);
        const text = group.select("text");

        const angle = (d.x * 180 / Math.PI - 90);
        const isLeft = d.x >= Math.PI;

        text
          .transition().duration(duration)
          .style("fill-opacity", 1)
          .style("fill", masteredSet.has(d.data.id) ? colors.labelFillMastered : colors.labelFill)
          .style("stroke", colors.labelStroke)
          .attr("transform", `rotate(${angle}) ${isLeft ? "rotate(180)" : ""}`)
          .attr("text-anchor", isLeft ? "end" : "start")
          .attr("x", isLeft ? -12 : 12);
      });

      const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", `translate(${d3.pointRadial(source.x, source.y)})`).remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);

      root.eachBefore((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    const toggleChildren = (d: any) => {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    };

    if (!rootNodeRef.current) {
      (root as any).x0 = height / 2;
      (root as any).y0 = 0;
      update(root);
      rootNodeRef.current = root as any;
    } else {
      update(root);
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || !entries.length || !gRef.current || !zoomRef.current) return;
      const { width, height } = entries[0].contentRect;
      initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2);
      svg.transition().duration(500).call(zoomRef.current.transform, initialTransformRef.current);
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, masteredNodes, colors]);

  // Search effect
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      g.selectAll(".node").attr("opacity", 1).style("filter", (d: any) =>
        masteredSet.has(d.data.id) ? 'url(#mastered-glow)' : 'none'
      );
      g.selectAll(".link").attr("stroke-opacity", 0.35);
      return;
    }

    const matchingNodes = new Set<string>();
    root.each((d: any) => {
      if (d.data.name.toLowerCase().includes(term)) {
        let current = d;
        while (current) {
          matchingNodes.add(current.data.id);
          current = current.parent;
        }
      }
    });

    g.selectAll(".node")
      .attr("opacity", (d: any) => matchingNodes.has(d.data.id) ? 1 : 0.15)
      .style("filter", (d: any) => {
        const isDirectMatch = root.descendants().find(n => n.data.id === d.data.id && n.data.name.toLowerCase().includes(term));
        if (isDirectMatch) return "url(#search-glow)";
        if (masteredSet.has(d.data.id)) return 'url(#mastered-glow)';
        return 'none';
      });

    g.selectAll(".link")
      .attr("stroke-opacity", (d: any) => matchingNodes.has(d.source.data.id) && matchingNodes.has(d.target.data.id) ? 0.7 : 0.05);
  }, [searchTerm, root, masteredSet]);

  // Reset view
  useEffect(() => {
    if (svgRef.current && zoomRef.current && initialTransformRef.current) {
      d3.select(svgRef.current)
        .transition().duration(500)
        .call(zoomRef.current.transform, initialTransformRef.current);
    }
  }, [resetViewToggle]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
