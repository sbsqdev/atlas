/* Access codes for paid athletes. The owner signs a code with the private key
   on the /issue page (the key never leaves her browser); the site checks the
   signature with the public key below. A code holds the email, the plan and
   the date access ends. */

const PUBLIC_JWK: JsonWebKey = {
  kty: 'EC', crv: 'P-256',
  x: 'sdxOB4d6QEPYOoqO0jUy847G_ho_eefHMdqs0QbC5Pk',
  y: 'jIG7EadFj4_SWJOMqHsk7qiGFnMgONmXDp9RDOEwtyk',
};

export type PlanId = 'launch' | 'month' | 'personal';
export interface AccessGrant { email: string; plan: PlanId; until: number }

const ALG = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGN = { name: 'ECDSA', hash: 'SHA-256' } as const;
const DAY = 86_400_000;

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const enc = (s: string) => new TextEncoder().encode(s);

let publicKey: Promise<CryptoKey> | null = null;

/** Returns the grant if the code is genuine, otherwise null. Expired codes are returned too: the caller checks `until`. */
export async function verifyAccessCode(code: string): Promise<AccessGrant | null> {
  const [payload, sig] = code.trim().split('.');
  if (!payload || !sig) return null;
  try {
    publicKey ??= crypto.subtle.importKey('jwk', PUBLIC_JWK, ALG, false, ['verify']);
    if (!(await crypto.subtle.verify(SIGN, await publicKey, unb64url(sig), enc(payload)))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64url(payload))) as { e: string; p: PlanId; u: number };
    return { email: p.e, plan: p.p, until: p.u * DAY };
  } catch {
    return null;
  }
}

/** Signs a code (used on the owner's /issue page). `until` is rounded up to the end of that UTC day. */
export async function signAccessCode(privateJwk: JsonWebKey, grant: AccessGrant): Promise<string> {
  const key = await crypto.subtle.importKey('jwk', privateJwk, ALG, false, ['sign']);
  const payload = b64url(enc(JSON.stringify({ e: grant.email.trim().toLowerCase(), p: grant.plan, u: Math.ceil(grant.until / DAY) })));
  const sig = new Uint8Array(await crypto.subtle.sign(SIGN, key, enc(payload)));
  return `${payload}.${b64url(sig)}`;
}
