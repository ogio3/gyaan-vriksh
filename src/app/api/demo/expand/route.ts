/*
 * /api/demo/expand — Expand a single branch into sub-branches.
 *
 * Called when a user clicks a leaf node in the tree. Takes the node's
 * label and its depth in the tree, then generates 3-4 more specific
 * sub-branches. Depth is passed to the AI so deeper explorations yield
 * increasingly niche and surprising content.
 *
 * Rate limit is more generous than /explore (20/hr vs 5/hr) because
 * expand calls are lighter and more frequent during active exploration.
 *
 * Note: no input-filter is applied here because the label originates
 * from a prior AI response (not raw user input). The system prompt
 * still enforces content safety.
 */
import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { filterOutput } from '@/lib/safety/output-filter';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { buildSystemPrompt } from '@/lib/safety/system-prompts';

// Same schema as /explore — both endpoints return the same branch structure
const branchSchema = z.object({
  branches: z.array(
    z.object({
      branchType: z.enum([
        'career', 'discovery', 'connection', 'innovation', 'mystery', 'history',
      ]),
      label: z.string(),
      summary: z.string(),
      bloomLevel: z.enum([
        'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
      ]),
      rarity: z.enum(['N', 'R', 'SR', 'SSR']),
    }),
  ),
});

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown';
  const { success } = rateLimit(`demo-expand:${ip}`, 20, 3_600_000);

  if (!success) {
    return NextResponse.json(
      { error: 'Demo limit reached. Sign up for unlimited access!' },
      { status: 429 },
    );
  }

  const { label, depth } = (await request.json()) as {
    label?: string;
    depth?: number;
  };

  if (!label || typeof label !== 'string') {
    return NextResponse.json(
      { error: 'Branch label is required.' },
      { status: 400 },
    );
  }

  const systemPrompt = buildSystemPrompt({
    ageBracket: '13_15',
    locale: 'en',
  });

  const result = streamObject({
    model: anthropic('claude-sonnet-4-6-20260217'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `The student is exploring deeper into "${label}" (depth level ${depth ?? 1}). Generate 3-4 sub-branches that reveal surprising, specific aspects of this topic. Each branch should make the student think "I had no idea this was connected!" Be concrete and specific, not generic.`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  // NDJSON streaming — same pattern as /explore. See explore/route.ts
  // for detailed comments on the partialObjectStream -> NDJSON conversion.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastCount = 0;
      try {
        for await (const partial of result.partialObjectStream) {
          const branches = partial.branches;
          if (branches && branches.length > lastCount) {
            for (let i = lastCount; i < branches.length; i++) {
              const b = branches[i];
              if (b && b.branchType && b.label) {
                const safetyCheck = await filterOutput(
                  `${b.label} ${b.summary ?? ''}`,
                  process.env.PERSPECTIVE_API_KEY ?? '',
                );
                if (!safetyCheck.allowed) continue;
                controller.enqueue(
                  encoder.encode(JSON.stringify(b) + '\n'),
                );
              }
            }
            lastCount = branches.length;
          }
        }
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          console.error('[demo/expand] Stream generation failed:', err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'generation_failed' }) + '\n'));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
