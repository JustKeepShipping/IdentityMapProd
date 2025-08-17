import { useState } from 'react';
import type { CreateSessionResponse, ApiError } from '../types';

/*
 * CreateSessionPage renders a form for facilitators to create new
 * sessions.  Facilitators provide a session title and optionally
 * specify an expiration timestamp and contact email.  Upon successful
 * creation the page displays the generated join code so that
 * participants can join.  The form disables itself while awaiting a
 * response and surfaces any errors returned by the server.
 */
export default function CreateSessionPage() {
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [facilitatorEmail, setFacilitatorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSessionCode(null);

    if (loading) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          facilitatorEmail: facilitatorEmail.trim() || undefined,
          expiresAt: expiresAt.trim() || undefined,
        }),
      });
      const data: CreateSessionResponse | ApiError = await response.json();
      if (!response.ok) {
        setError((data as ApiError).message ?? 'Failed to create session');
      } else {
        setSessionCode((data as CreateSessionResponse).code);
        setTitle('');
        setFacilitatorEmail('');
        setExpiresAt('');
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Create a Session</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.25rem' }}>Session Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="expiresAt" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Expires At (optional)
          </label>
          <input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="facilitatorEmail" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Facilitator Email (optional)
          </label>
          <input
            id="facilitatorEmail"
            type="email"
            value={facilitatorEmail}
            onChange={(e) => setFacilitatorEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '0.75rem' }}>{error}</p>}
        {sessionCode && (
          <p style={{ color: 'green', marginBottom: '0.75rem' }}>
            Session created! Join code: <strong>{sessionCode}</strong>
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Creating…' : 'Create Session'}
        </button>
      </form>
    </main>
  );
}
