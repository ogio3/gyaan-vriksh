/*
 * Demo Page — The primary unauthenticated experience.
 *
 * Flow: typewriter intro -> "Grow the Knowledge Tree" CTA -> AI-streamed
 * tree visualization -> click-to-expand any leaf node.
 *
 * This page does NOT require Supabase or authentication. It calls the
 * /api/demo/explore and /api/demo/expand endpoints which are rate-limited
 * by IP (5 explores/hr, 20 expands/hr).
 *
 * Supports two entry modes:
 *   1. Organic: user sees typewriter, clicks CTA, gets a showcase tree
 *   2. Secret: user arrives with ?secret=<passage> query param from landing
 *      page hidden sprouts — auto-triggers exploration immediately
 *
 * State machine (Phase):
 *   before -> streaming -> exploring <-> expanding
 *   - before: typewriter or custom-paste input
 *   - streaming: initial AI call in progress, branches arriving
 *   - exploring: tree rendered, user can click nodes
 *   - expanding: a node is being expanded with sub-branches
 */
'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TreeCanvas from '@/components/TreeCanvas';
import type { TreeNode } from '@/types/tree';

// These passages are pre-loaded answers for the hidden sprout Easter eggs.
// They match the SPROUT_PASSAGES in TreeCanvas.tsx.
const HIDDEN_PASSAGES = [
  'Why do we dream? Scientists believe dreams help consolidate memories and simulate scenarios.',
  'How do languages die? When the last speaker passes, an entire worldview vanishes.',
  'What makes music emotional? Sound waves trigger the same brain regions as food and love.',
  'Why is the sky dark at night? This simple question puzzled astronomers for centuries.',
  'Can plants communicate? Trees share nutrients through underground fungal networks.',
];

// Default passage shown in the typewriter animation. Chosen because
// photosynthesis is universally taught, culturally neutral, and branches
// well into career, discovery, and connection types.
const SHOWCASE_PASSAGE =
  'Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into oxygen and energy-rich organic compounds.';

type Phase = 'before' | 'streaming' | 'exploring' | 'expanding';

interface BranchData {
  branchType: string;
  label: string;
  summary: string;
  bloomLevel: string;
  rarity: string;
}

// Incrementally parse an NDJSON (newline-delimited JSON) stream.
// Each line is a complete JSON object representing one branch.
// This approach shows branches appearing one-by-one as the AI generates
// them, rather than waiting for the full response — critical for the
// "tree growing" illusion. Malformed lines are silently skipped because
// partial JSON chunks arrive mid-stream before a line is complete.
async function streamBranches(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onBranch: (branch: BranchData) => void,
) {
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line.trim());
        if (obj.branchType && obj.label) {
          onBranch({
            branchType: obj.branchType, label: obj.label,
            summary: obj.summary ?? '', bloomLevel: obj.bloomLevel ?? 'understand',
            rarity: obj.rarity ?? 'N',
          });
        }
      } catch { /* skip */ }
    }
  }
  if (buffer.trim()) {
    try {
      const obj = JSON.parse(buffer.trim());
      if (obj.branchType && obj.label) {
        onBranch({ branchType: obj.branchType, label: obj.label, summary: obj.summary ?? '', bloomLevel: obj.bloomLevel ?? 'understand', rarity: obj.rarity ?? 'N' });
      }
    } catch { /* skip */ }
  }
}

// Module-level counter for generating unique node IDs. Reset when the user
// starts a fresh tree ("Try your own passage"). Using a module-level var
// instead of useRef because genId is called outside the component in
// stream callbacks.
let nextId = 0;
function genId() {
  return `n-${++nextId}`;
}

// Immutably append children to a specific node in the tree.
// Returns a new tree object (required for React state updates to trigger
// re-render). Uses recursive descent because tree depth is bounded by
// content-tier maxDepth (2-4 levels typically).
function addChildrenToNode(
  tree: TreeNode,
  parentId: string,
  children: TreeNode[],
): TreeNode {
  if (tree.id === parentId) {
    return { ...tree, children: [...(tree.children ?? []), ...children] };
  }
  if (!tree.children) return tree;
  return {
    ...tree,
    children: tree.children.map((c) => addChildrenToNode(c, parentId, children)),
  };
}

function countNodes(node: TreeNode): number {
  let count = 1;
  for (const c of node.children ?? []) count += countNodes(c);
  return count;
}

// Wrapper needed because DemoPage uses useSearchParams(), which requires
// a Suspense boundary in Next.js App Router to avoid the entire page
// becoming a client-side render boundary.
export default function DemoPageWrapper() {
  return (
    <Suspense>
      <DemoPage />
    </Suspense>
  );
}

function DemoPage() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('before');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const secretTriggered = useRef(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customPassage, setCustomPassage] = useState('');
  const [hiddenStage, setHiddenStage] = useState(false);
  const [error, setError] = useState('');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const triggerExploreRef = useRef<((p: string) => void) | null>(null);

  // Typewriter effect: reveals the showcase passage character-by-character
  // at 18ms intervals (~55 chars/sec). After the full text is shown, the
  // CTA button appears with a 400ms delay for dramatic effect.
  // Skipped if the user is in custom-paste mode or has already started exploring.
  useEffect(() => {
    if (customMode || phase !== 'before') return;
    charIndexRef.current = 0;
    setTypedText('');
    setShowButton(false);
    const text = SHOWCASE_PASSAGE;
    typewriterRef.current = setInterval(() => {
      charIndexRef.current++;
      const idx = charIndexRef.current;
      setTypedText(text.slice(0, idx));
      if (idx >= text.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        setTimeout(() => setShowButton(true), 400);
      }
    }, 18);
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [customMode, phase]);

  // Easter egg: if the URL contains ?secret=<passage>, auto-trigger an
  // exploration. This is how the landing page's hidden seeds navigate here.
  // secretTriggered ref prevents double-firing on React strict mode re-mount.
  useEffect(() => {
    const secret = searchParams.get('secret');
    if (secret && !secretTriggered.current) {
      secretTriggered.current = true;
      triggerExploreRef.current?.(secret);
    }
  }, [searchParams]);

  // Initial exploration: sends a passage to /api/demo/explore and streams
  // back branches as NDJSON. Creates the root node immediately (optimistic UI),
  // then appends children as they arrive from the AI. Aborts any in-flight
  // request first to prevent race conditions from rapid clicks.
  const triggerExplore = useCallback(async (passage: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const rootNode: TreeNode = { id: 'root', label: passage.length > 50 ? passage.slice(0, 47) + '...' : passage };
    setTree(rootNode);
    setPhase('streaming');
    setFocusedId('root');
    setExpandingId('root');
    setError('');

    try {
      const response = await fetch('/api/demo/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Something went wrong.');
        setPhase('before');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { setPhase('before'); return; }

      const baseId = ++nextId;
      const collectedChildren: TreeNode[] = [];

      await streamBranches(reader, (b) => {
        collectedChildren.push({
          id: `b-${baseId}-${collectedChildren.length}`,
          label: b.label,
          branchType: b.branchType as TreeNode['branchType'],
          bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
          summary: b.summary,
          rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
        });
        setTree({ ...rootNode, children: [...collectedChildren] });
      });

      setExpandingId(null);
      setPhase('exploring');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('Connection error.');
        setPhase('before');
      }
    }
  }, []);

  // Sync the ref so the secret-passage useEffect (which fires before
  // triggerExplore is stable) can call the latest version.
  triggerExploreRef.current = triggerExplore;

  // Node expansion: when a leaf node is clicked, fetch sub-branches from
  // /api/demo/expand. If the node already has children, just shift focus
  // to it (no redundant API calls). During streaming/expanding phases,
  // clicks are ignored to prevent concurrent mutations to the tree state.
  const handleNodeClick = useCallback(async (node: TreeNode) => {
    if (phase === 'streaming' || phase === 'expanding') return;
    if (node.children && node.children.length > 0) {
      setFocusedId(node.id);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFocusedId(node.id);
    setExpandingId(node.id);
    setPhase('expanding');

    try {
      const response = await fetch('/api/demo/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: node.label, depth: countDepth(tree!, node.id) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        setPhase('exploring');
        setExpandingId(null);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) { setPhase('exploring'); setExpandingId(null); return; }

      const expandBaseId = ++nextId;
      const expandChildren: TreeNode[] = [];

      // Stream sub-branches. On each new branch, we remove then re-add
      // all children to the target node. This "replace all" approach is
      // simpler than incremental append and avoids duplicate-key issues
      // if the stream re-sends a partially completed branch.
      await streamBranches(reader, (b) => {
        expandChildren.push({
          id: `e-${expandBaseId}-${expandChildren.length}`,
          label: b.label,
          branchType: b.branchType as TreeNode['branchType'],
          bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
          summary: b.summary,
          rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
        });
        setTree((prev) => prev ? addChildrenToNode(
          removeChildrenFromNode(prev, node.id),
          node.id,
          [...expandChildren],
        ) : prev);
      });

      setExpandingId(null);
      setPhase('exploring');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setExpandingId(null);
        setPhase('exploring');
      }
    }
  }, [phase, tree]);

  // Cleanup: abort any in-flight fetch when the component unmounts
  // (e.g., user navigates away mid-stream).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── TREE VIEW (streaming / exploring / expanding) ──
  if (tree && phase !== 'before') {
    const nodeCount = countNodes(tree);
    return (
      <div className="flex min-h-dvh flex-col bg-zinc-950">
        <div className="relative flex-1">
          <TreeCanvas
            data={tree}
            focusedId={focusedId}
            expandingId={expandingId}
            onNodeClick={handleNodeClick}
            onHiddenSproutClick={(passage) => triggerExplore(passage)}
          />
          {(phase === 'streaming' || phase === 'expanding') && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 backdrop-blur">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#F4A236]" />
              <span className="text-xs text-white/80">
                {phase === 'streaming' ? 'Growing tree...' : 'Exploring deeper...'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500">
              {nodeCount} nodes · Click any node to explore deeper
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setTree(null);
                setFocusedId(null);
                setCustomMode(true);
                setPhase('before');
                nextId = 0;
              }}
              className="text-xs font-medium text-[#2D5BFF] hover:underline"
            >
              Try your own passage
            </button>
            <a
              href="/sign-up"
              className="rounded-full bg-[#2D5BFF] px-4 py-1.5 text-xs font-medium text-white"
            >
              Sign up free
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── HIDDEN STAGE: unlocked by typing "I am an engineer" ──
  if (hiddenStage) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #09090b 0%, #0a1628 100%)' }}>
        <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
          <div style={{ animation: 'secret-glow 3s ease-in-out infinite' }}>
            <h1 className="text-3xl font-bold" style={{ color: '#D4A017' }}>
              You found the hidden stage.
            </h1>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            You read the source code. You found the hint in TreeCanvas.tsx.
            You typed the passphrase. That means you understand how this
            application works — not just how to use it, but how it was built.
          </p>
          <div className="rounded-lg border border-[#D4A017]/30 bg-[#D4A017]/5 p-5 text-left space-y-2 w-full">
            <p className="text-xs font-mono text-[#D4A017]/80">MASTER&apos;S HIGH SCORE</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-zinc-300">
              <span>Time to build</span><span className="text-right font-mono">7.5 hours</span>
              <span>Prompts exchanged</span><span className="text-right font-mono">~85</span>
              <span>Decisions made</span><span className="text-right font-mono">42</span>
              <span>Lines of code</span><span className="text-right font-mono">12,427</span>
              <span>Files created</span><span className="text-right font-mono">97</span>
              <span>Easter eggs hidden</span><span className="text-right font-mono">9</span>
              <span>Architecture rewrites</span><span className="text-right font-mono">3</span>
            </div>
          </div>
          <p className="text-sm text-zinc-300">
            When you surpass these numbers, you&apos;ve surpassed the master.
          </p>
          <p className="text-xs text-zinc-500">
            Build something. Ship it. Show the world.
            <br />
            hi [at] ogio.dev — I&apos;ll be waiting.
          </p>
          <style>{`
            @keyframes secret-glow {
              0%, 100% { text-shadow: 0 0 10px rgba(212,160,23,0.2); }
              50% { text-shadow: 0 0 30px rgba(212,160,23,0.5); }
            }
          `}</style>
          <button
            onClick={() => { setHiddenStage(false); setCustomPassage(''); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-4"
          >
            Return to the tree
          </button>
        </div>
      </main>
    );
  }

  // ── CUSTOM MODE ──
  if (customMode) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <div className="flex w-full max-w-lg flex-col gap-5">
          <h1 className="text-center text-2xl font-bold tracking-tight">
            Paste any passage
          </h1>
          <textarea
            value={customPassage}
            onChange={(e) => {
              const val = e.target.value;
              setCustomPassage(val);
              // Hidden stage trigger: reading the source code reveals the passphrase
              if (val.toLowerCase().trim() === 'i am an engineer') {
                setHiddenStage(true);
              }
            }}
            placeholder="Paste a textbook passage here..."
            rows={5}
            maxLength={2000}
            autoFocus
            className="rounded-lg border border-zinc-300 px-4 py-3 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-900"
          />
          {error && (
            <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            onClick={() => triggerExplore(customPassage)}
            disabled={!customPassage.trim()}
            className="min-h-[48px] rounded-lg bg-[#2D5BFF] text-sm font-semibold text-white disabled:opacity-40"
          >
            Explore
          </button>
          <button
            onClick={() => { setCustomMode(false); setPhase('before'); }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Back to demo
          </button>
        </div>
      </main>
    );
  }

  // ── BEFORE: Typewriter ──
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-8">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          A typical textbook says...
        </p>
        <blockquote className="min-h-[100px] rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-5 text-center text-sm italic leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          &ldquo;{typedText}
          <span className="animate-pulse">|</span>&rdquo;
        </blockquote>
        {showButton && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-xs text-zinc-400">What if it could become something more?</p>
            <button
              onClick={() => triggerExplore(SHOWCASE_PASSAGE)}
              className="w-full min-h-[56px] rounded-xl bg-[#2D5BFF] text-lg font-bold text-white shadow-lg shadow-[#2D5BFF]/25 transition-all hover:shadow-xl hover:shadow-[#2D5BFF]/35 active:scale-[0.98]"
            >
              Grow the Knowledge Tree
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </main>
  );
}

// --- Helpers ---

// Walk the tree to find the depth of a specific node. Returns -1 if
// the node isn't found. Used to tell the AI how deep we are, so it
// can adjust branch specificity (deeper = more niche/surprising content).
function countDepth(tree: TreeNode, targetId: string, depth = 0): number {
  if (tree.id === targetId) return depth;
  for (const c of tree.children ?? []) {
    const d = countDepth(c, targetId, depth + 1);
    if (d >= 0) return d;
  }
  return -1;
}

// Strip all children from a specific node, returning a new tree.
// Used before addChildrenToNode during streaming to avoid appending
// duplicate children when the stream callback fires multiple times.
function removeChildrenFromNode(tree: TreeNode, nodeId: string): TreeNode {
  if (tree.id === nodeId) {
    return { ...tree, children: undefined };
  }
  if (!tree.children) return tree;
  return {
    ...tree,
    children: tree.children.map((c) => removeChildrenFromNode(c, nodeId)),
  };
}
