import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { IdentityDraftItem } from '@/lib/types';

const bodySchema = z.object({
  participantId: z.string().uuid(),
  items: z.array(
    z.object({
      lens: z.enum(['GIVEN', 'CHOSEN', 'CORE']),
      type: z.enum(['tag', 'text']),
      label: z.string().max(64).optional(),
      value: z.string().min(1).max(120),
      weight: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    })
  ).min(1).max(50),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_request', details: parse.error.flatten() });
  }
  const { participantId, items } = parse.data as { participantId: string; items: IdentityDraftItem[] };

  try {
    // optional: validate participant exists
    const { data: p, error: pe } = await supabaseAdmin
      .from('participants')
      .select('id, session_id')
      .eq('id', participantId)
      .single();
    if (pe || !p) return res.status(404).json({ error: 'participant_not_found' });

    const toInsert = items.map((i) => ({
      participant_id: participantId,
      lens: i.lens,
      type: i.type,
      label: i.label ?? null,
      value: i.value,
      weight: i.weight,
    }));

    const { error: ie } = await supabaseAdmin.from('identity_items').insert(toInsert);
    if (ie) throw ie;

    // audit event (optional)
    await supabaseAdmin.from('events').insert({
      session_id: p.session_id,
      participant_id: participantId,
      event_type: 'identity_add',
      payload: { count: toInsert.length },
    });

    return res.status(200).json({ inserted: toInsert.length });
  } catch (e: any) {
    console.error('identity/add error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
