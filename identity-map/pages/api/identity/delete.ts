import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({ participantId: z.string().uuid() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_request' });

  const { participantId } = parse.data;

  try {
    // locate participant for audit
    const { data: p, error: pe } = await supabaseAdmin
      .from('participants')
      .select('id, session_id')
      .eq('id', participantId)
      .single();

    // delete cascade removes identity_items via FK
    const { error } = await supabaseAdmin.from('participants').delete().eq('id', participantId);
    if (error) throw error;

    if (p && !pe) {
      await supabaseAdmin.from('events').insert({
        session_id: p.session_id,
        participant_id: participantId,
        event_type: 'delete',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('identity/delete error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
