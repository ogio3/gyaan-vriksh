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
    model: anthropic('claude-4-6-sonnet-20260217'),
    schema: branchSchema,
    system: systemPrompt,
    prompt: `The student is exploring the branch "${branchLabel}" at depth level ${currentDepth}. Generate 3-5 sub-branches that go deeper into this specific topic.`,
    maxRetries: 3,
    abortSignal: request.signal,
  });

  return result.toTextStreamResponse({
    headers: {
      'X-Session-Id': sessionId,
      'X-Parent-Branch-Id': branchId,
      'X-Depth': String(currentDepth),
    },
  });
}
