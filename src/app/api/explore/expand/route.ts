import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/safety/system-prompts';
import { getContentTier } from '@/lib/safety/content-tiers';
import type { AgeBracket } from '@/types/database';

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

  const { sessionId, branchId, branchLabel } = (await request.json()) as {
    sessionId?: string;
    branchId?: string;
    branchLabel?: string;
  };

  if (!sessionId || !branchId || !branchLabel) {
    return NextResponse.json(
      { error: 'Session ID, branch ID, and branch label are required.' },
      { status: 400 },
    );
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from('exploration_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('student_id', user.id)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found.' },
      { status: 404 },
    );
  }

  // Get current branch depth
  const { data: parentBranch } = await supabase
    .from('exploration_branches')
    .select('depth')
    .eq('id', branchId)
    .single();

  const currentDepth = (parentBranch?.depth ?? 0) + 1;

  // Check depth limit by age bracket
  const ageBracket =
    (user.user_metadata?.age_bracket as AgeBracket) ?? '13_15';
  const tier = getContentTier(ageBracket);

  if (tier && tier.maxDepth !== -1 && currentDepth > tier.maxDepth) {
    return NextResponse.json(
      { error: 'Maximum exploration depth reached for your age group.' },
      { status: 403 },
    );
  }

  const systemPrompt = buildSystemPrompt({
    ageBracket,
    locale: session.status === 'active' ? 'en' : 'en',
  });

  const result = streamObject({
    model: anthropic('claude-sonnet-4-6-20260217'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `The student is exploring the branch "${branchLabel}" at depth level ${currentDepth}. Generate 3-5 sub-branches that go deeper into this specific topic.`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  // Stream as NDJSON + persist branches
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
          console.error('[explore/expand] Stream generation failed:', err);
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'generation_failed' }) + '\n'));
        }
      }
      controller.close();

      // Persist child branches
      if (collectedBranches.length > 0) {
        const branchRows = collectedBranches.map((b) => ({
          session_id: sessionId,
          parent_branch_id: branchId,
          branch_type: b.branchType,
          label: b.label,
          summary: b.summary,
          bloom_level: b.bloomLevel,
          depth: currentDepth,
          is_expanded: false,
        }));

        await supabase.from('exploration_branches').insert(branchRows);

        // Mark parent branch as expanded
        await supabase
          .from('exploration_branches')
          .update({ is_expanded: true })
          .eq('id', branchId);

        // Update session stats directly
        const bloomOrder = [
          'remember',
          'understand',
          'apply',
          'analyze',
          'evaluate',
          'create',
        ];
        const maxBloom = collectedBranches.reduce((max, b) => {
          const idx = bloomOrder.indexOf(b.bloomLevel);
          const maxIdx = bloomOrder.indexOf(max);
          return idx > maxIdx ? b.bloomLevel : max;
        }, 'remember');

        const { data: currentSession } = await supabase
          .from('exploration_sessions')
          .select('max_depth_reached, branch_count')
          .eq('id', sessionId)
          .single();

        const updates: Record<string, unknown> = {};
        if (
          currentSession &&
          currentDepth > (currentSession.max_depth_reached ?? 0)
        ) {
          updates.max_depth_reached = currentDepth;
        }
        if (currentSession) {
          updates.branch_count =
            (currentSession.branch_count ?? 0) + collectedBranches.length;
        }
        // Update bloom level if higher
        const currentBloomIdx = bloomOrder.indexOf(
          (currentSession as Record<string, unknown>)?.bloom_level_reached as string ?? 'remember',
        );
        const newBloomIdx = bloomOrder.indexOf(maxBloom);
        if (newBloomIdx > currentBloomIdx) {
          updates.bloom_level_reached = maxBloom;
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('exploration_sessions')
            .update(updates)
            .eq('id', sessionId);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Session-Id': sessionId!,
      'X-Parent-Branch-Id': branchId!,
      'X-Depth': String(currentDepth),
    },
  });
}
