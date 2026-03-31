import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { filterInput } from '@/lib/safety/input-filter';
import { buildSystemPrompt } from '@/lib/safety/system-prompts';
import type { AgeBracket } from '@/types/database';
import crypto from 'node:crypto';

const branchSchema = z.object({
  branches: z.array(
    z.object({
      branchType: z.enum([
        'career',
        'deeper_topic',
        'connection',
        'application',
        'question',
      ]),
      label: z.string(),
      summary: z.string(),
      bloomLevel: z.enum([
        'remember',
        'understand',
        'apply',
        'analyze',
        'evaluate',
        'create',
      ]),
    }),
  ),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { passage, locale } = (await request.json()) as {
    passage?: string;
    locale?: string;
  };

  if (!passage || typeof passage !== 'string') {
    return NextResponse.json(
      { error: 'Passage text is required.' },
      { status: 400 },
    );
  }

  // Input filter (Layer 2): PII detection + length validation
  const inputResult = filterInput(passage);
  if (!inputResult.allowed) {
    return NextResponse.json(
      { error: inputResult.reason ?? 'Input rejected.' },
      { status: 400 },
    );
  }

  const validBrackets: AgeBracket[] = ['under_10', '10_12', '13_15', '16_17', 'adult'];
  const rawBracket = user.user_metadata?.age_bracket as string | undefined;
  const ageBracket: AgeBracket = validBrackets.includes(rawBracket as AgeBracket)
    ? (rawBracket as AgeBracket)
    : '13_15';

  // Check daily limit
  const serviceClient = await createServiceClient();
  const { data: canExplore } = await serviceClient.rpc('check_daily_limit', {
    p_student_id: user.id,
  });

  if (canExplore === false) {
    return NextResponse.json(
      { error: 'Daily exploration limit reached. Come back tomorrow!' },
      { status: 429 },
    );
  }

  // Compute passage hash (SHA-256) — never store raw text
  const passageHash = crypto
    .createHash('sha256')
    .update(inputResult.sanitizedText)
    .digest('hex');

  // PII-stripped preview (first 100 chars)
  const passagePreview = inputResult.sanitizedText.slice(0, 100);

  // Get student's class
  const { data: membership } = await supabase
    .from('class_memberships')
    .select('class_id')
    .eq('student_id', user.id)
    .limit(1)
    .single();

  // Create exploration session
  const { data: session, error: sessionError } = await supabase
    .from('exploration_sessions')
    .insert({
      student_id: user.id,
      class_id: membership?.class_id ?? null,
      passage_hash: passageHash,
      passage_preview: passagePreview,
      locale: locale ?? 'en',
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Failed to create session.' },
      { status: 500 },
    );
  }

  // Increment daily usage
  await serviceClient.rpc('increment_daily_usage', {
    p_student_id: user.id,
    p_duration: 0,
  });

  // Build age-aware system prompt (Layer 1)
  const systemPrompt = buildSystemPrompt({
    ageBracket,
    locale: locale ?? 'en',
  });

  // Stream structured response from Claude
  const result = streamObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `Analyze the following textbook passage and generate exploration branches:\n\n${inputResult.sanitizedText}`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  // Stream as NDJSON (same pattern as demo) + persist branches to DB
  const encoder = new TextEncoder();
  const collectedBranches: Array<{
    branchType: string;
    label: string;
    summary: string;
    bloomLevel: string;
  }> = [];

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
                collectedBranches.push({
                  branchType: b.branchType,
                  label: b.label,
                  summary: b.summary ?? '',
                  bloomLevel: b.bloomLevel ?? 'understand',
                });
              }
            }
            lastCount = branches.length;
          }
        }
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          console.error('[explore/start] Stream generation failed:', err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'generation_failed' }) + '\n'));
        }
      }
      controller.close();

      // Persist branches to DB after stream completes
      if (collectedBranches.length > 0) {
        try {
          const branchRows = collectedBranches.map((b) => ({
            session_id: session.id,
            parent_branch_id: null,
            branch_type: b.branchType,
            label: b.label,
            summary: b.summary,
            bloom_level: b.bloomLevel,
            depth: 0,
            is_expanded: false,
          }));

          const { error: insertErr } = await supabase.from('exploration_branches').insert(branchRows);
          if (insertErr) console.error('[explore/start] Branch insert failed:', insertErr.message);

          const bloomOrder = [
            'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
          ];
          const maxBloom = collectedBranches.reduce((max, b) => {
            const idx = bloomOrder.indexOf(b.bloomLevel);
            const maxIdx = bloomOrder.indexOf(max);
            return idx > maxIdx ? b.bloomLevel : max;
          }, 'remember');

          const subjectLabel =
            collectedBranches[0]?.label?.slice(0, 100) ?? null;

          const { error: updateErr } = await supabase
            .from('exploration_sessions')
            .update({
              subject_label: subjectLabel,
              bloom_level_reached: maxBloom,
              branch_count: collectedBranches.length,
              max_depth_reached: 0,
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', session.id);
          if (updateErr) console.error('[explore/start] Session update failed:', updateErr.message);
        } catch (dbErr) {
          console.error('[explore/start] DB persistence failed:', dbErr);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Session-Id': session.id,
    },
  });
}
