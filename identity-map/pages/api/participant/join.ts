import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  sessionCode: z.string().min(4),
  alias: z.string().min(1).max(40),
  consent: z.literal(true),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_request' });

  const { sessionCode, alias } = parsed.data;

  try {
    const { data: session, error: se } = await supabaseAdmin
      .from('sessions')
      .select('id, expires_at')
      .eq('code', sessionCode)
      .single();
    if (se || !session) return res.status(404).json({ error: 'session_not_found' });

    // (Optional) enforce expiry here if you track it
    // if (new Date(session.expires_at) < new Date()) return res.status(410).json({ error: 'session_expired' });

    const { data: participant, error: pe } = await supabaseAdmin
      .from('participants')
      .insert({ session_id: session.id, alias, consent: true, is_visible: false })
      .select('id')
      .single();
    if (pe || !participant) throw pe;

    return res.status(200).json({ participantId: participant.id });
  } catch (e) {
    console.error('participant/join error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
