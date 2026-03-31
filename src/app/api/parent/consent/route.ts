import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { childId, consentMethod } = (await request.json()) as {
    childId?: string;
    consentMethod?: string;
  };

  if (!childId) {
    return NextResponse.json(
      { error: 'Child ID is required.' },
      { status: 400 },
    );
  }

  const serviceClient = await createServiceClient();

  // Verify parent-child link exists and is pending
  const { data: link } = await serviceClient
    .from('parent_child_links')
    .select('id, consent_status')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single();

  if (!link) {
    return NextResponse.json(
      { error: 'No link found for this child.' },
      { status: 404 },
    );
  }

  if (link.consent_status === 'granted') {
    return NextResponse.json({ granted: true, already: true });
  }

  // Hash IP for audit
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

  // Grant consent
  const { error: updateError } = await serviceClient
    .from('parent_child_links')
    .update({
      consent_status: 'granted',
      consent_method: consentMethod ?? 'kba',
      consent_granted_at: new Date().toISOString(),
      consent_hash: crypto.randomUUID(),
    })
    .eq('id', link.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record in audit log
  await serviceClient.from('consent_audit_log').insert({
    parent_id: user.id,
    child_id: childId,
    action: 'granted',
    consent_details: { method: consentMethod ?? 'kba' },
    ip_hash: ipHash,
  });

  return NextResponse.json({ granted: true });
}
