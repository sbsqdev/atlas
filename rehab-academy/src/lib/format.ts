import type { Locale } from '@/i18n';

export const LOCALE_TAG: Record<Locale, string> = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-GB' };

export const fmtDate = (ts: number, locale: Locale = 'ru') =>
  new Date(ts).toLocaleDateString(LOCALE_TAG[locale], { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDateTime = (ts: number, locale: Locale = 'ru') =>
  new Date(ts).toLocaleString(LOCALE_TAG[locale], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const fmtKzt = (n: number) => `${n.toLocaleString('ru-RU')} ₸`;

export function fmtHours(minutes: number) {
  return (minutes / 60).toFixed(minutes < 600 ? 1 : 0);
}

export function downloadFile(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** RFC 4180 CSV with BOM so Excel opens Cyrillic correctly. */
export function toCsv(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
}
