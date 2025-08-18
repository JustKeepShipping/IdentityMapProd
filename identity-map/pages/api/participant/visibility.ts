import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  participantId: z.string().uuid(),
  isVisible: z.boolean(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_request' });

  const { participantId, isVisible } = parse.data;

  try {
    const { data: p, error: pe } = await supabaseAdmin
      .from('participants')
      .select('id, session_id')
      .eq('id', participantId)
      .single();
    if (pe || !p) return res.status(404).json({ error: 'participant_not_found' });

    const { error } = await supabaseAdmin
      .from('participants')
      .update({ is_visible: isVisible })
      .eq('id', participantId);
    if (error) throw error;

    await supabaseAdmin.from('events').insert({
      session_id: p.session_id,
      participant_id: participantId,
      event_type: 'visibility_toggle',
      payload: { isVisible },
    });

    return res.status(200).json({ isVisible });
  } catch (e: any) {
    console.error('participant/visibility error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
