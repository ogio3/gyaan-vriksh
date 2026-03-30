"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { hierarchy, tree as d3Tree } from "d3-hierarchy";
import { motion, AnimatePresence } from "motion/react";
import type { TreeNode, CardRarity } from "@/types/tree";

// Card type colors
const TYPE_COLORS: Record<string, string> = {
  career: "#2D5BFF",
  discovery: "#7C3AED",
  connection: "#059669",
  innovation: "#F4A236",
  mystery: "#DC2626",
  history: "#D97706",
};

// Rarity config
const RARITY_CONFIG: Record<string, { color: string; glow: string; stars: number }> = {
  N:   { color: "#71717a", glow: "none",                          stars: 1 },
  R:   { color: "#2D5BFF", glow: "0 0 8px rgba(45,91,255,0.3)",  stars: 2 },
  SR:  { color: "#7C3AED", glow: "0 0 12px rgba(124,58,237,0.4)", stars: 3 },
  SSR: { color: "#D4A017", glow: "0 0 20px rgba(212,160,23,0.5)", stars: 4 },
};

const CARD_W = 180;
const CARD_H = 252;
const CARD_RX = 12;
const GRID_SIZE = 24;

type VisualState = "focused" | "active" | "peripheral";

interface TreeCanvasProps {
  data: TreeNode;
  focusedId?: string | null;
  expandingId?: string | null;
  onNodeClick?: (node: TreeNode) => void;
  onHiddenSproutClick?: (passage: string) => void;
  secretMode?: boolean;
}

const GOLD = "#D4A017";
const SECRET_TYPE_COLORS: Record<string, string> = {
  career: "#D4A017", discovery: "#B8860B", connection: "#DAA520",
  innovation: "#F4A236", mystery: "#CD853F", history: "#D4A017",
};

const SPROUT_PASSAGES = [
  "Why do we dream?", "How do languages die?",
  "What makes music emotional?", "Can plants communicate?",
  "Why is the sky dark at night?",
];

export default function TreeCanvas({
  data, focusedId, expandingId, onNodeClick, onHiddenSproutClick, secretMode,
}: TreeCanvasProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const activeIds = useMemo(() => {
    if (!focusedId) return new Set<string>();
    const ids = new Set<string>();
    function walk(node: TreeNode, parent?: TreeNode) {
      if (node.id === focusedId) {
        if (parent) ids.add(parent.id);
        for (const c of node.children ?? []) ids.add(c.id);
        if (parent) for (const s of parent.children ?? []) ids.add(s.id);
      }
      for (const c of node.children ?? []) walk(c, node);
    }
    walk(data);
    return ids;
  }, [data, focusedId]);

  function getVisualState(nodeId: string): VisualState {
    if (!focusedId) return "active";
    if (nodeId === focusedId) return "focused";
    if (activeIds.has(nodeId)) return "active";
    return "peripheral";
  }

  // Bottom-to-Top layout
  const { nodes, links, svgWidth, svgHeight } = useMemo(() => {
    const root = hierarchy(data);
    const treeLayout = d3Tree<TreeNode>().nodeSize([CARD_W + 24, CARD_H + 50]);
    treeLayout(root);

    const allNodes = root.descendants();
    const allLinks = root.links();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    }

    const pad = 100;
    const w = maxX - minX + CARD_W + pad * 2;
    const h = maxY - minY + CARD_H + pad * 2;
    const offsetX = -minX + CARD_W / 2 + pad;
    const offsetY = -minY + CARD_H / 2 + pad;
    const maxTotalY = maxY + offsetY + CARD_H / 2 + pad;

    return {
      nodes: allNodes.map((n) => ({
        id: n.data.id,
        label: n.data.label,
        branchType: n.data.branchType,
        summary: n.data.summary,
        rarity: n.data.rarity ?? ("N" as CardRarity),
        x: n.x! + offsetX,
        y: maxTotalY - (n.y! + offsetY),
        depth: n.depth,
        hasChildren: !!(n.data.children && n.data.children.length > 0),
        nodeData: n.data,
      })),
      links: allLinks.map((l) => ({
        sourceX: l.source.x! + offsetX,
        sourceY: maxTotalY - (l.source.y! + offsetY),
        targetX: l.target.x! + offsetX,
        targetY: maxTotalY - (l.target.y! + offsetY),
        id: `${l.source.data.id}-${l.target.data.id}`,
      })),
      svgWidth: Math.max(w, 500),
      svgHeight: Math.max(h, 400),
    };
  }, [data]);

  // Auto-scroll to newest node
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const topNode = nodes.reduce((min, n) => (n.y < min.y ? n : min), nodes[0]);
    containerRef.current.scrollTo({
      top: Math.max(0, topNode.y - 200),
      left: Math.max(0, topNode.x - containerRef.current.clientWidth / 2),
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }, [nodes, prefersReducedMotion]);

  const spring = prefersReducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 160, damping: 20 };
  const pathAnim = prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" as const };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-auto"
      role="tree"
      aria-label="Knowledge tree"
      style={{
        backgroundImage: secretMode
          ? `radial-gradient(circle, rgba(212,160,23,0.1) 1px, transparent 1px)`
          : `radial-gradient(circle, rgba(120,120,120,0.1) 1px, transparent 1px)`,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="select-none">
        {/* Links */}
        <AnimatePresence>
          {links.map((link) => {
            const midY = (link.sourceY + link.targetY) / 2;
            const d = `M ${link.sourceX} ${link.sourceY} C ${link.sourceX} ${midY}, ${link.targetX} ${midY}, ${link.targetX} ${link.targetY}`;
            return (
              <motion.path key={link.id} d={d} fill="none"
                stroke={secretMode ? "rgba(212,160,23,0.4)" : "rgba(120,120,120,0.2)"}
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={pathAnim}
              />
            );
          })}
        </AnimatePresence>

        {/* Cards */}
        <AnimatePresence>
          {nodes.map((node, i) => {
            const state = getVisualState(node.id);
            const isExpanding = node.id === expandingId;
            const rarity = RARITY_CONFIG[node.rarity] ?? RARITY_CONFIG.N;
            const typeColor = secretMode
              ? (SECRET_TYPE_COLORS[node.branchType ?? ""] ?? GOLD)
              : (TYPE_COLORS[node.branchType ?? ""] ?? "#71717a");
            const borderColor = isExpanding ? "#F4A236" : (node.rarity === "SSR" || node.rarity === "SR") ? rarity.color : typeColor;
            const opacity = state === "focused" ? 1 : state === "active" ? 0.8 : 0.35;
            const scale = state === "peripheral" ? 0.88 : 1;

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity, scale, x: node.x - CARD_W / 2, y: node.y - CARD_H / 2 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ ...spring, delay: prefersReducedMotion ? 0 : Math.min(i * 0.1, 0.5) }}
                role="treeitem"
                tabIndex={0}
                onClick={() => onNodeClick?.(node.nodeData)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNodeClick?.(node.nodeData); } }}
                style={{ cursor: "pointer", filter: rarity.glow !== "none" ? `drop-shadow(${rarity.glow})` : undefined }}
              >
                {/* Card background */}
                <rect width={CARD_W} height={CARD_H} rx={CARD_RX}
                  fill="rgba(24,24,27,0.95)" stroke={borderColor}
                  strokeWidth={node.rarity === "SSR" ? 2.5 : node.rarity === "SR" ? 2 : 1.5}
                />

                {/* Holographic shimmer for SSR */}
                {node.rarity === "SSR" && (
                  <rect width={CARD_W} height={CARD_H} rx={CARD_RX}
                    fill="url(#holo-gradient)" opacity={0.15}
                  />
                )}

                {/* Art area (top section with gradient) */}
                <rect x={8} y={8} width={CARD_W - 16} height={90} rx={8}
                  fill={typeColor} opacity={0.15}
                />

                {/* Type icon area */}
                <foreignObject x={12} y={14} width={CARD_W - 24} height={78}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: typeColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {(node.branchType ?? "").replace("_", " ")}
                    </span>
                  </div>
                </foreignObject>

                {/* Rarity stars */}
                <foreignObject x={CARD_W - 60} y={10} width={52} height={20}>
                  <div style={{ textAlign: "right", fontSize: 10, color: rarity.color }}>
                    {"★".repeat(rarity.stars)}
                  </div>
                </foreignObject>

                {/* Card content */}
                <foreignObject x={12} y={104} width={CARD_W - 24} height={CARD_H - 120}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
                    <span className="text-zinc-100" style={{
                      fontSize: 14, fontWeight: 700, lineHeight: 1.25,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                    }}>
                      {node.label}
                    </span>
                    {node.summary && (
                      <span className="text-zinc-400" style={{
                        fontSize: 11, lineHeight: 1.4,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
                      }}>
                        {node.summary}
                      </span>
                    )}
                  </div>
                </foreignObject>

                {/* Click hint */}
                {!node.hasChildren && state !== "peripheral" && (
                  <text x={CARD_W / 2} y={CARD_H - 8} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)">
                    tap to explore
                  </text>
                )}

                {/* Expanding: breathing meditation effect (4-7-8 rhythm) */}
                {isExpanding && (
                  <>
                    <rect width={CARD_W + 8} height={CARD_H + 8} x={-4} y={-4} rx={CARD_RX + 2}
                      fill="none" stroke={borderColor} strokeWidth={1.5}
                    >
                      <animate attributeName="opacity" values="0.15;0.5;0.5;0.15" dur="4s" repeatCount="indefinite" />
                      <animate attributeName="stroke-width" values="1;2.5;2.5;1" dur="4s" repeatCount="indefinite" />
                    </rect>
                    <rect width={CARD_W + 16} height={CARD_H + 16} x={-8} y={-8} rx={CARD_RX + 4}
                      fill="none" stroke={borderColor} strokeWidth={0.5}
                    >
                      <animate attributeName="opacity" values="0;0.2;0.2;0" dur="4s" repeatCount="indefinite" />
                    </rect>
                  </>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Holographic gradient definition */}
        <defs>
          <linearGradient id="holo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="25%" stopColor="#ffff00" />
            <stop offset="50%" stopColor="#00ff00" />
            <stop offset="75%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#ff00ff" />
          </linearGradient>
        </defs>

        {/* Hidden Sprouts */}
        {onHiddenSproutClick && SPROUT_PASSAGES.map((passage, i) => {
          const sx = ((i * 317 + 89) % (svgWidth - 100)) + 50;
          const sy = ((i * 251 + 137) % (svgHeight - 100)) + 50;
          return (
            <circle key={`sprout-${i}`} cx={sx} cy={sy} r={2.5}
              fill="#059669" opacity={0.15} style={{ cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); onHiddenSproutClick(passage); }}
            >
              <animate attributeName="opacity" values="0.1;0.25;0.1" dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
