import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Brain, CheckCircle2, ChevronDown, CreditCard, KeyRound, Lock, MessageCircle, Repeat, Send, ShieldCheck, Sparkles, Target, Telescope, Users,
} from 'lucide-react';
import { verifyAccessCode, isBrandPlan } from '@/data/access';
import { CONTACTS, KASPI_URL } from '@/data/content/launch';
import { fmtKzt } from '@/lib/format';
import { cn } from '@/lib/cn';
import SiteForm, { TELEGRAM_URL, WHATSAPP_URL } from '@/features/forms/SiteForm';
import { FREE_STEPS, PACKAGES, SEGMENTS, STEPS, label, options, type Question, type Segment } from './content';
import { buildReport, mergeAi, type AiPatch, type Answers, type Report } from './generate';
import ReportView from './Report';

/* FAB3D Brand: personal-brand unpacking. Served at /brand and on the
   brand.* subdomain. Answers live only in this tab's memory: nothing is
   written to storage or sent anywhere except the optional AI pass. */

type Access = { code: string; email: string; plan: string; until: number };
const SESSION = 'fab3d-brand-code'; // only the access code, never the answers

const METHODS = [
  { icon: BadgeCheck, title: 'Сильные стороны', source: 'Gallup', text: 'Растём через то, что получается лучше всего, а не только через исправление слабостей.' },
  { icon: Users, title: 'Вы на высоте', source: 'Harvard Business Review', text: 'Reflected Best Self: ваша ценность глазами коллег и друзей — самое точное зеркало.' },
  { icon: Target, title: 'Точка А → Б и KPI', source: 'SMART, OKR', text: 'Цель с числом и сроком, помесячные ориентиры и еженедельные действия.' },
  { icon: Telescope, title: 'Ценность и позиционирование', source: 'Value Proposition Canvas, Ries & Trout, Moore', text: 'Боли аудитории, ваш результат и чем вы отличаетесь от альтернатив.' },
  { icon: Repeat, title: 'Кайдзен', source: 'Масааки Имаи, Роберт Маурер', text: 'Маленькие ежедневные шаги вместо рывков: 15 минут в день, которые не страшно начать.' },
  { icon: Brain, title: 'ИИ-продюсер', source: 'FAB3D Brand', text: 'Собирает ответы в позиционирование, оффер, био, контент-план и план на 90 дней.' },
];

const FAQ = [
  ['Кому подходит?', 'Топ-менеджерам, экспертам, предпринимателям, студентам и подросткам 14–17 лет. Вопросы и советы подстраиваются под каждую группу. За подростков заявку и оплату оформляют родители.'],
  ['Это заменит продюсера и маркетолога?', 'Распаковка делает то, с чего начинают продюсер, маркетолог, SMM-специалист и коуч: цели, позиционирование, оффер, контент-план. В пакетах «Про» и «Продюсер» к этому добавляется работа с живым специалистом.'],
  ['Что с моими ответами?', 'Ничего не сохраняется: ни на сервере, ни в браузере. Отчёт вы скачиваете сами в PDF или текстом. Для улучшения текстов ответы один раз передаются ИИ-модели и не хранятся у нас.'],
  ['Как оплатить?', 'Через Kaspi Pay. В комментарии к платежу укажите email и номер телефона — в течение 24 часов на почту придёт ссылка с кодом доступа. Для клиентов из СНГ напишите нам в WhatsApp или Telegram — подскажем способ оплаты.'],
  ['Можно попробовать бесплатно?', `Да: первые ${FREE_STEPS} шага (кто вы, точка А, точка Б и KPI) бесплатны — вы сразу увидите мини-разбор и главный фокус.`],
];

const fieldCls = 'w-full rounded-xl border border-[#E6E1F5] bg-white px-3.5 text-[15px] text-[#14112B] focus:border-[#6D4AFF] focus:outline-none focus:ring-2 focus:ring-[#6D4AFF]/15';

function Pill({ on, children, onClick, testid }: { on: boolean; children: React.ReactNode; onClick: () => void; testid?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} data-testid={testid}
      className={cn('rounded-full px-3.5 py-2 text-[14px] font-semibold transition-colors', on ? 'bg-[#6D4AFF] text-white' : 'bg-white text-[#2A2540] ring-1 ring-[#E6E1F5] hover:ring-[#6D4AFF]')}>
      {children}
    </button>
  );
}

function Field({ q, seg, value, onChange }: { q: Question; seg: Segment; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const l = label(q.label, seg);
  const hint = label(q.hint, seg);
  let input: React.ReactNode;
  if (q.id === 'segment') {
    input = (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SEGMENTS.map((s) => (
          <button key={s.id} type="button" onClick={() => onChange(s.id)} aria-pressed={value === s.id} data-testid={`seg-${s.id}`}
            className={cn('rounded-2xl p-4 text-left ring-1 transition-colors', value === s.id ? 'bg-[#F0ECFF] ring-2 ring-[#6D4AFF]' : 'bg-white ring-[#E6E1F5] hover:ring-[#6D4AFF]')}>
            <div className="font-bold">{s.title}</div><div className="mt-0.5 text-[13px] text-[#7C7699]">{s.text}</div>
          </button>
        ))}
      </div>
    );
  } else if (q.kind === 'choice') {
    input = <div className="flex flex-wrap gap-2">{options(q, seg).map((o) => <Pill key={o} on={value === o} onClick={() => onChange(o)}>{o}</Pill>)}</div>;
  } else if (q.kind === 'multi') {
    const arr = Array.isArray(value) ? value : [];
    input = (
      <div className="flex flex-wrap gap-2">
        {options(q, seg).map((o) => {
          const on = arr.includes(o);
          return <Pill key={o} on={on} onClick={() => onChange(on ? arr.filter((x) => x !== o) : q.max && arr.length >= q.max ? arr : [...arr, o])}>{o}</Pill>;
        })}
      </div>
    );
  } else if (q.kind === 'textarea') {
    input = <textarea name={q.id} rows={3} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cn(fieldCls, 'py-2.5')} />;
  } else {
    input = <input name={q.id} type={q.kind === 'number' ? 'number' : 'text'} inputMode={q.kind === 'number' ? 'numeric' : undefined} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cn(fieldCls, 'h-11')} />;
  }
  return (
    <div>
      <div className="mb-2 text-[15px] font-semibold text-[#14112B]">{l}{q.required && <span className="text-[#6D4AFF]"> *</span>}{q.max && <span className="ml-2 text-[12.5px] font-normal text-[#7C7699]">до {q.max}</span>}</div>
      {input}
      {hint && <p className="mt-1.5 text-[13px] text-[#7C7699]">{hint}</p>}
    </div>
  );
}

function CodeForm({ onAccess, initial }: { onAccess: (a: Access) => void; initial?: { email?: string; code?: string } }) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [err, setErr] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    const g = await verifyAccessCode(code);
    if (!g || !isBrandPlan(g.plan)) return setErr('Код не подошёл. Проверьте, что скопировали его полностью.');
    if (g.email !== email.trim().toLowerCase()) return setErr('Этот код выдан на другой email.');
    if (g.until < Date.now()) return setErr('Срок действия кода истёк. Напишите нам для продления.');
    onAccess({ code: code.trim(), email: g.email, plan: g.plan, until: g.until });
  }
  return (
    <form onSubmit={submit} className="space-y-3" data-testid="brand-code-form">
      <input name="email" type="email" placeholder="Email из письма" value={email} onChange={(e) => setEmail(e.target.value)} className={cn(fieldCls, 'h-11')} />
      <textarea name="code" rows={2} placeholder="Код доступа" value={code} onChange={(e) => setCode(e.target.value)} className={cn(fieldCls, 'py-2 font-mono text-[12px]')} />
      {err && <p className="text-[13px] text-[#E4572E]" data-testid="brand-code-error">{err}</p>}
      <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#14112B] px-5 font-semibold text-white"><KeyRound className="h-4 w-4" /> Открыть доступ</button>
    </form>
  );
}

function Packages({ onApply, compact }: { onApply: (id: string) => void; compact?: boolean }) {
  return (
    <div className={cn('grid grid-cols-1 gap-5', compact ? 'md:grid-cols-3 md:gap-3' : 'lg:grid-cols-3')}>
      {PACKAGES.map((p, i) => (
        <div key={p.id} className={cn('flex flex-col rounded-3xl', compact ? 'p-5' : 'p-7', i === 1 ? 'bg-[#14112B] text-white shadow-2xl' : 'bg-white ring-1 ring-[#E6E1F5]')} data-testid={`brand-pack-${p.id}`}>
          <div className={cn('text-[14px] font-bold', i === 1 ? 'text-[#FFB547]' : 'text-[#6D4AFF]')}>{p.name} · {p.note}</div>
          <div className={cn('mt-2 whitespace-nowrap font-extrabold tracking-tight', compact ? 'text-[26px]' : 'text-[40px]')} data-testid="brand-price">{fmtKzt(p.priceKzt)}</div>
          <ul className="mt-4 flex-1 space-y-2 text-[14.5px]">
            {p.points.map((x) => <li key={x} className="flex gap-2.5"><CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', i === 1 ? 'text-[#FFB547]' : 'text-[#6D4AFF]')} />{x}</li>)}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={KASPI_URL} target="_blank" rel="noreferrer" className={cn('inline-flex h-11 items-center gap-2 rounded-xl px-4 font-semibold', i === 1 ? 'bg-[#FFB547] text-[#14112B]' : 'bg-[#6D4AFF] text-white')} data-testid={`brand-kaspi-${p.id}`}><CreditCard className="h-4 w-4" /> Kaspi Pay</a>
            <button type="button" onClick={() => onApply(p.id)} className={cn('inline-flex h-11 items-center rounded-xl px-4 font-semibold', i === 1 ? 'bg-white/10 text-white' : 'bg-[#F0ECFF] text-[#3B2A8C]')} data-testid={`brand-apply-${p.id}`}>Заявка</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BrandApp() {
  const base = location.hostname.startsWith('brand.') ? '/' : `${import.meta.env.BASE_URL}brand/`;
  const [view, setView] = useState<'landing' | 'wizard' | 'report'>('landing');
  const [access, setAccess] = useState<Access | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState(false);
  const [aiOn, setAiOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [applyPack, setApplyPack] = useState('start');
  const params = useMemo(() => new URLSearchParams(location.search), []);
  const seg = ((answers.segment as string) || 'expert') as Segment;

  useEffect(() => { document.title = 'FAB3D Brand — AI-распаковка личного бренда'; }, []);
  // Access from the emailed link, or from this tab's session.
  useEffect(() => {
    const code = params.get('code') ?? (() => { try { return sessionStorage.getItem(SESSION); } catch { return null; } })();
    if (!code) return;
    verifyAccessCode(code).then((g) => {
      if (!g || !isBrandPlan(g.plan) || g.until < Date.now()) return;
      if (params.get('email') && params.get('email')!.toLowerCase() !== g.email) return;
      grant({ code, email: g.email, plan: g.plan, until: g.until });
      if (params.get('code')) { history.replaceState(null, '', base); setView('wizard'); }
    });
  }, [params, base]);
  // Warn before leaving with unsaved answers.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (Object.keys(answers).length) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [answers]);
  useEffect(() => { window.scrollTo(0, 0); }, [view, step]);

  function grant(a: Access) {
    setAccess(a);
    try { sessionStorage.setItem(SESSION, a.code); } catch { /* storage blocked: access lasts for this page */ }
  }

  const current = STEPS[step];
  const visible = current?.questions ?? [];
  const locked = !access && step >= FREE_STEPS;

  function next() {
    const lacks = visible.some((q) => q.required && (Array.isArray(answers[q.id]) ? !(answers[q.id] as string[]).length : !String(answers[q.id] ?? '').trim()));
    if (lacks) { setMissing(true); return; }
    setMissing(false);
    if (step < STEPS.length - 1) setStep(step + 1); else void finish();
  }

  async function finish() {
    setBusy(true);
    let r = buildReport(answers);
    if (aiOn && access) {
      try {
        const { name: _name, ...rest } = answers;
        const res = await fetch('/api/brand-unpack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: access.code, answers: rest, draft: { ...r, name: undefined } }) });
        if (res.ok) { const { patch } = (await res.json()) as { patch: AiPatch }; r = mergeAi(r, patch ?? {}); }
      } catch { /* AI unavailable: keep the local report */ }
    }
    setReport(r);
    setBusy(false);
    setView('report');
  }

  const Header = (
    <header className="no-print sticky top-0 z-30 border-b border-white/10 bg-[#14112B]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:px-8">
        <button onClick={() => setView('landing')} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#6D4AFF] to-[#FFB547]"><Sparkles className="h-5 w-5" /></span>
          <span className="leading-tight text-left"><b className="block text-[15px]">FAB3D Brand</b><span className="hidden text-[11px] text-white/60 sm:block">AI-распаковка личного бренда</span></span>
        </button>
        <nav className="ml-auto hidden items-center gap-5 text-sm text-white/70 md:flex">
          <a href="#how" onClick={() => setView('landing')} className="hover:text-white">Как это работает</a>
          <a href="#packages" onClick={() => setView('landing')} className="hover:text-white">Пакеты</a>
          <a href="#faq" onClick={() => setView('landing')} className="hover:text-white">Вопросы</a>
        </nav>
        <button onClick={() => { setView('wizard'); }} className="ml-auto whitespace-nowrap rounded-xl bg-[#6D4AFF] px-4 py-2 text-sm font-semibold md:ml-0" data-testid="brand-start-top">{access ? 'Продолжить' : <><span className="sm:hidden">Начать</span><span className="hidden sm:inline">Начать бесплатно</span></>}</button>
      </div>
    </header>
  );

  if (view === 'report' && report) {
    return <div className="min-h-screen bg-[#F7F5FD]">{Header}<ReportView r={report} onRestart={() => { setAnswers({}); setStep(0); setReport(null); setView('wizard'); }} /></div>;
  }

  if (view === 'wizard') {
    const progress = Math.round((step / STEPS.length) * 100);
    return (
      <div className="min-h-screen bg-[#F7F5FD] text-[#14112B]" data-testid="brand-wizard">
        {Header}
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          <div className="mb-2 flex items-center justify-between text-[13px] text-[#7C7699]"><span>Шаг {step + 1} из {STEPS.length} · {current.method}</span><span>{progress}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E6E1F5]"><div className="h-full rounded-full bg-gradient-to-r from-[#6D4AFF] to-[#FFB547] transition-all" style={{ width: `${progress}%` }} /></div>

          {locked ? (
            <div className="mt-6 space-y-5" data-testid="brand-teaser">
              <Teaser answers={answers} />
              <div className="rounded-3xl bg-white p-6 ring-1 ring-[#E6E1F5] md:p-8">
                <div className="flex items-center gap-2 text-[18px] font-bold"><Lock className="h-5 w-5 text-[#6D4AFF]" /> Дальше — полная распаковка</div>
                <p className="mt-2 text-[15px] text-[#5C5677]">Сильные стороны, ваша ценность глазами других, аудитория, позиционирование, оффер и кайдзен-план. В конце — отчёт с био, контент-планом на 30 дней, KPI и планом на 90 дней.</p>
                <div className="mt-5"><Packages compact onApply={(id) => { setApplyPack(id); setView('landing'); setTimeout(() => document.getElementById('apply')?.scrollIntoView(), 50); }} /></div>
                <div className="mt-6 border-t border-[#E6E1F5] pt-5"><div className="mb-3 font-semibold">Уже оплатили? Введите код из письма</div><CodeForm onAccess={grant} /></div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-[#E6E1F5] md:p-8">
              <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6D4AFF]">{current.method}</div>
              <h1 className="mt-1 text-[28px] font-extrabold">{current.title}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5C5677]">{label(current.intro, seg)}</p>
              <div className="mt-6 space-y-6">
                {visible.map((q) => <Field key={q.id} q={q} seg={seg} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />)}
              </div>
              {step === STEPS.length - 1 && access && (
                <label className="mt-6 flex items-start gap-2.5 rounded-2xl bg-[#F6F4FC] p-4 text-[13.5px] text-[#5C5677]">
                  <input type="checkbox" checked={aiOn} onChange={(e) => setAiOn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6D4AFF]" data-testid="brand-ai" />
                  Улучшить тексты с помощью ИИ. Ответы один раз передаются ИИ-модели для обработки и нигде у нас не сохраняются. Без галочки отчёт соберётся прямо в браузере.
                </label>
              )}
              {missing && <p className="mt-4 text-[13.5px] text-[#E4572E]">Заполните поля со звёздочкой.</p>}
              <div className="mt-7 flex items-center justify-between gap-3">
                <button type="button" onClick={() => (step ? setStep(step - 1) : setView('landing'))} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#7C7699]"><ArrowLeft className="h-4 w-4" /> Назад</button>
                <button type="button" onClick={next} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6D4AFF] px-6 font-semibold text-white disabled:opacity-60" data-testid="brand-next">
                  {step === STEPS.length - 1 ? (busy ? 'Собираем отчёт…' : 'Получить распаковку') : 'Дальше'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {access && <p className="mt-4 text-center text-[12.5px] text-[#7C7699]">Доступ до {new Date(access.until).toLocaleDateString('ru-RU')} · {PACKAGES.find((p) => p.plan === access.plan)?.name}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FD] text-[#14112B]" data-testid="brand-landing">
      {Header}
      <section className="relative overflow-hidden bg-[#14112B] text-white">
        <div className="pointer-events-none absolute -right-40 -top-20 h-[520px] w-[520px] rounded-full bg-[#6D4AFF]/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#FFB547]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold text-[#FFB547]"><Sparkles className="h-4 w-4" /> ИИ-продюсер, маркетолог и коуч в одном</div>
          <h1 className="mt-5 max-w-4xl text-[38px] font-extrabold leading-[1.05] tracking-tight md:text-[60px]">Распакуйте личный бренд за 40 минут</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/75">Точка А → точка Б, сильные стороны, позиционирование, оффер, био, контент-план и KPI. По лучшим мировым подходам — Gallup, Harvard Business Review, кайдзен — и под вашу ситуацию: топ-менеджер, эксперт, предприниматель, студент или подросток.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setView('wizard')} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6D4AFF] px-6 font-semibold" data-testid="brand-start">Начать бесплатно <ArrowRight className="h-4 w-4" /></button>
            <a href="#packages" className="inline-flex h-12 items-center rounded-xl bg-white/10 px-6 font-semibold">Пакеты от {fmtKzt(PACKAGES[0].priceKzt)}</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/70">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#FFB547]" /> Ответы не сохраняются</span>
            <span className="flex items-center gap-2"><Target className="h-4 w-4 text-[#FFB547]" /> Измеримый KPI</span>
            <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#FFB547]" /> Казахстан и СНГ</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6D4AFF]">Для кого</div>
        <h2 className="mt-2 text-[30px] font-bold md:text-[38px]">Пять сценариев — свои вопросы и советы</h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SEGMENTS.map((s) => <div key={s.id} className="rounded-3xl bg-white p-5 ring-1 ring-[#E6E1F5]"><div className="font-bold">{s.title}</div><p className="mt-1.5 text-[13.5px] text-[#7C7699]">{s.text}</p></div>)}
        </div>
      </section>

      <section id="how" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6D4AFF]">Как это работает</div>
          <h2 className="mt-2 text-[30px] font-bold md:text-[38px]">Лучшие практики мира — в одном разборе</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METHODS.map(({ icon: I, title, source, text }) => (
              <div key={title} className="rounded-3xl bg-[#F7F5FD] p-6">
                <I className="h-6 w-6 text-[#6D4AFF]" />
                <div className="mt-3 text-[17px] font-bold">{title}</div>
                <div className="text-[12.5px] font-semibold text-[#B07A00]">{source}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5C5677]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-[#14112B] p-6 text-white md:p-8">
            <div className="text-[17px] font-bold">Что будет в отчёте</div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-[14.5px] sm:grid-cols-2 lg:grid-cols-3">
              {['Точка А → Б и KPI по месяцам', 'Суперсила и сильные стороны', 'Позиционирование по формуле Мура', 'Ценностное предложение: боли → результат', 'Оффер с призывом к действию', 'Био для Instagram, LinkedIn, Telegram', '4 рубрики контента', 'Контент-план на 30 дней', 'Куда давить и чего не делать', 'План на 90 дней по шагам кайдзен', 'Еженедельные действия для KPI', 'PDF и текст для скачивания'].map((x) => <span key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB547]" />{x}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section id="packages" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-16 md:px-8">
        <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6D4AFF]">Пакеты</div>
        <h2 className="mt-2 text-[30px] font-bold md:text-[38px]">Три пакета — от самостоятельной распаковки до продюсера</h2>
        <p className="mt-2 max-w-3xl text-[15px] text-[#5C5677]">Оплата через Kaspi Pay. В комментарии к платежу укажите <b>email и номер телефона</b> — в течение 24 часов на почту придёт ссылка с кодом доступа. Клиентам из СНГ поможем с оплатой в WhatsApp или Telegram.</p>
        <div className="mt-8"><Packages onApply={(id) => { setApplyPack(id); document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' }); }} /></div>
        <div id="apply" className="mt-10 grid scroll-mt-20 grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h3 className="text-[22px] font-bold">Заявка и оплата</h3>
            <ol className="mt-4 space-y-3 text-[15px]">
              {['Оставьте заявку — она придёт нам на почту', 'Оплатите через Kaspi Pay, в комментарии — email и телефон', 'Получите ссылку с кодом на почту и пройдите распаковку'].map((x, i) => <li key={x} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#14112B] text-[14px] font-bold text-white">{i + 1}</span>{x}</li>)}
            </ol>
            <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-[#E6E1F5]"><div className="mb-3 font-semibold">Уже есть код?</div><CodeForm onAccess={(a) => { grant(a); setView('wizard'); }} initial={{ email: params.get('email') ?? '' }} /></div>
          </div>
          <SiteForm key={applyPack} kind="brand" defaults={{ brandPackage: applyPack }} />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
          <div className="flex items-start gap-4 rounded-3xl bg-[#F0ECFF] p-6 md:p-8">
            <ShieldCheck className="h-8 w-8 shrink-0 text-[#6D4AFF]" />
            <div><div className="text-[18px] font-bold">Ваши ответы — только ваши</div><p className="mt-1.5 text-[15px] leading-relaxed text-[#3B2A8C]">Мы не создаём аккаунт и не храним ответы: ни на сервере, ни в браузере. Отчёт вы скачиваете сами в PDF или текстом. Для улучшения текстов ответы один раз передаются ИИ-модели и не сохраняются у нас. Это можно отключить — тогда отчёт соберётся прямо на вашем устройстве.</p></div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl scroll-mt-16 px-5 py-16 md:px-8">
        <h2 className="text-[30px] font-bold">Частые вопросы</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl bg-white px-5 py-4 ring-1 ring-[#E6E1F5]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">{q}<ChevronDown className="h-5 w-5 shrink-0 text-[#7C7699] transition-transform group-open:rotate-180" /></summary>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5C5677]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="bg-[#14112B] text-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-10 text-[13px] md:px-8">
          <span className="font-semibold text-white">FAB3D Brand · SB dev</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-white" data-testid="brand-whatsapp">WhatsApp +{CONTACTS.whatsapp}</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white"><Send className="h-3.5 w-3.5" /> @{CONTACTS.telegram}</a>
          <Link to="/brand-offer" className="hover:text-white" data-testid="brand-offer-link">Договор-оферта</Link>
          <Link to="/privacy" className="hover:text-white">Конфиденциальность</Link>
          <a href={base === '/' ? 'https://fab3d-scan.com' : `${import.meta.env.BASE_URL}`} className="hover:text-white">FAB3D Academy</a>
        </div>
      </footer>
    </div>
  );
}

/** Free mini result after the first steps. */
function Teaser({ answers }: { answers: Answers }) {
  const r = buildReport(answers);
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#14112B] to-[#3B2A8C] p-6 text-white md:p-8">
      <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#FFB547]">Мини-разбор</div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-4"><div className="text-[12px] text-white/60">Точка А</div><p className="mt-1 text-[14.5px]">{r.pointA}</p></div>
        <div className="rounded-2xl bg-white/10 p-4"><div className="text-[12px] text-white/60">Точка Б</div><p className="mt-1 text-[14.5px]">{r.pointB}</p></div>
      </div>
      <p className="mt-4 text-[15px]">KPI «{r.kpi.name}»: <b>{r.kpi.now} → {r.kpi.target}</b> за {r.kpi.horizon} мес. Ориентир через месяц — <b>{r.kpi.months[1]?.value}</b>.</p>
      <p className="mt-3 rounded-2xl bg-white/10 p-4 text-[15px]" data-testid="brand-teaser-focus"><b className="text-[#FFB547]">Главный фокус:</b> {r.focus[0]}</p>
      <p className="mt-3 text-[14px] text-white/80">Еженедельно: {r.leading[0]}; {r.leading[1]}.</p>
    </div>
  );
}
