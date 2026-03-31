/*
 * /api/demo/explore — Initial tree exploration endpoint.
 *
 * Takes a textbook passage and returns 4-5 AI-generated "knowledge cards"
 * as an NDJSON stream. Each card represents a branch of exploration
 * (career path, scientific discovery, cross-disciplinary connection, etc.).
 *
 * Safety layers applied (in order):
 *   1. Rate limiting: 5 requests per IP per hour (generous for demo, tight
 *      enough to prevent abuse)
 *   2. Input filter: PII detection + length validation
 *   3. System prompt: age-bracket-aware content constraints
 *   4. Zod schema: guarantees valid branch structure from AI output
 *
 * Streaming rationale: the AI takes 3-8 seconds to generate all branches.
 * Streaming NDJSON lets the client render branches as they arrive, giving
 * immediate feedback and creating the "growing tree" visual effect.
 */
import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { filterInput } from '@/lib/safety/input-filter';
import { buildSystemPrompt } from '@/lib/safety/system-prompts';

// Strict schema ensures the AI can only produce valid branch structures.
// Using z.enum for branchType/bloomLevel/rarity prevents hallucinated values.
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
  const { success } = rateLimit(`demo:${ip}`, 5, 3_600_000);

  if (!success) {
    return NextResponse.json(
      { error: 'Demo limit reached. Sign up for unlimited access!' },
      { status: 429 },
    );
  }

  const { passage } = (await request.json()) as { passage?: string };

  if (!passage || typeof passage !== 'string') {
    return NextResponse.json(
      { error: 'Passage text is required.' },
      { status: 400 },
    );
  }

  const inputResult = filterInput(passage);
  if (!inputResult.allowed) {
    return NextResponse.json(
      { error: inputResult.reason ?? 'Input rejected.' },
      { status: 400 },
    );
  }

  // Demo always uses the 13-15 age bracket and English locale.
  // Authenticated users will get their profile's actual age bracket.
  const systemPrompt = buildSystemPrompt({
    ageBracket: '13_15',
    locale: 'en',
  });

  const result = streamObject({
    model: anthropic('claude-sonnet-4-6-20260217'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `Analyze the following textbook passage and generate exploration branches:\n\n${inputResult.sanitizedText}`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  // Convert Vercel AI SDK's partialObjectStream into NDJSON.
  // partialObjectStream emits the full object-so-far on each token,
  // so we track lastCount to only send newly completed branches.
  // Gotcha: a branch may appear in partial.branches with only branchType
  // set (label still undefined) — the b.branchType && b.label guard
  // prevents sending incomplete records to the client.
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
                controller.enqueue(
                  encoder.encode(JSON.stringify(b) + '\n'),
                );
              }
            }
            lastCount = branches.length;
          }
        }
      } catch {
        // Stream aborted or error
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
