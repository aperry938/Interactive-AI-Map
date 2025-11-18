import React, { useRef, useEffect, useMemo } from 'react';
import type { TreeNode } from '../types';

declare const d3: any;

const AITreeDiagram: React.FC<{
  data: TreeNode;
  searchTerm: string;
  onNodeSelect: (node: TreeNode | null) => void;
  resetViewToggle: boolean;
  masteredNodes: string[];
}> = ({ data, searchTerm, onNodeSelect, resetViewToggle, masteredNodes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<any>(null);
  const gRef = useRef<any>(null);
  const zoomRef = useRef<any>(null);
  const initialTransformRef = useRef<any>(null);
  const masteredSet = useMemo(() => new Set(masteredNodes), [masteredNodes]);

  const root = useMemo(() => {
    const hierarchy = d3.hierarchy(data);
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
    const radius = Math.min(width, height) / 2 * 0.8;

    const treeLayout = d3.tree().size([2 * Math.PI, radius]).separation((a: any, b: any) => (a.parent == b.parent ? 1 : 2) / a.depth);

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
      
      zoomRef.current = d3.zoom()
          .scaleExtent([0.2, 5])
          .on("zoom", (event: any) => {
              gRef.current.attr("transform", event.transform);
          });
      
      svg.call(zoomRef.current);
      initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2);
      svg.call(zoomRef.current.transform, initialTransformRef.current);
    }
    
    const g = gRef.current;

    initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2).scale(d3.zoomTransform(svg.node()).k);
    
    const colorScale = d3.scaleOrdinal(d3.schemePaired);

    const update = (source: any) => {
      const duration = 350;
      const nodes = root.descendants().reverse();
      const links = root.links();
      
      treeLayout(root);

      const link = g.selectAll(".link")
        .data(links, (d: any) => d.target.data.id);

      const linkEnter = link.enter().append("path")
        .attr("class", "link")
        .attr("d", () => {
          const o = { x: source.x0, y: source.y0 };
          return d3.linkRadial()({ source: o, target: o });
        });

      link.merge(linkEnter).transition().duration(duration)
        .attr("d", d3.linkRadial().angle((d: any) => d.x).radius((d: any) => d.y))
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);
      
      link.exit().transition().duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return d3.linkRadial()({ source: o, target: o });
        }).remove();

      const node = g.selectAll(".node")
        .data(nodes, (d: any) => d.data.id);
      
      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", `translate(${d3.pointRadial(source.x0, source.y0)})`)
        .on("click", (event: MouseEvent, d: any) => {
          if (event.ctrlKey || event.metaKey) {
             toggleChildren(d);
             update(d);
          }
          onNodeSelect(d.data);
          event.stopPropagation();
        });

      nodeEnter.append("circle")
        .attr("r", 0)
        .attr("stroke-width", 2.5);
      
      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .text((d: any) => d.data.name)
        .attr("paint-order", "stroke")
        .attr("stroke", "#111827")
        .attr("stroke-width", 3.5)
        .attr("fill", "#e5e7eb");

      const nodeUpdate = node.merge(nodeEnter);

      nodeUpdate.transition().duration(duration)
        .attr("transform", (d: any) => `translate(${d3.pointRadial(d.x, d.y)})`);
        
      nodeUpdate.select("circle")
        .transition().duration(duration)
        .attr("r", (d:any) => d.data.isApplication ? 9 : (d.depth === 0 ? 10 : 7))
        .attr("fill", (d: any) => d._children ? colorScale(d.parent ? d.parent.data.id : d.data.id) : (d.data.isApplication ? "#facc15" : "#4b5563"))
        .attr("stroke", (d: any) => masteredSet.has(d.data.id) ? '#00f2ff' : (d.data.isApplication ? "#f59e0b" : "#9ca3af"))
        .style("filter", (d: any) => masteredSet.has(d.data.id) ? 'url(#mastered-glow)' : null);


      nodeUpdate.select("text")
        .transition().duration(duration)
        .attr("x", (d: any) => (d.x < Math.PI) === !d.children ? 14 : -14)
        .attr("text-anchor", (d: any) => (d.x < Math.PI) === !d.children ? "start" : "end")
        .attr("transform", (d: any) => d.x >= Math.PI ? "rotate(180)" : null);

      const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", `translate(${d3.pointRadial(source.x, source.y)})`).remove();
      
      nodeExit.select("circle").attr("r", 0);
      nodeExit.select("text").attr("fill-opacity", 0);

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
        root.x0 = height / 2;
        root.y0 = 0;
        update(root);
        rootNodeRef.current = root;
    } else {
        // This handles re-renders due to mastery changes
        update(root);
    }
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || !entries.length || !gRef.current) return;
      const { width, height } = entries[0].contentRect;
      initialTransformRef.current = d3.zoomIdentity.translate(width / 2, height / 2);
      svg.transition().duration(500).call(zoomRef.current.transform, initialTransformRef.current);
    });
    if(containerRef.current) {
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
        g.selectAll(".node").attr("opacity", 1).style("filter", (d:any) => masteredSet.has(d.data.id) ? 'url(#mastered-glow)' : null);
        g.selectAll(".link").attr("stroke-opacity", 0.6);
        return;
    }

    const matchingNodes = new Set();
    root.each((d: any) => {
      if (d.data.name.toLowerCase().includes(term)) {
        let current = d;
        while(current) {
          matchingNodes.add(current.data.id);
          current = current.parent;
        }
      }
    });

    g.selectAll(".node")
        .attr("opacity", (d:any) => matchingNodes.has(d.data.id) ? 1 : 0.2)
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

export default AITreeDiagram;