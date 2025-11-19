import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { TreeNode } from '../../types';

export const AITreeDiagram: React.FC<{
  data: TreeNode;
  searchTerm: string;
  onNodeSelect: (node: TreeNode | null) => void;
  resetViewToggle: boolean;
  masteredNodes: string[];
}> = ({ data, searchTerm, onNodeSelect, resetViewToggle, masteredNodes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<d3.HierarchyPointNode<TreeNode> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialTransformRef = useRef<d3.ZoomTransform | null>(null);
  const masteredSet = useMemo(() => new Set(masteredNodes), [masteredNodes]);

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
    // Increase radius for more spacing
    const radius = Math.min(width, height) / 2 * 0.85;

    const treeLayout = d3.tree<TreeNode>()
      .size([2 * Math.PI, radius])
      // Increase separation between siblings and branches
      .separation((a, b) => (a.parent == b.parent ? 2 : 3) / a.depth);

    if (!gRef.current) {
      const defs = svg.append("defs");
      const filter = defs.append("filter")
        .attr("id", "glow");
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "3.5")
        .attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      const masteredGlow = defs.append("filter")
        .attr("id", "mastered-glow");
      masteredGlow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");
      masteredGlow.append("feComponentTransfer").attr("in", "blur").attr("result", "boost")
        .append("feFuncA").attr("type", "linear").attr("slope", "2");
      const feMergeMastered = masteredGlow.append("feMerge");
      feMergeMastered.append("feMergeNode").attr("in", "boost");
      feMergeMastered.append("feMergeNode").attr("in", "SourceGraphic");

      gRef.current = svg.append("g");

      zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4]) // Allow zooming out more
        .on("zoom", (event) => {
          gRef.current?.attr("transform", event.transform.toString());
        });

      svg.call(zoomRef.current);
      initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8); // Start slightly zoomed out
      svg.call(zoomRef.current.transform, initialTransformRef.current);
    }

    const g = gRef.current;
    if (!g) return;

    // Re-center if needed, but usually we want to preserve user pan/zoom unless reset
    // initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2).scale(d3.zoomTransform(svg.node()!).k);

    const colorScale = d3.scaleOrdinal(d3.schemePaired);

    const update = (source: any) => {
      const duration = 400;
      const nodes = root.descendants().reverse();
      const links = root.links();

      treeLayout(root);

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
        .attr("stroke", "#475569") // Slate 600
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

      link.exit().transition().duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return d3.linkRadial()
            .angle((d: any) => d.x)
            .radius((d: any) => d.y)({ source: o, target: o } as any);
        }).remove();

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
        .on("mouseover", function (event: MouseEvent, d: any) {
          d3.select(this).select("circle").transition().duration(200).attr("r", 10).style("fill", "#22d3ee");
          d3.select(this).select("rect").transition().duration(200).style("fill-opacity", 0.9);
          d3.select(this).select("text").transition().duration(200).style("fill", "#fff");
        })
        .on("mouseout", function (event: MouseEvent, d: any) {
          const isMastered = masteredSet.has(d.data.id);
          d3.select(this).select("circle").transition().duration(200).attr("r", 6).style("fill", isMastered ? "#4ade80" : (d.children || d._children ? "#c084fc" : "#94a3b8"));
          d3.select(this).select("rect").transition().duration(200).style("fill-opacity", 0.7);
          d3.select(this).select("text").transition().duration(200).style("fill", "#f1f5f9");
        });

      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", (d: any) => {
          if (masteredSet.has(d.data.id)) return "#4ade80"; // Green for mastered
          return d.children || d._children ? "#c084fc" : "#94a3b8"; // Purple for parents, slate for leaves
        })
        .style("stroke", "#0f172a")
        .style("stroke-width", 2)
        .style("filter", (d: any) => masteredSet.has(d.data.id) ? "url(#mastered-glow)" : (d.children || d._children ? "url(#glow)" : "none"));

      // Text Background Pill
      nodeEnter.append("rect")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("height", 20)
        .style("fill", "#0f172a")
        .style("fill-opacity", 0) // Start invisible
        .style("stroke", "none");

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .text((d: any) => d.data.name)
        .style("fill-opacity", 1e-6)
        .style("font-family", "'Outfit', sans-serif")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#f1f5f9")
        .style("pointer-events", "none");

      const nodeUpdate = node.merge(nodeEnter);

      nodeUpdate.transition().duration(duration)
        .attr("transform", (d: any) => `translate(${d3.pointRadial(d.x, d.y)})`);

      nodeUpdate.select("circle")
        .transition().duration(duration)
        .attr("r", 6) // Slightly larger nodes
        .style("fill", (d: any) => {
          if (masteredSet.has(d.data.id)) return "#4ade80";
          return d.children || d._children ? "#c084fc" : "#94a3b8";
        })
        .style("filter", (d: any) => masteredSet.has(d.data.id) ? "url(#mastered-glow)" : (d.children || d._children ? "url(#glow)" : "none"));

      // Update Text and Pill Position
      nodeUpdate.each(function (d: any) {
        const group = d3.select(this);
        const text = group.select("text");
        const rect = group.select("rect");

        const angle = (d.x * 180 / Math.PI - 90);
        const isLeft = d.x >= Math.PI;

        // Calculate text width (approximate or use getBBox if possible, but tricky in transition)
        // Using a simple estimation for now: character count * 7px
        const textWidth = d.data.name.length * 7 + 16;

        text
          .transition().duration(duration)
          .style("fill-opacity", 1)
          .attr("transform", `rotate(${angle}) ${isLeft ? "rotate(180)" : ""}`)
          .attr("text-anchor", isLeft ? "end" : "start")
          .attr("x", isLeft ? -12 : 12);

        rect
          .transition().duration(duration)
          .attr("width", textWidth)
          .attr("transform", `rotate(${angle}) ${isLeft ? "rotate(180) translate(-" + (textWidth + 8) + ", -10)" : "translate(8, -10)"}`)
          .style("fill-opacity", 0.7);
      });

      const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", `translate(${d3.pointRadial(source.x, source.y)})`).remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);
      nodeExit.select("rect").style("fill-opacity", 1e-6);

      root.eachBefore((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

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
      // This handles re-renders due to mastery changes
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
  }, [data, masteredNodes]);

  // Effect for handling search term changes
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      g.selectAll(".node").attr("opacity", 1).style("filter", (d: any) => masteredSet.has(d.data.id) ? 'url(#mastered-glow)' : null);
      g.selectAll(".link").attr("stroke-opacity", 0.6);
      return;
    }

    const matchingNodes = new Set();
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
      .attr("opacity", (d: any) => matchingNodes.has(d.data.id) ? 1 : 0.2)
      .style("filter", (d: any) => {
        const isDirectMatch = root.descendants().find(n => n.data.id === d.data.id && n.data.name.toLowerCase().includes(term));
        if (isDirectMatch) return "url(#glow)";
        if (masteredSet.has(d.data.id)) return 'url(#mastered-glow)';
        return null;
      });

    g.selectAll(".link")
      .attr("stroke-opacity", (d: any) => matchingNodes.has(d.source.data.id) && matchingNodes.has(d.target.data.id) ? 0.9 : 0.1);

  }, [searchTerm, root, masteredSet]);

  // Effect for resetting view
  useEffect(() => {
    if (svgRef.current && zoomRef.current && initialTransformRef.current) {
      d3.select(svgRef.current)
        .transition().duration(500)
        .call(zoomRef.current.transform, initialTransformRef.current);
    }
  }, [resetViewToggle]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-move">
      <svg ref={svgRef} className="w-full h-full">
      </svg>
    </div>
  );
};
