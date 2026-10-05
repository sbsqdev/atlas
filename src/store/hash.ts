// Tiny non-cryptographic password hash. DEMO ONLY — this is obfuscation, not
// real security. A production build must authenticate against a server.
export function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return 'ha_' + h.toString(36);
}

/** A short, human-friendly invite code (A–Z/2–9, no ambiguous chars). */
export function makeCode(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
