// Turn a Google Drive / YouTube share link into an inline-embeddable URL.
// For Drive this uses the /preview player, which plays files shared as
// "anyone with the link can view" — no API key or OAuth needed.

export interface Embed {
  url: string;
  provider: 'drive' | 'youtube';
}

export function toEmbed(raw: string | undefined): Embed | null {
  if (!raw) return null;
  const url = raw.trim();

  // Google Drive: /file/d/<id>/... or ...?id=<id>
  const driveId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (/drive\.google\.com/.test(url) && driveId) {
    return { url: `https://drive.google.com/file/d/${driveId}/preview`, provider: 'drive' };
  }

  // YouTube: youtu.be/<id>, watch?v=<id>, /embed/<id>, /shorts/<id>
  const ytId =
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)?.[1] ||
    url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)?.[1] ||
    url.match(/\/embed\/([a-zA-Z0-9_-]{6,})/)?.[1] ||
    url.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/)?.[1];
  if (/youtube\.com|youtu\.be/.test(url) && ytId) {
    return { url: `https://www.youtube.com/embed/${ytId}`, provider: 'youtube' };
  }

  return null;
}
