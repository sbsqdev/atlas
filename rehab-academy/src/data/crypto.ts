/* Password hashing with WebCrypto PBKDF2-SHA-256. Used by the local demo
   adapter only; in production Supabase Auth stores and verifies passwords. */

const ITERATIONS = 100_000;
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

export function newSalt() {
  return hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITERATIONS }, key, 256,
  );
  return hex(bits);
}

export function tempPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const v = crypto.getRandomValues(new Uint8Array(12));
  return [...v].map((x) => alphabet[x % alphabet.length]).join('');
}
