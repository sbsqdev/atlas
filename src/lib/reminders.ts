// Browser (Web Notifications) reminders — work with no backend, while the app
// tab is open. E-mail reminders are handled separately by a serverless cron
// (see api/send-reminders.ts) and activate only on a real deploy.
import { useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { doneToday, parseTime, remindsToday, todayKey } from './habits';
import type { Habit } from '../types';

const NOTIFY_LOG = 'human-atlas-reminded'; // `${habitId}:${day}` already fired

export function notificationState(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

function alreadyFired(key: string): boolean {
  try {
    const raw = localStorage.getItem(NOTIFY_LOG);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(key);
  } catch {
    return false;
  }
}

function markFired(key: string) {
  try {
    const raw = localStorage.getItem(NOTIFY_LOG);
    const list: string[] = raw ? JSON.parse(raw) : [];
    // Keep the log small: only today's keys matter.
    const today = todayKey();
    const pruned = list.filter((k) => k.endsWith(`:${today}`));
    pruned.push(key);
    localStorage.setItem(NOTIFY_LOG, JSON.stringify(pruned));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function fire(h: Habit) {
  try {
    const n = new Notification('⏰ ' + h.title, {
      body: h.afterHabit
        ? `После «${h.afterHabit}» — самое время. ${h.twoMinute ? 'Начни с малого: ' + h.twoMinute : ''}`.trim()
        : h.twoMinute
          ? `Начни с малого: ${h.twoMinute}`
          : 'Не разрывай цепочку 🔥',
      tag: h.id, // replaces an earlier notification for the same habit
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      window.location.hash = '#/achievements';
      n.close();
    };
  } catch {
    /* Notification constructor can throw on some platforms — ignore */
  }
}

/** Best-effort: ask the serverless endpoint to send an e-mail reminder.
 *  No-ops silently on a static preview (endpoint 404) or when no key is set. */
function sendEmail(email: string, h: Habit) {
  const line = h.afterHabit
    ? `После «${h.afterHabit}» — самое время.${h.twoMinute ? ' Начни с малого: ' + h.twoMinute : ''}`
    : h.twoMinute
      ? `Начни с малого: ${h.twoMinute}`
      : '';
  fetch('/api/send-reminder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, title: h.title, time: h.time, line }),
  }).catch(() => {/* offline / no endpoint — browser notification still fired */});
}

/** Check every habit and fire due reminders. Safe to call often.
 *  `email` is the student's opted-in reminder address (or undefined). */
function checkDue(habits: Habit[], email?: string) {
  const canNotify = notificationState() === 'granted';
  if (!canNotify && !email) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = todayKey(now);
  for (const h of habits) {
    if (!remindsToday(h) || doneToday(h)) continue;
    const at = parseTime(h.time);
    if (at === null) continue;
    // Fire within a 30-minute window after the scheduled time so a tab opened
    // a little late still gets the nudge, but only once per day per habit.
    if (nowMin < at || nowMin > at + 30) continue;
    const key = `${h.id}:${today}`;
    if (alreadyFired(key)) continue;
    markFired(key);
    if (canNotify) fire(h);
    if (email) sendEmail(email, h);
  }
}

/** Mount once (e.g. in Layout): polls the habit list for due reminders. */
export function useReminders() {
  const user = useAuth((s) => s.user);
  const habits = useAuth((s) => (user ? s.habits[user.id] ?? [] : []));
  const email = useAuth((s) => {
    if (!user) return undefined;
    const a = s.accounts.find((x) => x.id === user.id);
    return a?.remindByEmail ? a.remindEmail : undefined;
  });

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    checkDue(habits, email); // check immediately on mount / habit change
    const id = window.setInterval(() => checkDue(habits, email), 60_000);
    return () => window.clearInterval(id);
  }, [user, habits, email]);
}
