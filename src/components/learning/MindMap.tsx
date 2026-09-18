"use client";

import { useEffect, useRef } from "react";
import type { Mindmap, MindmapNode, MindmapEdge } from "@/types/content";

// ── Layout: position nodes in a radial tree ───────────────────────────────────

type Point = { x: number; y: number };

function layoutNodes(nodes: MindmapNode[], edges: MindmapEdge[]): Map<string, Point> {
  const positions = new Map<string, Point>();
  const root = nodes.find((n) => n.level === 0);
  if (!root) return positions;

  const cx = 300, cy = 220; // SVG center
  positions.set(root.id, { x: cx, y: cy });

  const children = (parentId: string) =>
    edges.filter((e) => e.from === parentId).map((e) => e.to);

  const level1 = children(root.id);
  const angleStep = (2 * Math.PI) / Math.max(level1.length, 1);
  level1.forEach((id, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const px = cx + Math.cos(angle) * 130;
    const py = cy + Math.sin(angle) * 100;
    positions.set(id, { x: px, y: py });

    const level2 = children(id);
    const subAngle = angleStep / Math.max(level2.length + 1, 2);
    level2.forEach((lid, j) => {
      const la = angle + (j - (level2.length - 1) / 2) * subAngle * 0.7;
      positions.set(lid, {
        x: px + Math.cos(la) * 85,
        y: py + Math.sin(la) * 70,
      });
    });
  });

  return positions;
}

const LEVEL_COLORS = ["#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#fb923c"];
const LEVEL_RADIUS = [28, 22, 16];
const LEVEL_FONT = ["13px", "11.5px", "10.5px"];

// ── Component ─────────────────────────────────────────────────────────────────

export function MindMap({ mindmap }: { mindmap: Mindmap }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const positions = layoutNodes(mindmap.nodes, mindmap.edges);

  useEffect(() => {
    // Subtle pan on drag (optional, progressive enhancement)
    const svg = svgRef.current;
    if (!svg) return;
    let dragging = false, ox = 0, oy = 0, vx = 0, vy = 0;
    const down = (e: MouseEvent) => { dragging = true; ox = e.clientX - vx; oy = e.clientY - vy; };
    const move = (e: MouseEvent) => {
      if (!dragging) return;
      vx = e.clientX - ox; vy = e.clientY - oy;
      svg.style.transform = `translate(${vx}px,${vy}px)`;
    };
    const up = () => { dragging = false; };
    svg.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      svg.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div className="mindmap-container">
      <svg ref={svgRef} viewBox="0 0 600 440" className="mindmap-svg" role="img" aria-label={`Mind map for ${mindmap.topicSlug}`}>
        <defs>
          <filter id="mm-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Edges */}
        {mindmap.edges.map((edge) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              className="mindmap-edge"
            />
          );
        })}
        {/* Nodes */}
        {mindmap.nodes.map((node, idx) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const r = LEVEL_RADIUS[node.level] ?? 14;
          const color = LEVEL_COLORS[idx % LEVEL_COLORS.length];
          const fontSize = LEVEL_FONT[node.level] ?? "10px";
          const words = node.label.split(" ");
          return (
            <g key={node.id} className="mindmap-node" style={{ animationDelay: `${idx * 60}ms` }}>
              <circle
                cx={pos.x} cy={pos.y} r={r}
                fill={color}
                opacity={node.level === 0 ? 1 : 0.85}
                filter={node.level === 0 ? "url(#mm-glow)" : undefined}
                className="mindmap-circle"
              />
              {words.map((word, wi) => (
                <text
                  key={wi}
                  x={pos.x}
                  y={pos.y + (wi - (words.length - 1) / 2) * 13 + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fill="white"
                  fontWeight={node.level === 0 ? "700" : "500"}
                >
                  {word}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
