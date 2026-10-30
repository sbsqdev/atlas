import type { User } from '@/data/types';

/* Public athlete card: the profile (without photo or email) packed into a link
   the athlete shares in chats or a social bio. Nothing is stored on a server. */

export interface Card {
  n: string; c?: string; s?: string[]; g?: string; r?: string; a?: string;
  p?: Partial<Record<'5k' | '10k' | 'half' | 'marathon', string>>;
  ig?: string; tg?: string; st?: string;
}

const b64url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0)));

export function cardOf(u: User): Card {
  const pb = Object.fromEntries(Object.entries(u.pb ?? {}).filter(([, v]) => v));
  const card: Card = { n: u.fullName, c: u.city, s: u.sports, g: u.goal, r: u.nextRace, a: u.about, p: Object.keys(pb).length ? pb : undefined, ig: u.socials?.instagram, tg: u.socials?.telegram, st: u.socials?.strava };
  return Object.fromEntries(Object.entries(card).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))) as Card;
}

export const encodeCard = (c: Card) => b64url(JSON.stringify(c));
export function decodeCard(s: string): Card | null {
  try {
    const c = JSON.parse(unb64url(s)) as Card;
    return typeof c.n === 'string' ? c : null;
  } catch {
    return null;
  }
}

/** Turns "@name", "name" or a full link into a profile URL. */
export function socialUrl(kind: 'ig' | 'tg' | 'st', v: string): string {
  const s = v.trim();
  if (/^https?:\/\//i.test(s)) return s;
  const h = s.replace(/^@/, '');
  return kind === 'ig' ? `https://instagram.com/${h}` : kind === 'tg' ? `https://t.me/${h}` : `https://www.strava.com/athletes/${h}`;
}
