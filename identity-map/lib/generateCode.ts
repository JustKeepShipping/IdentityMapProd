/**
 * generateCode returns a random alphanumeric code suitable for use as a
 * join code.  The default length is 6 characters.  To avoid confusion
 * with similar looking characters, ambiguous letters (such as I, O and
 * 1) are omitted from the character set.
 *
 * Because crypto.randomUUID() and other high‑entropy sources are not
 * available in all runtimes, this function falls back to Math.random()
 * when the Web Crypto API is unavailable.
 */
export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  // Prefer Web Crypto API when available (browser and modern Node)
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(length);
    globalThis.crypto.getRandomValues(buffer);
    for (let i = 0; i < length; i++) {
      result += chars[buffer[i] % chars.length];
    }
  } else {
    // Fallback to pseudo‑random numbers if crypto is not available
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}
