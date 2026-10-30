import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, MessageCircle } from 'lucide-react';
import { CONTACTS, KASPI_URL, PRICING, REGIONS } from '@/data/content/launch';
import { useLocale } from '@/i18n';
import { fmtKzt } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button, buttonVariants } from '@/components/ui';

/* Site forms. Every submission is emailed to CONTACTS.formsEmail through
   FormSubmit (the first submission sends the owner an activation email). */

export const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT || `https://formsubmit.co/ajax/${CONTACTS.formsEmail}`;
export const WHATSAPP_URL = `https://wa.me/${CONTACTS.whatsapp}`;
export const TELEGRAM_URL = `https://t.me/${CONTACTS.telegram}`;

export async function sendForm(subject: string, fields: Record<string, string>) {
  const res = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ _subject: subject, _template: 'table', _captcha: 'false', ...fields }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || String(body.success) === 'false') throw new Error(body.message ?? `HTTP ${res.status}`);
}

export type FormKind = 'apply' | 'question' | 'review' | 'region';
type Lang = 'ru' | 'kk';

const SPORTS = {
  ru: { run: 'Бег, 5–10 км', marathon: 'Полумарафон, марафон', trail: 'Трейл, ультра', triathlon: 'Триатлон', other: 'Другое' },
  kk: { run: 'Жүгіру, 5–10 км', marathon: 'Жартылай марафон, марафон', trail: 'Трейл, ультра', triathlon: 'Триатлон', other: 'Басқа' },
};

const COPY = {
  ru: {
    name: 'Имя', email: 'Email', contact: 'WhatsApp или Telegram', city: 'Город', sport: 'Вид спорта', plan: 'Тариф', comment: 'Комментарий',
    message: 'Ваш вопрос', review: 'Отзыв', regionRole: 'Как хотите участвовать',
    roles: { member: 'Участник чата', lead: 'Хочу вести чат города', club: 'Тренер или беговой клуб' },
    plans: {
      launch: `Первый поток: ${fmtKzt(PRICING.launch.firstMonthKzt)} за первый месяц`,
      month: `Подписка: ${fmtKzt(PRICING.monthlyKzt)} в месяц`,
      personal: `Персональное сопровождение: ${fmtKzt(PRICING.personalKzt)}`,
    },
    pick: 'Выберите…',
    consent: 'Согласен(на) с', offer: 'договором-офертой', and: 'и', privacy: 'политикой конфиденциальности',
    publish: 'Разрешаю опубликовать отзыв на сайте с именем и городом',
    submit: { apply: 'Отправить заявку', question: 'Отправить вопрос', review: 'Отправить отзыв', region: 'Отправить' },
    subject: { apply: 'Заявка на доступ', question: 'Вопрос с сайта', review: 'Отзыв', region: 'Сообщество региона' },
    sent: { apply: 'Заявка отправлена', question: 'Вопрос отправлен', review: 'Спасибо за отзыв!', region: 'Заявка отправлена' },
    sentText: {
      apply: 'Оплатите выбранный тариф через Kaspi. После оплаты мы пришлём код доступа на ваш email в течение 24 часов.',
      question: 'Мы ответим в WhatsApp, Telegram или на email.',
      review: 'Отзыв появится на сайте после модерации.',
      region: 'Мы добавим вас в чат города или свяжемся, когда он откроется.',
    },
    pay: 'Оплатить через Kaspi', payHint: 'В комментарии к платежу укажите ваш email.',
    error: 'Не получилось отправить форму. Напишите нам в WhatsApp или Telegram — ответим быстро.',
    required: 'Заполните обязательные поля и подтвердите согласие.',
  },
  kk: {
    name: 'Аты', email: 'Email', contact: 'WhatsApp немесе Telegram', city: 'Қала', sport: 'Спорт түрі', plan: 'Тариф', comment: 'Түсініктеме',
    message: 'Сұрағыңыз', review: 'Пікір', regionRole: 'Қалай қатысқыңыз келеді',
    roles: { member: 'Чат қатысушысы', lead: 'Қала чатын жүргізгім келеді', club: 'Жаттықтырушы немесе жүгіру клубы' },
    plans: {
      launch: `Бірінші ағын: алғашқы ай ${fmtKzt(PRICING.launch.firstMonthKzt)}`,
      month: `Жазылым: айына ${fmtKzt(PRICING.monthlyKzt)}`,
      personal: `Жеке сүйемелдеу: ${fmtKzt(PRICING.personalKzt)}`,
    },
    pick: 'Таңдаңыз…',
    consent: 'Келісемін:', offer: 'оферта шартымен', and: 'және', privacy: 'құпиялылық саясатымен',
    publish: 'Пікірімді атыммен және қаламмен сайтта жариялауға рұқсат етемін',
    submit: { apply: 'Өтінім жіберу', question: 'Сұрақ жіберу', review: 'Пікір жіберу', region: 'Жіберу' },
    subject: { apply: 'Заявка на доступ (KZ)', question: 'Вопрос с сайта (KZ)', review: 'Отзыв (KZ)', region: 'Сообщество региона (KZ)' },
    sent: { apply: 'Өтінім жіберілді', question: 'Сұрақ жіберілді', review: 'Пікіріңізге рақмет!', region: 'Өтінім жіберілді' },
    sentText: {
      apply: 'Таңдаған тарифті Kaspi арқылы төлеңіз. Төлемнен кейін 24 сағат ішінде email-ге қолжетімділік кодын жібереміз.',
      question: 'WhatsApp, Telegram немесе email арқылы жауап береміз.',
      review: 'Пікір модерациядан кейін сайтта шығады.',
      region: 'Сізді қала чатына қосамыз немесе ол ашылғанда хабарласамыз.',
    },
    pay: 'Kaspi арқылы төлеу', payHint: 'Төлемге түсініктемеде email-іңізді көрсетіңіз.',
    error: 'Форма жіберілмеді. WhatsApp немесе Telegram-ға жазыңыз — тез жауап береміз.',
    required: 'Міндетті өрістерді толтырып, келісімді растаңыз.',
  },
};

const FIELDS: Record<FormKind, string[]> = {
  apply: ['name', 'email', 'contact', 'city', 'sport', 'plan', 'comment'],
  question: ['name', 'contact', 'email', 'message'],
  review: ['name', 'city', 'sport', 'review'],
  region: ['name', 'contact', 'city', 'regionRole'],
};
const REQUIRED: Record<FormKind, string[]> = {
  apply: ['name', 'email', 'contact', 'city', 'plan'],
  question: ['name', 'contact', 'message'],
  review: ['name', 'review'],
  region: ['name', 'contact', 'city'],
};

const field = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-navy focus:border-teal focus:outline-none';

export function useLang(): Lang {
  return useLocale((s) => s.locale) === 'kk' ? 'kk' : 'ru';
}

export default function SiteForm({ kind, defaults = {}, className }: { kind: FormKind; defaults?: Record<string, string>; className?: string }) {
  const lang = useLang();
  const c = COPY[lang];
  const [v, setV] = useState<Record<string, string>>({ plan: 'launch', ...defaults });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error' | 'invalid'>('idle');
  const set = (k: string) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (v._honey) return;
    if (!consent || REQUIRED[kind].some((k) => !v[k]?.trim()) || (v.email && !/^\S+@\S+\.\S+$/.test(v.email))) { setState('invalid'); return; }
    setState('busy');
    const label = (k: string) => (c as unknown as Record<string, string>)[k] ?? k;
    const out: Record<string, string> = {};
    for (const k of FIELDS[kind]) {
      if (!v[k]) continue;
      out[label(k)] = k === 'sport' ? SPORTS[lang][v[k] as keyof typeof SPORTS.ru] : k === 'plan' ? c.plans[v[k] as keyof typeof c.plans] : k === 'regionRole' ? c.roles[v[k] as keyof typeof c.roles] : k === 'city' ? REGIONS.find((r) => r.id === v[k])?.ru ?? v[k] : v[k];
    }
    if (v.email) out._replyto = v.email;
    out['Язык'] = lang === 'kk' ? 'Қазақша' : 'Русский';
    out['Согласие'] = kind === 'review' ? 'Публикация отзыва разрешена' : 'Оферта и политика конфиденциальности приняты';
    try { await sendForm(`${c.subject[kind]}: ${v.name}`, out); setState('sent'); } catch { setState('error'); }
  }

  if (state === 'sent') {
    return (
      <div className={cn('rounded-3xl border border-line bg-white p-6 text-navy md:p-8', className)} data-testid={`form-${kind}-sent`}>
        <CheckCircle2 className="h-9 w-9 text-success" />
        <h3 className="mt-3 text-[20px] font-bold">{c.sent[kind]}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-navy-500">{c.sentText[kind]}</p>
        {kind === 'apply' && (
          <div className="mt-5">
            <a href={KASPI_URL} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })} data-testid="kaspi-pay"><CreditCard className="h-5 w-5" /> {c.pay}</a>
            <p className="mt-2 text-[13px] text-navy-500">{c.payHint}</p>
          </div>
        )}
      </div>
    );
  }

  const input = (k: string, type = 'text') => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-navy-700">{(c as unknown as Record<string, string>)[k]}{REQUIRED[kind].includes(k) && ' *'}</span>
      {k === 'city' ? (
        <select name={k} value={v[k] ?? ''} onChange={set(k)} className={field}>
          <option value="">{c.pick}</option>
          {REGIONS.map((r) => <option key={r.id} value={r.id}>{r[lang]}</option>)}
        </select>
      ) : k === 'sport' ? (
        <select name={k} value={v[k] ?? ''} onChange={set(k)} className={field}>
          <option value="">{c.pick}</option>
          {Object.entries(SPORTS[lang]).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
        </select>
      ) : k === 'plan' ? (
        <select name={k} value={v[k] ?? ''} onChange={set(k)} className={field}>
          {Object.entries(c.plans).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
        </select>
      ) : k === 'regionRole' ? (
        <select name={k} value={v[k] ?? 'member'} onChange={set(k)} className={field}>
          {Object.entries(c.roles).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
        </select>
      ) : k === 'message' || k === 'review' || k === 'comment' ? (
        <textarea name={k} value={v[k] ?? ''} onChange={set(k)} rows={3} className={cn(field, 'h-auto py-2.5')} />
      ) : (
        <input name={k} type={type} value={v[k] ?? ''} onChange={set(k)} className={field} autoComplete={k === 'name' ? 'name' : k === 'email' ? 'email' : undefined} />
      )}
    </label>
  );

  const fields = FIELDS[kind];
  const wide = new Set(['message', 'review', 'comment', 'plan']);
  return (
    <form onSubmit={submit} className={cn('rounded-3xl border border-line bg-white p-6 text-navy md:p-8', className)} data-testid={`form-${kind}`} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((k) => <div key={k} className={wide.has(k) ? 'sm:col-span-2' : undefined}>{input(k, k === 'email' ? 'email' : 'text')}</div>)}
      </div>
      <input name="_honey" value={v._honey ?? ''} onChange={set('_honey')} className="hidden" tabIndex={-1} autoComplete="off" />
      <label className="mt-4 flex items-start gap-2.5 text-[13px] leading-snug text-navy-500">
        <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal" />
        {kind === 'review'
          ? <span>{c.publish}</span>
          : <span>{c.consent} <Link to="/offer" target="_blank" className="font-semibold text-teal">{c.offer}</Link> {c.and} <Link to="/privacy" target="_blank" className="font-semibold text-teal">{c.privacy}</Link></span>}
      </label>
      {state === 'invalid' && <p className="mt-3 text-[13px] text-error">{c.required}</p>}
      {state === 'error' && (
        <p className="mt-3 text-[13px] text-error">
          {c.error} <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-semibold underline">WhatsApp</a> · <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="font-semibold underline">Telegram</a>
        </p>
      )}
      <Button type="submit" size="lg" loading={state === 'busy'} className="mt-5" data-testid={`form-${kind}-submit`}>
        {kind === 'question' && <MessageCircle className="h-5 w-5" />} {c.submit[kind]}
      </Button>
    </form>
  );
}
