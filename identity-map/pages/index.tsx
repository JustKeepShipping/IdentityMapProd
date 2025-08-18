import { useState } from 'react';
import { useRouter } from 'next/router';
import type { ApiError, JoinSessionResponse } from '../types';

/*
 * JoinSessionPage renders the landing page where a participant can join a
 * session by entering a display name, a join code, confirming consent,
 * and optionally making themselves visible to others.
 */
export default function JoinSessionPage() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (loading) return;

    if (!consent) {
      setError('You must give consent to join the session.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/joinSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          displayName: displayName.trim(),
          consentGiven: consent,
          isVisible: visible,
        }),
      });

      const data: JoinSessionResponse | ApiError = await response.json();

      if (!response.ok) {
        setError((data as ApiError).message ?? 'Failed to join session');
        return;
      }

      // Expect the API to include a participant identifier
      const pid =
        (data as JoinSessionResponse).participantId ??
        (data as any).id ??
        (data as any).participantID;

      if (!pid || typeof pid !== 'string') {
        setError('Join succeeded but participantId was not returned.');
        return;
      }

      // Store for /my-identity
      localStorage.setItem('participantId', pid);

      // Optional toast/message; this will be skipped by redirect
      setSuccessMessage(`Welcome, ${displayName.trim()}!`);

      // Redirect to identity capture
      router.push('/my-identity');

      // (Optionally) reset form after navigation
      setCode('');
      setDisplayName('');
      setConsent(false);
      setVisible(false);
    } catch {
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Join a Session</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="displayName" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Alias
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="code" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Join Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            I consent to share my anonymized identity information within this session.
          </label>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Make me visible to other participants (optional)
          </label>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '0.75rem' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green', marginBottom: '0.75rem' }}>{successMessage}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Joining…' : 'Join Session'}
        </button>
      </form>
    </main>
  );
}
