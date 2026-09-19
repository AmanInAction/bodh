"use client";

import { useEffect, useRef, useState } from "react";
import type { Mindmap, MindmapNode, MindmapEdge } from "@/types/content";

type Point = { x: number; y: number };

// ── Layout engine ─────────────────────────────────────────────────────────────

function layoutNodes(
  nodes: MindmapNode[],
  edges: MindmapEdge[],
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const root = nodes.find((n) => n.level === 0);
  if (!root) return positions;

  const cx = 310,
    cy = 220;
  positions.set(root.id, { x: cx, y: cy });

  const children = (pid: string) =>
    edges.filter((e) => e.from === pid).map((e) => e.to);

  const level1 = children(root.id);
  const step = (2 * Math.PI) / Math.max(level1.length, 1);

  level1.forEach((id, i) => {
    const angle = i * step - Math.PI / 2;
    const radius = Math.max(130, 20 * level1.length);
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * (radius * 0.78);
    positions.set(id, { x: px, y: py });

    const level2 = children(id);
    if (level2.length === 0) return;
    const subRadius = 75;
    const subStep = step / Math.max(level2.length + 1, 2);
    level2.forEach((lid, j) => {
      const la = angle + (j - (level2.length - 1) / 2) * subStep * 0.9;
      positions.set(lid, {
        x: px + Math.cos(la) * subRadius,
        y: py + Math.sin(la) * (subRadius * 0.78),
      });
    });
  });

  return positions;
}

// Palette — vibrant but cohesive
const LEVEL_COLORS = [
  ["#0d9488", "#134e4a"], // root: teal
  ["#7c3aed", "#4c1d95"], // branch: violet
  ["#2563eb", "#1e3a8a"], // leaf: blue
];
const ACCENT_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
];
const NODE_RADIUS = [38, 26, 18];
const NODE_FONT_SIZE = [14, 11, 9.5];

function wrapLabel(label: string, maxChars = 10): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Curved edge path ─────────────────────────────────────────────────────────

function curvedPath(from: Point, to: Point): string {
  // Slight cubic bezier for organic feel
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx1 = from.x + dx * 0.3 - dy * 0.15;
  const cy1 = from.y + dy * 0.3 + dx * 0.15;
  const cx2 = from.x + dx * 0.7 + dy * 0.15;
  const cy2 = from.y + dy * 0.7 - dx * 0.15;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MindMap({ mindmap }: { mindmap: Mindmap }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const positions = layoutNodes(mindmap.nodes, mindmap.edges);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Drag-to-pan
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const down = (e: MouseEvent) => {
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      svg.style.cursor = "grabbing";
    };
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    };
    const up = () => {
      dragging.current = false;
      svg.style.cursor = "grab";
    };

    svg.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      svg.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // Scroll-to-zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2.5, Math.max(0.4, z - e.deltaY * 0.001)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="mm-container" ref={containerRef}>
      {/* Header */}
      <div className="mm-header">
        <span className="eyebrow">{mindmap.topicSlug} · mind map</span>
        <button className="mm-reset-btn" onClick={resetView} title="Reset view">
          ⊕
        </button>
      </div>

      {/* SVG canvas */}
      <div className="mm-canvas-wrap" onWheel={onWheel}>
        <svg
          ref={svgRef}
          viewBox="0 0 620 440"
          className="mm-svg"
          role="img"
          aria-label={`Mind map for ${mindmap.topicSlug}`}
          style={{ cursor: "grab" }}
        >
          <defs>
            {/* Glow filter for root */}
            <filter id="mm-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Drop shadow for nodes */}
            <filter id="mm-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodOpacity="0.25"
              />
            </filter>
            {/* Gradient defs for each level */}
            {LEVEL_COLORS.map(([start, end], li) => (
              <radialGradient
                key={li}
                id={`mm-grad-${li}`}
                cx="40%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor={start} />
                <stop offset="100%" stopColor={end} />
              </radialGradient>
            ))}
            {/* Accent gradients for branches */}
            {ACCENT_COLORS.map((c, ci) => (
              <radialGradient
                key={`acc-${ci}`}
                id={`mm-acc-${ci}`}
                cx="40%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                <stop offset="100%" stopColor={c} stopOpacity="0.7" />
              </radialGradient>
            ))}
          </defs>

          {/* Transform group for pan+zoom */}
          <g
            transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
            style={{ transformOrigin: "310px 220px" }}
          >
            {/* Edges */}
            {mindmap.edges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              const fromNode = mindmap.nodes.find((n) => n.id === edge.from);
              const isHighlighted =
                hovered === edge.from || hovered === edge.to;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={curvedPath(from, to)}
                  className="mm-edge"
                  strokeWidth={fromNode?.level === 0 ? 2.5 : 1.5}
                  stroke={isHighlighted ? "#a78bfa" : "rgba(255,255,255,0.18)"}
                  opacity={isHighlighted ? 1 : 0.5}
                  fill="none"
                  strokeLinecap="round"
                  style={{ transition: "stroke 0.2s, opacity 0.2s" }}
                />
              );
            })}

            {/* Nodes */}
            {mindmap.nodes.map((node, idx) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const r =
                (NODE_RADIUS[node.level] ?? 14) *
                (hovered === node.id ? 1.15 : 1);
              const fontSize = NODE_FONT_SIZE[node.level] ?? 9;
              const lines = wrapLabel(node.label, node.level === 0 ? 12 : 9);
              const lineH = fontSize * 1.25;
              const totalH = lines.length * lineH;

              // Color logic
              let fillUrl: string;
              if (node.level === 0) {
                fillUrl = "url(#mm-grad-0)";
              } else if (node.level === 1) {
                fillUrl = `url(#mm-acc-${idx % ACCENT_COLORS.length})`;
              } else {
                fillUrl = "url(#mm-grad-2)";
              }

              return (
                <g
                  key={node.id}
                  className="mm-node-g"
                  style={{ animationDelay: `${idx * 60}ms` }}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Halo ring when hovered */}
                  {hovered === node.id && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={r + 7}
                      fill="none"
                      stroke="rgba(167,139,250,0.4)"
                      strokeWidth="2"
                      className="mm-halo"
                    />
                  )}

                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={fillUrl}
                    filter={
                      node.level === 0 ? "url(#mm-glow)" : "url(#mm-shadow)"
                    }
                    style={{
                      transition: "r 0.2s ease",
                    }}
                  />

                  {/* Label lines */}
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={pos.x}
                      y={pos.y - totalH / 2 + li * lineH + lineH / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fill="white"
                      fontWeight={node.level === 0 ? "700" : "600"}
                      fontFamily="'Inter', Arial, sans-serif"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tooltip for hovered node */}
      {hovered &&
        (() => {
          const node = mindmap.nodes.find((n) => n.id === hovered);
          return node ? (
            <div className="mm-tooltip">
              <strong>{node.label}</strong>
              <span className="mm-tooltip-level">
                {node.level === 0
                  ? "Root"
                  : node.level === 1
                    ? "Branch"
                    : "Leaf"}
              </span>
            </div>
          ) : null;
        })()}

      {/* Zoom hint */}
      <p className="mm-hint">Scroll to zoom · Drag to pan</p>
    </div>
  );
}
