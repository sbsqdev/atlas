/* Draws 1080×1920 story images (Instagram / Telegram stories) on a canvas. */

export const W = 1080;
export const H = 1920;
const NAVY = '#102A43';
const TEAL = '#087F8C';
const CYAN = '#28B8C7';
const MUTED = '#9FB3C8';
const FONT = 'Inter, system-ui, sans-serif';

export type Theme = 'night' | 'teal' | 'sunrise';
const BG: Record<Theme, [string, string, string]> = {
  night: [NAVY, '#0B1F33', TEAL],
  teal: [TEAL, '#0A6C77', NAVY],
  sunrise: ['#1B2B44', '#C0567A', '#F2A65A'],
};

export interface StoryBase { theme: Theme; brand: string; footer: string; photo?: HTMLImageElement | null; name: string }
export interface ProfileStory extends StoryBase { kind: 'profile'; line: string; goalLabel: string; goal: string; raceLabel: string; race: string; pbLabel: string; pbs: [string, string][] }
export interface RaceStory extends StoryBase { kind: 'race'; eyebrow: string; event: string; distance: string; time: string; pace: string; paceLabel: string; note: string }
export interface CourseStory extends StoryBase { kind: 'course'; eyebrow: string; course: string; pct: number; detail: string; quote: string }
export type Story = ProfileStory | RaceStory | CourseStory;

function font(px: number, weight = 700) { return `${weight} ${px}px ${FONT}`; }

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].replace(/\s*\S*$/, '') + '…';
    return cut;
  }
  return lines;
}

/** Largest font size (up to `max`) at which the text fits the width. */
function fit(ctx: CanvasRenderingContext2D, s: string, maxW: number, max: number, weight: number) {
  ctx.font = font(max, weight);
  const w = ctx.measureText(s).width;
  return w > maxW ? Math.floor((max * maxW) / w) : max;
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, color: string, weight = 700, align: CanvasTextAlign = 'left') {
  ctx.font = font(px, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

function paragraph(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, color: string, maxW: number, weight = 600, maxLines = 3, lh = 1.25) {
  ctx.font = font(px, weight);
  const lines = wrap(ctx, s, maxW, maxLines);
  lines.forEach((l, i) => text(ctx, l, x, y + i * px * lh, px, color, weight));
  return y + lines.length * px * lh;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function background(ctx: CanvasRenderingContext2D, theme: Theme) {
  const [a, b, c] = BG[theme];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, a);
  g.addColorStop(0.6, b);
  g.addColorStop(1, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Soft glow and track lines.
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.18, 0, W * 0.85, H * 0.18, 700);
  glow.addColorStop(0, 'rgba(40,184,199,0.45)');
  glow.addColorStop(1, 'rgba(40,184,199,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 260, 760 + i * 70, 520 + i * 70, 0, Math.PI, 2 * Math.PI);
    ctx.stroke();
  }
}

function header(ctx: CanvasRenderingContext2D, brand: string) {
  roundRect(ctx, 80, 96, 76, 76, 22, CYAN);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(96, 136); ctx.lineTo(112, 136); ctx.lineTo(122, 112); ctx.lineTo(134, 158); ctx.lineTo(144, 136); ctx.lineTo(142, 136);
  ctx.stroke();
  text(ctx, brand, 180, 148, 40, '#fff', 800);
}

function footer(ctx: CanvasRenderingContext2D, s: string) {
  roundRect(ctx, 80, H - 200, W - 160, 104, 52, 'rgba(255,255,255,0.12)');
  text(ctx, s, W / 2, H - 134, 36, '#fff', 700, 'center');
}

function avatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null | undefined, name: string, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fillStyle = CYAN;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    const s = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = NAVY;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const initials = name.split(/\s+/).map((x) => x[0] ?? '').join('').slice(0, 2).toUpperCase();
    text(ctx, initials, cx, cy + r * 0.28, r * 0.8, '#fff', 800, 'center');
  }
  ctx.restore();
}

export function drawStory(ctx: CanvasRenderingContext2D, s: Story) {
  ctx.clearRect(0, 0, W, H);
  background(ctx, s.theme);
  header(ctx, s.brand);

  if (s.kind === 'profile') {
    avatar(ctx, s.photo, s.name, W / 2, 470, 190);
    ctx.font = font(84, 800);
    const nameLines = wrap(ctx, s.name || '—', W - 160, 2);
    nameLines.forEach((l, i) => text(ctx, l, W / 2, 790 + i * 96, 84, '#fff', 800, 'center'));
    let y = 790 + (nameLines.length - 1) * 96 + 72;
    text(ctx, s.line, W / 2, y, 40, CYAN, 700, 'center');
    y += 70;
    if (s.goal) {
      ctx.font = font(46, 700);
      const lines = wrap(ctx, s.goal, W - 248, 2);
      const h = 150 + (lines.length - 1) * 58;
      roundRect(ctx, 80, y, W - 160, h, 36, 'rgba(255,255,255,0.1)');
      text(ctx, s.goalLabel.toUpperCase(), 124, y + 62, 28, MUTED, 700);
      lines.forEach((l, i) => text(ctx, l, 124, y + 120 + i * 58, 46, '#fff', 700));
      y += h + 30;
    }
    const pbs = s.pbs.filter(([, v]) => v);
    if (pbs.length) {
      text(ctx, s.pbLabel.toUpperCase(), 80, y + 50, 28, MUTED, 700);
      y += 80;
      const cw = (W - 160 - 24 * (pbs.length - 1)) / pbs.length;
      pbs.forEach(([k, v], i) => {
        const x = 80 + i * (cw + 24);
        roundRect(ctx, x, y, cw, 170, 30, 'rgba(255,255,255,0.1)');
        text(ctx, k, x + cw / 2, y + 58, 30, CYAN, 700, 'center');
        text(ctx, v, x + cw / 2, y + 126, pbs.length > 3 ? 44 : 54, '#fff', 800, 'center');
      });
      y += 200;
    }
    if (s.race && y < H - 380) {
      text(ctx, s.raceLabel.toUpperCase(), 80, y + 50, 28, MUTED, 700);
      paragraph(ctx, s.race, 80, y + 116, 48, '#fff', W - 160, 700, 2);
    }
  }

  if (s.kind === 'race') {
    avatar(ctx, s.photo, s.name, W - 150, 134, 56);
    text(ctx, s.eyebrow.toUpperCase(), 80, 480, 36, CYAN, 800);
    const y = paragraph(ctx, s.event || '—', 80, 590, 88, '#fff', W - 160, 800, 3, 1.1);
    text(ctx, s.distance, 80, y + 150, 120, CYAN, 800);
    text(ctx, s.time, 80, y + 400, fit(ctx, s.time, W - 160, 230, 800), '#fff', 800);
    if (s.pace) {
      roundRect(ctx, 80, y + 480, 520, 130, 40, 'rgba(255,255,255,0.12)');
      text(ctx, s.paceLabel, 120, y + 532, 28, MUTED, 700);
      text(ctx, s.pace, 120, y + 584, 46, '#fff', 800);
    }
    if (s.note) paragraph(ctx, `“${s.note}”`, 80, y + 740, 48, '#fff', W - 160, 600, 3);
    text(ctx, s.name, 80, H - 280, 40, '#fff', 700);
  }

  if (s.kind === 'course') {
    avatar(ctx, s.photo, s.name, 190, 400, 100);
    text(ctx, s.name, 330, 390, 54, '#fff', 800);
    text(ctx, s.eyebrow, 330, 446, 32, CYAN, 700);
    const y = paragraph(ctx, s.course, 80, 650, 76, '#fff', W - 160, 800, 4, 1.12);
    // Progress ring.
    const cx = W / 2, cy = y + 220, r = 150;
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = CYAN;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.max(0.02, s.pct)) / 100); ctx.stroke();
    text(ctx, `${s.pct}%`, cx, cy + 40, 120, '#fff', 800, 'center');
    text(ctx, s.detail, cx, cy + r + 90, 40, MUTED, 700, 'center');
    if (s.quote) {
      ctx.font = font(42, 600);
      const lines = wrap(ctx, s.quote, W - 160, 3);
      const top = Math.min(cy + r + 180, H - 260 - lines.length * 54);
      lines.forEach((l, i) => text(ctx, l, 80, top + i * 54, 42, '#fff', 600));
    }
  }

  footer(ctx, s.footer);
}

/** Loads an image from a data URL (the profile photo). */
export function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Shrinks a picked photo to a square JPEG data URL small enough for local storage. */
export async function photoToDataUrl(file: File, size = 480): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (!img) throw new Error('image');
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const s = Math.min(img.width, img.height);
    c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Pace in min/km from a distance in km and a time "h:mm:ss" or "mm:ss". */
export function pace(km: number, time: string): string {
  const parts = time.split(':').map(Number);
  if (!km || parts.some((x) => Number.isNaN(x)) || parts.length < 2) return '';
  const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  if (!sec) return '';
  const p = Math.round(sec / km);
  return `${Math.floor(p / 60)}:${String(p % 60).padStart(2, '0')} /км`;
}
