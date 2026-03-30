import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { filterInput } from '@/lib/safety/input-filter';
import { buildSystemPrompt } from '@/lib/safety/system-prompts';

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

  const systemPrompt = buildSystemPrompt({
    ageBracket: '13_15',
    locale: 'en',
  });

  const result = streamObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `Analyze the following textbook passage and generate exploration branches:\n\n${inputResult.sanitizedText}`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  // Stream completed branches as NDJSON (one JSON line per update)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastCount = 0;
      try {
        for await (const partial of result.partialObjectStream) {
          const branches = partial.branches;
          if (branches && branches.length > lastCount) {
            // Send only newly completed branches
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
