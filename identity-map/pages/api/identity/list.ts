import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const querySchema = z.object({ participantId: z.string().uuid() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'invalid_request' });
  }
  const { participantId } = parse.data;

  try {
    const { data, error } = await supabaseAdmin
      .from('identity_items')
      .select('id, lens, type, label, value, weight, created_at')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const items = (data || []).map((r) => ({
      id: r.id,
      participantId,
      lens: r.lens,
      type: r.type,
      label: r.label,
      value: r.value,
      weight: r.weight,
      createdAt: r.created_at,
    }));

    return res.status(200).json({ items });
  } catch (e: any) {
    console.error('identity/list error', e);
    return res.status(500).json({ error: 'server_error' });
  }
}
