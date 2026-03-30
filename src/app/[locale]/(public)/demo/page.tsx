'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TreeCanvas from '@/components/TreeCanvas';
import type { TreeNode } from '@/types/tree';

const HIDDEN_PASSAGES = [
  'Why do we dream? Scientists believe dreams help consolidate memories and simulate scenarios.',
  'How do languages die? When the last speaker passes, an entire worldview vanishes.',
  'What makes music emotional? Sound waves trigger the same brain regions as food and love.',
  'Why is the sky dark at night? This simple question puzzled astronomers for centuries.',
  'Can plants communicate? Trees share nutrients through underground fungal networks.',
];

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

function extractBranches(text: string): BranchData[] {
  const branches: BranchData[] = [];
  const pattern = /\{\s*"branchType"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"\s*,\s*"summary"\s*:\s*"([^"]+)"\s*,\s*"bloomLevel"\s*:\s*"([^"]+)"\s*,\s*"rarity"\s*:\s*"([^"]+)"\s*\}/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    branches.push({
      branchType: match[1],
      label: match[2],
      summary: match[3],
      bloomLevel: match[4],
      rarity: match[5],
    });
  }
  return branches;
}

let nextId = 0;
function genId() {
  return `n-${++nextId}`;
}

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
  const [error, setError] = useState('');
  const [typedText, setTypedText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const triggerExploreRef = useRef<((p: string) => void) | null>(null);

  // Typewriter
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

  // Secret passage auto-trigger (Easter Egg from landing page)
  useEffect(() => {
    const secret = searchParams.get('secret');
    if (secret && !secretTriggered.current) {
      secretTriggered.current = true;
      triggerExploreRef.current?.(secret);
    }
  }, [searchParams]);

  // Initial explore (passage → first branches)
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

      const decoder = new TextDecoder();
      let accumulated = '';
      let lastCount = 0;
      const baseId = nextId; // Stable base for this batch

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const parsed = extractBranches(accumulated);
        if (parsed.length > lastCount) {
          lastCount = parsed.length;
          const children = parsed.map((b, i) => ({
            id: `b-${baseId}-${i}`, // Stable IDs
            label: b.label,
            branchType: b.branchType as TreeNode['branchType'],
            bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
            summary: b.summary,
            rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
          }));
          setTree({ ...rootNode, children });
        }
      }

      const final = extractBranches(accumulated);
      nextId += final.length;
      setTree({
        ...rootNode,
        children: final.map((b, i) => ({
          id: `b-${baseId}-${i}`,
          label: b.label,
          branchType: b.branchType as TreeNode['branchType'],
          bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
          summary: b.summary,
          rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
        })),
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

  // Keep ref in sync for secret auto-trigger
  triggerExploreRef.current = triggerExplore;

  // Expand: click a node → generate sub-branches
  const handleNodeClick = useCallback(async (node: TreeNode) => {
    if (phase === 'streaming' || phase === 'expanding') return; // busy
    if (node.children && node.children.length > 0) {
      // Already expanded — just focus
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

      const decoder = new TextDecoder();
      let accumulated = '';
      let lastCount = 0;
      const expandBaseId = ++nextId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const parsed = extractBranches(accumulated);
        if (parsed.length > lastCount) {
          lastCount = parsed.length;
          const newChildren = parsed.map((b, i) => ({
            id: `e-${expandBaseId}-${i}`, // Stable IDs
            label: b.label,
            branchType: b.branchType as TreeNode['branchType'],
            bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
            summary: b.summary,
            rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
          }));
          setTree((prev) => prev ? addChildrenToNode(
            removeChildrenFromNode(prev, node.id),
            node.id,
            newChildren,
          ) : prev);
        }
      }

      setExpandingId(null);
      setPhase('exploring');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setExpandingId(null);
        setPhase('exploring');
      }
    }
  }, [phase, tree]);

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
            onChange={(e) => setCustomPassage(e.target.value)}
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

function countDepth(tree: TreeNode, targetId: string, depth = 0): number {
  if (tree.id === targetId) return depth;
  for (const c of tree.children ?? []) {
    const d = countDepth(c, targetId, depth + 1);
    if (d >= 0) return d;
  }
  return -1;
}

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
