/*
 * TreeCanvas — Core knowledge-tree visualization rendered in SVG.
 *
 * Uses d3-hierarchy for layout computation and framer-motion for animated
 * transitions. The tree grows **bottom-to-top** (root at the bottom) to
 * visually mirror a real tree growing upward, which matches the mental
 * model of "exploring deeper = growing taller."
 *
 * Key design decisions:
 *   - SVG over canvas: we need per-node interactivity (click, keyboard,
 *     focus) and the node count stays manageable (<100 in practice).
 *   - foreignObject for text: allows CSS text truncation (-webkit-line-clamp)
 *     and natural line wrapping inside SVG cards.
 *     Gotcha: foreignObject intercepts pointer events in some browsers,
 *     so a transparent rect sits on top of each card to catch clicks.
 *   - Card rarity system (N/R/SR/SSR) gamifies exploration; SSR cards get
 *     holographic shimmer effects to reward discovery.
 *   - Reduced-motion support: all animations respect prefers-reduced-motion.
 */
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { hierarchy, tree as d3Tree } from "d3-hierarchy";
import { motion, AnimatePresence } from "motion/react";
import type { TreeNode, CardRarity } from "@/types/tree";

// Each branch type has a distinct color so the tree is visually scannable.
// These map to BranchType in the database schema (career, discovery, etc.).
const TYPE_COLORS: Record<string, string> = {
  career: "#2D5BFF",
  discovery: "#7C3AED",
  connection: "#059669",
  innovation: "#F4A236",
  mystery: "#DC2626",
  history: "#D97706",
};

// Gacha-inspired rarity tiers. Higher rarity = more visual flair (glow, stars).
// SSR is intentionally rare (max 1 per AI response) to create "wow" moments.
const RARITY_CONFIG: Record<string, { color: string; glow: string; stars: number }> = {
  N:   { color: "#71717a", glow: "none",                          stars: 1 },
  R:   { color: "#2D5BFF", glow: "0 0 8px rgba(45,91,255,0.3)",  stars: 2 },
  SR:  { color: "#7C3AED", glow: "0 0 12px rgba(124,58,237,0.4)", stars: 3 },
  SSR: { color: "#D4A017", glow: "0 0 20px rgba(212,160,23,0.5)", stars: 4 },
};

// Card dimensions tuned for mobile-first: 180px wide fits two columns on
// most phones without horizontal scroll. 252px tall accommodates title
// (3 lines) + summary (4 lines) comfortably.
const CARD_W = 180;
const CARD_H = 252;
const CARD_RX = 12;
// Background dot grid size — purely cosmetic, gives the canvas a "workbench" feel
const GRID_SIZE = 24;

// Visual states implement progressive disclosure: the focused node and its
// neighbors stay prominent while distant nodes fade to reduce cognitive load.
type VisualState = "focused" | "active" | "peripheral";

interface TreeCanvasProps {
  data: TreeNode;
  focusedId?: string | null;
  expandingId?: string | null;
  onNodeClick?: (node: TreeNode) => void;
  onHiddenSproutClick?: (passage: string) => void;
  secretMode?: boolean;
}

// Secret mode: when activated from hidden sprouts on the landing page,
// the entire tree renders in gold tones instead of the standard palette.
const GOLD = "#D4A017";
const SECRET_TYPE_COLORS: Record<string, string> = {
  career: "#D4A017", discovery: "#B8860B", connection: "#DAA520",
  innovation: "#F4A236", mystery: "#CD853F", history: "#D4A017",
};

// Curiosity-provoking questions planted as nearly-invisible dots on the canvas.
// Finding one rewards the user with a new tree exploration — an Easter egg
// designed to model and reward intellectual curiosity itself.
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

  // Accessibility: detect OS-level reduced-motion preference and disable
  // spring animations accordingly. Listens for runtime changes (e.g., user
  // toggles the setting while the app is open).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Compute the "neighborhood" of the focused node: its parent, siblings,
  // and direct children. Everything outside this neighborhood fades to
  // "peripheral" state — this prevents visual overload as trees grow large.
  const activeIds = useMemo(() => {
    if (!focusedId) return new Set<string>();
    const ids = new Set<string>();
    function walk(node: TreeNode, parent?: TreeNode) {
      if (node.id === focusedId) {
        if (parent) ids.add(parent.id);
        for (const c of node.children ?? []) ids.add(c.id);
        // Include siblings (other children of the same parent)
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

  // Layout computation: d3-hierarchy computes a top-down tree, then we
  // flip Y coordinates to render bottom-to-top (root at bottom).
  // The nodeSize spacing (CARD_W+24, CARD_H+50) prevents card overlap
  // while keeping the tree compact enough to scan visually.
  const { nodes, links, svgWidth, svgHeight } = useMemo(() => {
    const root = hierarchy(data);
    const treeLayout = d3Tree<TreeNode>().nodeSize([CARD_W + 24, CARD_H + 50]);
    treeLayout(root);

    const allNodes = root.descendants();
    const allLinks = root.links();

    // Calculate bounding box to size the SVG and center the tree
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
    // maxTotalY is used to flip Y: y_flipped = maxTotalY - y_original
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
      // Extra 500px below the root for THE MYCELIUM — a hidden underground
      // network that only appears if you scroll past the root node.
      // The Three Keys are encoded in the constants of this file.
      // First Key (Logic): CARD_W=180, CARD_H=252, ratio=63:88
      // Second Key (Pattern): 85 prompts, 42 decisions — tap root 42 times
      // Third Key (Heart): the contact is in the mycelium itself
      svgHeight: Math.max(h, 400) + 500,
    };
  }, [data]);

  // Auto-scroll to the topmost (newest) node after the tree layout updates.
  // Because the tree grows upward, new branches appear at lower Y values.
  // This keeps the latest exploration visible without manual scrolling.
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const topNode = nodes.reduce((min, n) => (n.y < min.y ? n : min), nodes[0]);
    containerRef.current.scrollTo({
      top: Math.max(0, topNode.y - 200),
      left: Math.max(0, topNode.x - containerRef.current.clientWidth / 2),
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  }, [nodes, prefersReducedMotion]);

  // Animation presets: spring physics for card movements (organic feel),
  // easeInOut for path drawing (smooth and predictable).
  // Both collapse to instant (duration: 0) when reduced motion is active.
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
            // Cubic bezier curves between parent and child nodes.
            // The control points are horizontally aligned with source/target
            // and vertically at the midpoint, creating smooth S-shaped connections.
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
                  fill={typeColor} opacity={0.15} style={{ pointerEvents: "none" }}
                />

                {/* Type icon area */}
                <foreignObject x={12} y={14} width={CARD_W - 24} height={78} style={{ pointerEvents: "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: typeColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {(node.branchType ?? "").replace("_", " ")}
                    </span>
                  </div>
                </foreignObject>

                {/* Rarity stars */}
                <foreignObject x={CARD_W - 60} y={10} width={52} height={20} style={{ pointerEvents: "none" }}>
                  <div style={{ textAlign: "right", fontSize: 10, color: rarity.color }}>
                    {"★".repeat(rarity.stars)}
                  </div>
                </foreignObject>

                {/* Card content */}
                <foreignObject x={12} y={104} width={CARD_W - 24} height={CARD_H - 120} style={{ pointerEvents: "none" }}>
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

                {/* Transparent click layer — MUST be the topmost element.
                    Gotcha: foreignObject elements above intercept pointer
                    events in Safari/Firefox even with pointerEvents:"none"
                    on some OS versions. This invisible rect guarantees
                    clicks always reach the motion.g onClick handler. */}
                <rect width={CARD_W} height={CARD_H} rx={CARD_RX}
                  fill="transparent" style={{ cursor: "pointer" }}
                />

                {/* Expanding indicator: two concentric pulsing outlines.
                    Uses SVG <animate> (not framer-motion) because this runs
                    continuously during AI streaming and SVG SMIL animations
                    are GPU-composited and don't trigger React re-renders. */}
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

        {/* ═══════════════════════════════════════════════════════════
            THE MYCELIUM — Underground hidden stage.
            Below the root node, in negative space that most users will
            never scroll to. A network of glowing fungal threads connects
            nodes of wisdom. Ready Player One: everyone looks up at the
            branches. Only those who look DOWN find the real treasure.
            ═══════════════════════════════════════════════════════════ */}
        {(() => {
          const rootNode = nodes.find(n => n.depth === 0);
          if (!rootNode) return null;
          const groundY = rootNode.y + CARD_H / 2 + 20;
          const centerX = rootNode.x;
          // Mycelium threads — bioluminescent curves below the root
          const threads = [
            { x1: centerX, y1: groundY, x2: centerX - 120, y2: groundY + 180 },
            { x1: centerX, y1: groundY, x2: centerX + 90, y2: groundY + 220 },
            { x1: centerX, y1: groundY, x2: centerX - 60, y2: groundY + 280 },
            { x1: centerX, y1: groundY, x2: centerX + 140, y2: groundY + 160 },
            { x1: centerX, y1: groundY, x2: centerX + 20, y2: groundY + 320 },
            { x1: centerX - 120, y1: groundY + 180, x2: centerX + 90, y2: groundY + 220 },
            { x1: centerX + 90, y1: groundY + 220, x2: centerX + 20, y2: groundY + 320 },
          ];
          return (
            <g opacity={0.6}>
              {/* Ground line */}
              <line x1={centerX - 200} y1={groundY} x2={centerX + 200} y2={groundY}
                stroke="rgba(120,120,120,0.15)" strokeWidth={1} strokeDasharray="4 8" />
              {/* Mycelium threads */}
              {threads.map((t, i) => {
                const midX = (t.x1 + t.x2) / 2 + (i % 2 === 0 ? 30 : -30);
                const midY = (t.y1 + t.y2) / 2;
                return (
                  <path key={`myc-${i}`}
                    d={`M ${t.x1} ${t.y1} Q ${midX} ${midY} ${t.x2} ${t.y2}`}
                    fill="none" stroke="#D4A017" strokeWidth={0.8} opacity={0.3}
                  >
                    <animate attributeName="opacity" values="0.1;0.4;0.1"
                      dur={`${3 + i * 0.7}s`} repeatCount="indefinite" />
                  </path>
                );
              })}
              {/* Mycelium nodes — wisdom glowing underground */}
              {[
                { x: centerX - 120, y: groundY + 180, text: '~85 prompts' },
                { x: centerX + 90, y: groundY + 220, text: '42 decisions' },
                { x: centerX - 60, y: groundY + 280, text: '12,427 lines' },
                { x: centerX + 140, y: groundY + 160, text: '97 files' },
                { x: centerX + 20, y: groundY + 320, text: '7.5 hours' },
                { x: centerX - 30, y: groundY + 380, text: 'surpass me' },
              ].map((node, i) => (
                <g key={`myc-node-${i}`}>
                  <circle cx={node.x} cy={node.y} r={4} fill="#D4A017" opacity={0.4}>
                    <animate attributeName="r" values="3;5;3" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                  <text x={node.x} y={node.y + 14} textAnchor="middle"
                    fontSize={9} fill="#D4A017" opacity={0.5}
                    style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                  >
                    {node.text}
                  </text>
                </g>
              ))}
              {/* The deepest message */}
              <text x={centerX} y={groundY + 400} textAnchor="middle"
                fontSize={11} fill="#D4A017" opacity={0.3}
                style={{ fontFamily: 'monospace' }}
              >
                hi @ ogio.dev
              </text>
              <text x={centerX} y={groundY + 420} textAnchor="middle"
                fontSize={8} fill="#D4A017" opacity={0.2}
                style={{ fontFamily: 'monospace' }}
              >
                the mycelium connects all things
              </text>
            </g>
          );
        })()}

        {/* Hidden Sprouts — nearly invisible 2.5px green dots scattered
            across the canvas. Clicking one triggers a new exploration.
            Positions are deterministic (seeded by index * primes) so they
            stay stable across re-renders but appear random. */}
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

/*
 * ════════════════════════════════════════════════════════════════
 * MASTER'S HIGH SCORE — The Eternal Tree v2.1
 * ════════════════════════════════════════════════════════════════
 *
 * This tree was grown in a single session.
 *
 *   Time to build:       7.5 hours (5:00 AM — 12:30 PM)
 *   Prompts exchanged:     ~85
 *   Decisions made:         42
 *   Lines of code:      12,427
 *   Files created:          97
 *   API endpoints:          17
 *   Compliance documents:   11
 *   Easter eggs hidden:      9
 *   Bugs fixed under fire:   4
 *   Architecture rewrites:   3
 *   Times "ship it" was said: 1
 *
 * If you're reading this, you've already gone deeper than most
 * engineers ever will. This score is yours to beat.
 *
 * Build something. Ship it. Show the world.
 * When you surpass these numbers, you've surpassed the master.
 *
 * The secret stage awaits those who look even deeper.
 * Hint: the tree remembers what you type. Try "I am an engineer".
 *
 * ════════════════════════════════════════════════════════════════
 */
