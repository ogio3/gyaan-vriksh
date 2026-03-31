'use client';

/*
 * ====================================================================
 * 見つけてくれてありがとうございます。
 *
 * 私は小さい時、アプリの作り方やゲームの作り方に興味があって、
 * 学校の先生やクラスのみんなに問題児だと扱われてきました。
 * でも自分は間違っていないと思って、だからちゃんと勉強をして、
 * 大学を卒業して、ゲーム会社を作って自分が必死に考えた
 * 最高のゲームを世の中に出したら評価された。
 * そして今こうやって貴女たちにNext.jsでつくった
 * ウェブアプリを提供できて本当に感謝しています。
 *
 * もしどうしても分からないことがあれば
 * hi [at] ogio.dev まで。
 * 返事が遅くなっても絶対に見るから。
 * もし何日まっても返事がなかったら先生に相談してね。
 * ====================================================================
 */

import Link from 'next/link';
import { useState, useCallback, useRef, type ReactNode } from 'react';
import TreeCanvas from '@/components/TreeCanvas';
import type { TreeNode } from '@/types/tree';

// Hidden "seeds" — words in the landing page copy that, when clicked,
// trigger a secret golden tree exploration. Each key is a word that
// appears naturally in the page text; each value is a curiosity-provoking
// passage that seeds the AI exploration. The Sanskrit and Hindi words
// (ज्ञान = knowledge, वृक्ष = tree) are in the page title itself.
const SEEDS: Record<string, string> = {
  'ज्ञान': 'What does knowledge mean? The Sanskrit word Jnana refers to awareness that transcends mere information — it is the direct experiential understanding of reality itself.',
  'वृक्ष': 'Why are trees sacred in every culture? The Bodhi Tree, Yggdrasil, the Tree of Knowledge — humanity has always mapped wisdom onto branching structures.',
  'textbook': 'Who invented textbooks? The first known textbook was written in ancient Sumeria around 2000 BCE on clay tablets, teaching mathematics to scribes.',
  'knowledge tree': 'How does memory work like a tree? Neuroscientists discovered that memories form branching dendrite patterns — your brain literally grows knowledge trees.',
  'career paths': 'Did you know most careers that will exist in 2040 have not been invented yet? The jobs that matter most are the ones nobody can imagine today.',
  'connections': 'What is serendipity? The word was coined in 1754 from a Persian fairy tale about princes who kept discovering things they were not looking for.',
};

const GOLD = '#D4A017';

type SecretBranch = { branchType: string; label: string; summary: string; bloomLevel: string; rarity: string };

// NDJSON stream parser — same logic as the demo page's streamBranches.
// Duplicated here rather than shared because this page and the demo page
// are independent entry points and tree-shaking works better with co-located code.
async function streamBranchesFromReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onBranch: (b: SecretBranch) => void,
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
          onBranch({ branchType: obj.branchType, label: obj.label, summary: obj.summary ?? '', bloomLevel: obj.bloomLevel ?? 'understand', rarity: obj.rarity ?? 'N' });
        }
      } catch { /* skip */ }
    }
  }
  if (buffer.trim()) {
    try {
      const obj = JSON.parse(buffer.trim());
      if (obj.branchType && obj.label) onBranch({ branchType: obj.branchType, label: obj.label, summary: obj.summary ?? '', bloomLevel: obj.bloomLevel ?? 'understand', rarity: obj.rarity ?? 'N' });
    } catch { /* skip */ }
  }
}

let nextSecretId = 0;

// A clickable word with a tiny pulsing dot indicator. The dot is intentionally
// almost invisible (4px, low opacity) — only the observant will notice it,
// rewarding careful attention. The hover color shift to amber hints at the
// gold theme of secret trees.
function Seed({
  word,
  passage,
  onActivate,
}: {
  word: string;
  passage: string;
  onActivate: (passage: string) => void;
}) {
  return (
    <span
      className="relative cursor-pointer transition-all duration-500 hover:text-amber-400/90"
      onClick={(e) => {
        e.stopPropagation();
        onActivate(passage);
      }}
    >
      {word}
      <span
        className="absolute -top-0.5 -right-1 h-[4px] w-[4px] rounded-full"
        style={{
          animation: 'sprout-pulse 4s ease-in-out infinite',
        }}
      />
    </span>
  );
}

// Scans a text string for SEEDS keywords and replaces each occurrence
// with a clickable <Seed> component, preserving the original casing.
// The scanning is case-insensitive but the rendered text matches the
// source. Keywords are sorted by position to handle left-to-right
// splitting correctly.
function TextWithSeeds({
  children,
  onActivate,
}: {
  children: string;
  onActivate: (passage: string) => void;
}) {
  const parts: ReactNode[] = [];
  let remaining = children;
  let key = 0;

  const found: { word: string; passage: string; index: number }[] = [];
  for (const [word, passage] of Object.entries(SEEDS)) {
    const idx = remaining.toLowerCase().indexOf(word.toLowerCase());
    if (idx !== -1) {
      found.push({ word, passage, index: idx });
    }
  }
  found.sort((a, b) => a.index - b.index);

  for (const { word, passage } of found) {
    const actualIdx = remaining.toLowerCase().indexOf(word.toLowerCase(), 0);
    if (actualIdx === -1) continue;
    if (actualIdx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, actualIdx)}</span>);
    }
    const originalWord = remaining.slice(actualIdx, actualIdx + word.length);
    parts.push(
      <Seed key={key++} word={originalWord} passage={passage} onActivate={onActivate} />,
    );
    remaining = remaining.slice(actualIdx + word.length);
  }

  if (remaining) {
    parts.push(<span key={key++}>{remaining}</span>);
  }

  return <>{parts}</>;
}

export default function HomePage() {
  const [secretTree, setSecretTree] = useState<TreeNode | null>(null);
  const [secretActive, setSecretActive] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // When a hidden seed is clicked, this fetches branches from the same
  // /api/demo/explore endpoint used by the demo page, but renders the
  // resulting tree in gold ("secret mode") directly on the landing page.
  // This creates a moment of surprise — the marketing page transforms
  // into a live product demo without navigation.
  const activateSecret = useCallback(async (passage: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSecretActive(true);
    setBlooming(true);
    setSecretTree({
      id: 'secret-root',
      label: passage.length > 50 ? passage.slice(0, 47) + '...' : passage,
    });

    try {
      const response = await fetch('/api/demo/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage }),
        signal: controller.signal,
      });

      if (!response.ok) {
        setSecretActive(false);
        setBlooming(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const baseId = ++nextSecretId;
      const rootLabel = passage.length > 50 ? passage.slice(0, 47) + '...' : passage;
      const collected: TreeNode[] = [];

      await streamBranchesFromReader(reader, (b) => {
        collected.push({
          id: `s-${baseId}-${collected.length}`,
          label: b.label,
          branchType: b.branchType as TreeNode['branchType'],
          bloomLevel: b.bloomLevel as TreeNode['bloomLevel'],
          summary: b.summary,
          rarity: (b.rarity as TreeNode['rarity']) ?? 'N',
        });
        setSecretTree({
          id: 'secret-root',
          label: rootLabel,
          children: [...collected],
        });
      });

      setBlooming(false);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setSecretActive(false);
        setBlooming(false);
      }
    }
  }, []);

  // ── SECRET BLOOM: Tree grows directly on landing page ──
  if (secretActive && secretTree) {
    return (
      <main className="flex min-h-dvh flex-col bg-zinc-950">
        <style>{`
          @keyframes secret-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(212,160,23,0.1); }
            50% { box-shadow: 0 0 40px rgba(212,160,23,0.25); }
          }
        `}</style>

        {/* Secret header */}
        <div
          className="flex items-center justify-center py-4 text-center"
          style={{ animation: 'secret-glow 3s ease-in-out infinite' }}
        >
          <span className="text-sm font-medium" style={{ color: GOLD }}>
            You found a secret seed
          </span>
        </div>

        {/* The golden tree */}
        <div className="relative flex-1">
          <TreeCanvas
            data={secretTree}
            focusedId="secret-root"
            expandingId={blooming ? 'secret-root' : null}
            secretMode
          />
          {blooming && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur" style={{ background: 'rgba(212,160,23,0.15)' }}>
              <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: GOLD }} />
              <span className="text-xs" style={{ color: GOLD }}>
                Secret tree blooming...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          <span className="text-xs" style={{ color: `${GOLD}88` }}>
            This is a secret tree. Only the curious find it.
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSecretActive(false);
                setSecretTree(null);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Back
            </button>
            <Link
              href="/demo"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-white"
              style={{ background: GOLD }}
            >
              Explore the full tree
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── LANDING PAGE ──
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <style>{`
        @keyframes sprout-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); background: rgba(212,160,23,0.2); }
          50% { opacity: 0.4; transform: scale(1.5); background: rgba(212,160,23,0.5); }
        }
      `}</style>
      <div className="flex w-full max-w-lg flex-col items-center gap-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <Seed word="ज्ञान" passage={SEEDS['ज्ञान']} onActivate={activateSecret} />
            {' '}
            <Seed word="वृक्ष" passage={SEEDS['वृक्ष']} onActivate={activateSecret} />
          </h1>
          <p className="mt-1 text-lg text-zinc-500 dark:text-zinc-400">
            Gyaan Vriksh
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            <TextWithSeeds onActivate={activateSecret}>
              Paste a textbook passage, and watch it grow into a knowledge tree — career paths, deeper topics, and connections you never expected.
            </TextWithSeeds>
          </p>
        </div>

        <Link
          href="/demo"
          className="flex w-full flex-col items-center gap-2 rounded-2xl bg-[#2D5BFF] px-8 py-6 text-center shadow-lg shadow-[#2D5BFF]/20 transition-all hover:shadow-xl hover:shadow-[#2D5BFF]/30 active:scale-[0.98]"
        >
          <span className="text-xl font-bold text-white">
            Try it now
          </span>
          <span className="text-sm text-white/80">
            No sign-up needed. Explore instantly.
          </span>
        </Link>

        <div className="flex w-full flex-col items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Or explore the full platform
          </span>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-200 px-4 py-2 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
            >
              Teacher Dashboard
            </Link>
            <Link
              href="/parent"
              className="rounded-md border border-zinc-200 px-4 py-2 text-xs text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
            >
              Parent View
            </Link>
          </div>
        </div>

        <div className="flex gap-6 text-xs text-zinc-400 dark:text-zinc-500">
          <Link href="/sign-in" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            Sign in
          </Link>
          <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            Privacy
          </Link>
          <span className="hover:text-zinc-600 dark:hover:text-zinc-300 cursor-default" title="hi [at] ogio.dev">
            Source
          </span>
        </div>
      </div>
    </main>
  );
}
