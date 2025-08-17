import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import type { JoinSessionRequest, JoinSessionResponse, ApiError } from '../../types';

/*
 * API handler for joining an existing session.  It validates the
 * participant’s request, checks that the session exists and has not
 * expired, inserts the participant row, and returns the new participant
 * ID.  It also enforces that consent has been given.  The handler
 * responds with proper status codes for invalid input (400), missing
 * sessions (404), and unexpected errors (500).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JoinSessionResponse | ApiError>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ error: 'method_not_allowed', message: 'Method Not Allowed' });
  }

  try {
    const { code, displayName, isVisible, consentGiven } = req.body as Partial<JoinSessionRequest>;

    // Validate required fields
    if (!code || typeof code !== 'string') {
      return res
        .status(400)
        .json({ error: 'invalid_request', message: 'code is required' });
    }
    if (!displayName || typeof displayName !== 'string') {
      return res
        .status(400)
        .json({ error: 'invalid_request', message: 'displayName is required' });
    }
    if (consentGiven !== true) {
      return res
        .status(400)
        .json({ error: 'consent_required', message: 'Consent is required' });
    }

    // Find session by code
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, expires_at')
      .eq('code', code)
      .single();

    if (sessionError || !session) {
      return res
        .status(404)
        .json({ error: 'session_not_found', message: 'Session not found' });
    }

    // Check expiration
    if (session.expires_at) {
      const now = new Date();
      const expires = new Date(session.expires_at);
      if (expires < now) {
        return res
          .status(400)
          .json({ error: 'session_expired', message: 'Session has expired' });
      }
    }

    // Insert the participant
    const { data: participant, error: insertError } = await supabaseAdmin
      .from('participants')
      .insert({
        session_id: session.id,
        display_name: displayName,
        consent_given: consentGiven,
        is_visible: isVisible ?? false,
      })
      .select('id')
      .single();

    if (insertError || !participant) {
      console.error('Error inserting participant', insertError);
      return res
        .status(500)
        .json({ error: 'server_error', message: 'Failed to join session' });
    }

    return res
      .status(200)
      .json({ participantId: participant.id, message: 'Joined session successfully' });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'server_error', message: 'Unexpected error' });
  }
}
