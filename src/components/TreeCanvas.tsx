"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { hierarchy, tree as d3Tree } from "d3-hierarchy";
import { motion, AnimatePresence } from "motion/react";
import type { TreeNode } from "@/types/tree";

const BRANCH_COLORS: Record<string, string> = {
  career: "#2D5BFF",
  deeper_topic: "#7C3AED",
  connection: "#059669",
  application: "#F4A236",
  question: "#DC2626",
} as const;

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;
const NODE_RX = 12;
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

const GOLD = '#D4A017';
const SECRET_BRANCH_COLORS: Record<string, string> = {
  career: '#D4A017',
  deeper_topic: '#B8860B',
  connection: '#DAA520',
  application: '#F4A236',
  question: '#CD853F',
};

const SPROUT_PASSAGES = [
  "Why do we dream?",
  "How do languages die?",
  "What makes music emotional?",
  "Can plants communicate?",
  "Why is the sky dark at night?",
];

export default function TreeCanvas({
  data,
  focusedId,
  expandingId,
  onNodeClick,
  onHiddenSproutClick,
  secretMode,
}: TreeCanvasProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Compute active IDs (parent, children, siblings of focused)
  const activeIds = useMemo(() => {
    if (!focusedId) return new Set<string>();
    const ids = new Set<string>();

    function walk(node: TreeNode, parent?: TreeNode) {
      if (node.id === focusedId) {
        // Add parent
        if (parent) ids.add(parent.id);
        // Add children
        for (const c of node.children ?? []) ids.add(c.id);
        // Add siblings
        if (parent) {
          for (const s of parent.children ?? []) ids.add(s.id);
        }
      }
      for (const c of node.children ?? []) walk(c, node);
    }
    walk(data);
    return ids;
  }, [data, focusedId]);

  function getVisualState(nodeId: string): VisualState {
    if (!focusedId) return "active"; // No focus = all active
    if (nodeId === focusedId) return "focused";
    if (activeIds.has(nodeId)) return "active";
    return "peripheral";
  }

  // Bottom-to-Top d3 layout (invert Y axis)
  const { nodes, links, svgWidth, svgHeight } = useMemo(() => {
    const root = hierarchy(data);
    const treeLayout = d3Tree<TreeNode>().nodeSize([
      NODE_WIDTH + 30,
      NODE_HEIGHT + 70,
    ]);
    treeLayout(root);

    const allNodes = root.descendants();
    const allLinks = root.links();

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const n of allNodes) {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    }

    const pad = 120;
    const w = maxX - minX + NODE_WIDTH + pad * 2;
    const h = maxY - minY + NODE_HEIGHT + pad * 2;
    const offsetX = -minX + NODE_WIDTH / 2 + pad;
    const offsetY = -minY + NODE_HEIGHT / 2 + pad;

    // Invert Y for bottom-to-top: root at bottom, leaves at top
    const maxTotalY = maxY + offsetY + NODE_HEIGHT / 2 + pad;

    return {
      nodes: allNodes.map((n) => ({
        id: n.data.id,
        label: n.data.label,
        branchType: n.data.branchType,
        summary: n.data.summary,
        x: n.x! + offsetX,
        y: maxTotalY - (n.y! + offsetY), // INVERTED
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

  // Auto-scroll to newest (topmost) node
  useEffect(() => {
    if (!containerRef.current) return;
    const topNode = nodes.reduce(
      (min, n) => (n.y < min.y ? n : min),
      nodes[0],
    );
    if (topNode) {
      containerRef.current.scrollTo({
        top: Math.max(0, topNode.y - 200),
        left: Math.max(0, topNode.x - containerRef.current.clientWidth / 2),
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    }
  }, [nodes, prefersReducedMotion]);

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 180, damping: 22 };

  const pathTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: "easeInOut" as const };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-auto"
      role="tree"
      aria-label="Knowledge tree"
      style={{
        backgroundImage: secretMode
          ? `radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px)`
          : `radial-gradient(circle, rgba(120,120,120,0.12) 1px, transparent 1px)`,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="select-none"
      >
        {/* Links */}
        <AnimatePresence>
          {links.map((link) => {
            const midY = (link.sourceY + link.targetY) / 2;
            const d = `M ${link.sourceX} ${link.sourceY} C ${link.sourceX} ${midY}, ${link.targetX} ${midY}, ${link.targetX} ${link.targetY}`;
            return (
              <motion.path
                key={link.id}
                d={d}
                fill="none"
                stroke={secretMode ? "rgba(212,160,23,0.6)" : "rgba(212,160,23,0.4)"}
                strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={pathTransition}
              />
            );
          })}
        </AnimatePresence>

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node, i) => {
            const state = getVisualState(node.id);
            const isExpanding = node.id === expandingId;
            const opacity =
              state === "focused" ? 1 :
              state === "active" ? 0.75 :
              0.35;
            const strokeWidth =
              state === "focused" ? 3 :
              state === "active" ? 2 :
              1.5;
            const nodeScale =
              state === "peripheral" ? 0.92 : 1;
            const colorMap = secretMode ? SECRET_BRANCH_COLORS : BRANCH_COLORS;
            const defaultColor = secretMode ? GOLD : "#2D5BFF";
            const strokeColor =
              isExpanding ? GOLD :
              (node.branchType && colorMap[node.branchType]) || defaultColor;

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity,
                  scale: nodeScale,
                  x: node.x - NODE_WIDTH / 2,
                  y: node.y - NODE_HEIGHT / 2,
                }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  ...springTransition,
                  delay: prefersReducedMotion ? 0 : Math.min(i * 0.08, 0.4),
                }}
                role="treeitem"
                tabIndex={0}
                onClick={() => onNodeClick?.(node.nodeData)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNodeClick?.(node.nodeData);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <title>{node.label}</title>
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={NODE_RX}
                  fill={state === "focused" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="dark:fill-zinc-900/90"
                />
                {/* Pulsing ring for expanding node */}
                {isExpanding && (
                  <rect
                    width={NODE_WIDTH + 6}
                    height={NODE_HEIGHT + 6}
                    x={-3}
                    y={-3}
                    rx={NODE_RX + 2}
                    fill="none"
                    stroke="#F4A236"
                    strokeWidth={1.5}
                    opacity={0.5}
                    className="animate-pulse"
                  />
                )}
                <foreignObject
                  x={10}
                  y={8}
                  width={NODE_WIDTH - 20}
                  height={NODE_HEIGHT - 16}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                      className="text-zinc-100"
                    >
                      {node.label}
                    </span>
                    {node.branchType && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: (node.branchType && BRANCH_COLORS[node.branchType]) || "#8B6914",
                          opacity: 0.9,
                        }}
                      >
                        {node.branchType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </foreignObject>
                {/* Click hint for leaf nodes */}
                {!node.hasChildren && state !== "peripheral" && (
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgba(255,255,255,0.3)"
                  >
                    click to explore deeper
                  </text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Hidden Sprouts — Easter Eggs scattered on the grid */}
        {onHiddenSproutClick && SPROUT_PASSAGES.map((passage, i) => {
          const sproutX = ((i * 317 + 89) % (svgWidth - 100)) + 50;
          const sproutY = ((i * 251 + 137) % (svgHeight - 100)) + 50;
          return (
            <circle
              key={`sprout-${i}`}
              cx={sproutX}
              cy={sproutY}
              r={2.5}
              fill="#059669"
              opacity={0.15}
              className="cursor-pointer transition-all duration-700 hover:opacity-60 hover:r-[5]"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onHiddenSproutClick(passage);
              }}
            >
              <animate
                attributeName="opacity"
                values="0.1;0.25;0.1"
                dur={`${3 + i}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
