import type { NextApiRequest, NextApiResponse } from 'next';
import { generateCode } from '../../lib/generateCode';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import type { CreateSessionRequest, CreateSessionResponse, ApiError } from '../../types';

/*
 * API handler for creating a new session.  This route accepts a POST
 * request containing a session title and optional facilitator email and
 * expiration date.  It generates a unique join code, creates a session
 * record in the database and returns the session ID and code.  Errors
 * are handled explicitly and surfaced to the client as JSON responses.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateSessionResponse | ApiError>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ error: 'method_not_allowed', message: 'Method Not Allowed' });
  }

  try {
    const { title, facilitatorEmail, expiresAt } = req.body as Partial<CreateSessionRequest & { facilitatorEmail?: string; expiresAt?: string }>;

    if (!title || typeof title !== 'string') {
      return res
        .status(400)
        .json({ error: 'invalid_request', message: 'title is required' });
    }

    // Generate a unique code.  Try increasing the length slightly if a
    // collision is detected.  In practice collisions are extremely
    // unlikely with 6 characters but this loop adds resilience.
    let code: string;
    let attempts = 0;
    do {
      code = generateCode(6 + attempts);
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('code', code)
        .single();
      if (existingError || !existing) {
        break;
      }
      attempts++;
    } while (attempts < 3);

    // Insert the new session
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        code,
        title,
        facilitator_email: facilitatorEmail ?? null,
        expires_at: expiresAt ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error creating session', error);
      return res
        .status(500)
        .json({ error: 'server_error', message: 'Failed to create session' });
    }

    return res.status(200).json({ sessionId: data.id, code });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'server_error', message: 'Unexpected error' });
  }
}
