'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import TreeCanvas from '@/components/TreeCanvas';
import type { TreeNode } from '@/types/tree';

type Phase = 'input' | 'streaming' | 'exploring' | 'expanding';

interface BranchData {
  branchType: string;
  label: string;
  summary: string;
  bloomLevel: string;
}

// Incrementally parse an NDJSON stream. Each line is a complete JSON object.
async function streamBranches(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onBranch: (b: BranchData) => void,
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
            branchType: obj.branchType,
            label: obj.label,
            summary: obj.summary ?? '',
            bloomLevel: obj.bloomLevel ?? 'understand',
          });
        }
      } catch {
        /* skip partial */
      }
    }
  }
  if (buffer.trim()) {
    try {
      const obj = JSON.parse(buffer.trim());
      if (obj.branchType && obj.label) {
        onBranch({
          branchType: obj.branchType,
          label: obj.label,
          summary: obj.summary ?? '',
          bloomLevel: obj.bloomLevel ?? 'understand',
        });
      }
    } catch {
      /* skip */
    }
  }
}

let nextId = 0;

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
    children: tree.children.map((c) =>
      addChildrenToNode(c, parentId, children),
    ),
  };
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

function countNodes(node: TreeNode): number {
  let count = 1;
  for (const c of node.children ?? []) count += countNodes(c);
  return count;
}

export default function ExplorePage() {
  const [passage, setPassage] = useState('');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Map node IDs to their DB branch IDs for expand calls
  const branchIdMap = useRef<Map<string, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleExplore = useCallback(async () => {
    if (!passage.trim()) {
      setError('Please paste a textbook passage to explore.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const rootNode: TreeNode = {
      id: 'root',
      label: 'Your Passage',
    };
    setTree(rootNode);
    setPhase('streaming');
    setFocusedId('root');
    setExpandingId('root');
    setError('');

    try {
      const response = await fetch('/api/explore/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: passage.trim() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Exploration failed.');
        setPhase('input');
        setTree(null);
        return;
      }

      const sid = response.headers.get('X-Session-Id');
      if (sid) setSessionId(sid);

      const reader = response.body?.getReader();
      if (!reader) {
        setPhase('input');
        setTree(null);
        return;
      }

      const baseId = ++nextId;
      const collectedChildren: TreeNode[] = [];

      await streamBranches(reader, (b) => {
        const nodeId = `b-${baseId}-${collectedChildren.length}`;
        collectedChildren.push({
          id: nodeId,
          label: b.label,
          branchType: b.branchType as TreeNode['branchType'],
          bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
          summary: b.summary,
        });
        setTree({ ...rootNode, children: [...collectedChildren] });
      });

      setExpandingId(null);
      setPhase('exploring');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('Connection error. Please try again.');
        setPhase('input');
        setTree(null);
      }
    }
  }, [passage]);

  const handleNodeClick = useCallback(
    async (node: TreeNode) => {
      if (phase === 'streaming' || phase === 'expanding') return;
      if (node.children && node.children.length > 0) {
        setFocusedId(node.id);
        return;
      }

      // For expand, we need the DB branch ID. If we don't have it, use
      // the node label for the API call (server will look it up).
      const dbBranchId = branchIdMap.current.get(node.id);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setFocusedId(node.id);
      setExpandingId(node.id);
      setPhase('expanding');

      try {
        const response = await fetch('/api/explore/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            branchId: dbBranchId ?? node.id,
            branchLabel: node.label,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setPhase('exploring');
          setExpandingId(null);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setPhase('exploring');
          setExpandingId(null);
          return;
        }

        const expandBaseId = ++nextId;
        const expandChildren: TreeNode[] = [];

        await streamBranches(reader, (b) => {
          expandChildren.push({
            id: `e-${expandBaseId}-${expandChildren.length}`,
            label: b.label,
            branchType: b.branchType as TreeNode['branchType'],
            bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
            summary: b.summary,
          });
          setTree((prev) =>
            prev
              ? addChildrenToNode(
                  removeChildrenFromNode(prev, node.id),
                  node.id,
                  [...expandChildren],
                )
              : prev,
          );
        });

        setExpandingId(null);
        setPhase('exploring');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setExpandingId(null);
          setPhase('exploring');
        }
      }
    },
    [phase, tree, sessionId],
  );

  // ── INPUT PHASE ──
  if (phase === 'input' && !tree) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="flex w-full max-w-xl flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Explore a passage
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Paste a textbook passage to discover career paths, deeper topics,
              and connections.
            </p>
            <textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="Paste your textbook passage here..."
              rows={6}
              maxLength={2000}
              className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {passage.length}/2000 characters
              </span>
              {error && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </span>
              )}
            </div>
            <button
              onClick={handleExplore}
              disabled={!passage.trim()}
              className="min-h-[44px] rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TREE VIEW (streaming / exploring / expanding) ──
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Knowledge Tree</span>
          {sessionId && (
            <span className="text-xs text-zinc-400">
              Session: {sessionId.slice(0, 8)}...
            </span>
          )}
        </div>
        <button
          onClick={() => {
            abortRef.current?.abort();
            setTree(null);
            setPassage('');
            setSessionId(null);
            setFocusedId(null);
            setExpandingId(null);
            setPhase('input');
            branchIdMap.current.clear();
            nextId = 0;
          }}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          New exploration
        </button>
      </div>
      <div className="relative flex-1">
        {tree && (
          <TreeCanvas
            data={tree}
            focusedId={focusedId}
            expandingId={expandingId}
            onNodeClick={handleNodeClick}
          />
        )}
        {(phase === 'streaming' || phase === 'expanding') && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2 backdrop-blur">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#F4A236]" />
            <span className="text-xs text-white/80">
              {phase === 'streaming'
                ? 'Growing tree...'
                : 'Exploring deeper...'}
            </span>
          </div>
        )}
      </div>
      <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            {tree ? countNodes(tree) : 0} nodes · Click any node to explore
            deeper
          </span>
          <span className="text-xs text-zinc-400">
            Generated by AI — may contain errors. Discuss with your teacher.
          </span>
        </div>
      </div>
    </div>
  );
}
