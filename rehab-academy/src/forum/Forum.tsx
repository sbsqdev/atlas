import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, Award, Bone, Bot, Building2, CheckCircle2, GraduationCap, Handshake, Loader2, MessageCircle, Rotate3d, ScanLine, Send, Sparkles,
} from 'lucide-react';
import { ANATOMY_MODELS, STRUCTURE_BY_ID } from '@/data/content/anatomy';
import { CONTACTS } from '@/data/content/launch';
import { EXERCISE_BY_ID } from '@/features/exercises/library';
import { sendForm, TELEGRAM_URL, WHATSAPP_URL, whatsappWith } from '@/features/forms/SiteForm';
import { cn } from '@/lib/cn';
import { ANATOMY_PICKS, COPY, EXERCISE_NAMES, FORUM_LANGS, SCENARIOS, SIM_EXERCISES, type ForumLang, type Scenario } from './copy';

/* Event landing for the MedTech forum: who we are, three open demos
   (3D anatomy, movement simulation, AI agents) and a lead form that goes to
   the owner's email. No accounts, nothing stored in the browser. */

const AnatomyViewer = lazy(() => import('@/features/anatomy/AnatomyViewer').then((m) => ({ default: m.AnatomyViewer })));
const ExercisePlayer = lazy(() => import('@/features/exercises/ExercisePlayer'));

function initialLang(): ForumLang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'ru' || q === 'uz') return q;
  const n = navigator.language.toLowerCase();
  return n.startsWith('uz') ? 'uz' : n.startsWith('ru') || n.startsWith('kk') ? 'ru' : 'en';
}

const Spinner = () => <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-teal" /></div>;

function Section({ id, title, children, className }: { id?: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-18">
        <h2 className="text-[28px] font-bold leading-tight tracking-tight md:text-[36px]">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export default function Forum() {
  const [lang, setLang] = useState<ForumLang>(initialLang);
  const t = (x: Record<ForumLang, string>) => x[lang];
  // Demo state shared by the anatomy, simulation and agent blocks.
  const [model, setModel] = useState<'knee' | 'foot'>('knee');
  const [selected, setSelected] = useState<string | null>('patella');
  const [exercise, setExercise] = useState('chair-squat');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [agentStep, setAgentStep] = useState(0);

  useEffect(() => { document.documentElement.lang = lang; document.title = 'FAB3D AI · MedTech Forum'; }, [lang]);
  useEffect(() => {
    if (!scenario) return;
    setAgentStep(0);
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setAgentStep(n), n * 650));
    return () => timers.forEach(clearTimeout);
  }, [scenario]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const structure = selected ? STRUCTURE_BY_ID[selected] : null;
  const picks = useMemo(() => ANATOMY_PICKS[model].filter((id) => ANATOMY_MODELS[model].ids.includes(id)), [model]);
  const exName = (id: string) => EXERCISE_NAMES[id]?.[lang] ?? EXERCISE_BY_ID[id]?.ru.title ?? id;

  function showIn3d(s: Scenario) {
    if (!s.model) return;
    setModel(s.model);
    setSelected(s.structures[0] ?? null);
    go('anatomy');
  }
  function showSim(id: string) {
    setExercise(id);
    go('simulation');
  }

  return (
    <div className="min-h-screen bg-white text-navy" data-testid="forum" lang={lang}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan"><Activity className="h-5 w-5" strokeWidth={2.4} /></span>
            <b className="text-[16px]">FAB3D AI</b>
          </a>
          <nav className="ml-auto hidden items-center gap-5 text-sm text-navy-300 md:flex">
            <a href="#anatomy" className="hover:text-white">{t(COPY.nav.demo)}</a>
            <a href="#agents" className="hover:text-white">{t(COPY.nav.agents)}</a>
            <a href="#partners" className="hover:text-white">{t(COPY.nav.partners)}</a>
            <a href="#contact" className="hover:text-white">{t(COPY.nav.contact)}</a>
          </nav>
          <div className="ml-auto flex rounded-full bg-white/10 p-0.5 text-[12px] font-bold md:ml-0" data-testid="forum-lang">
            {FORUM_LANGS.map((l) => (
              <button key={l.id} type="button" onClick={() => setLang(l.id)} aria-pressed={lang === l.id}
                className={cn('rounded-full px-3 py-1', lang === l.id ? 'bg-white text-navy' : 'text-white/70 hover:text-white')}>{l.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-teal/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:pb-20 md:pt-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-semibold text-cyan"><Sparkles className="h-4 w-4" /> {t(COPY.badge)}</div>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] tracking-tight md:text-[52px]" data-testid="forum-title">{t(COPY.title)}</h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-navy-300">{t(COPY.sub)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => go('contact')} className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal px-6 font-semibold" data-testid="forum-cta">{t(COPY.ctaContact)} <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => go('anatomy')} className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 px-6 font-semibold hover:bg-white/10"><Rotate3d className="h-4 w-4" /> {t(COPY.ctaDemo)}</button>
            </div>
          </div>
          <img src={`${import.meta.env.BASE_URL}landing/body.webp`} alt="" className="mx-auto h-[340px] object-contain drop-shadow-[0_30px_60px_rgba(8,127,140,0.45)] md:h-[460px]" />
        </div>
      </section>

      {/* What we do */}
      <Section title={t(COPY.whatTitle)} className="bg-bg">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COPY.what.map((w, i) => {
            const I = [Bone, Rotate3d, Bot, ScanLine][i];
            return (
              <div key={w.title.en} className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                <I className="h-7 w-7 text-teal" />
                <h3 className="mt-3 text-[18px] font-bold">{t(w.title)}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-500">{t(w.text)}</p>
                {'soon' in w && <span className="mt-3 inline-block rounded-full bg-[#FFF4D6] px-2.5 py-0.5 text-[12px] font-semibold text-[#7A5410]">R&amp;D</span>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Demo 1: 3D anatomy */}
      <Section id="anatomy" title={t(COPY.anatomyTitle)}>
        <p className="-mt-4 mb-5 max-w-3xl text-[15px] text-navy-500">{t(COPY.anatomyHint)}</p>
        <div className="mb-4 flex gap-2">
          {(['knee', 'foot'] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setModel(m); setSelected(ANATOMY_PICKS[m][0]); }} aria-pressed={model === m} data-testid={`forum-model-${m}`}
              className={cn('rounded-full px-4 py-2 text-[14px] font-semibold', model === m ? 'bg-navy text-white' : 'bg-bg text-navy-700')}>{t(COPY[m])}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="h-[420px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#EEF4F8] to-[#DCE7EF] md:h-[520px]">
            <Suspense fallback={<Spinner />}>
              <AnatomyViewer model={model} selected={selected} onPick={setSelected} className="h-full w-full" loadingText={t(COPY.loading)} errorText={t(COPY.loadError)} />
            </Suspense>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl border border-line p-5" data-testid="forum-structure">
              {structure ? (
                <>
                  <div className="text-[12px] font-bold uppercase tracking-wider text-teal">{COPY.groups[structure.group]?.[lang]}</div>
                  <div className="mt-1 text-[20px] font-bold">{structure.latin}</div>
                  {lang === 'ru' && <div className="text-[15px] text-navy-700">{structure.name}</div>}
                  {lang === 'ru' && <p className="mt-2 line-clamp-4 text-[13.5px] leading-relaxed text-navy-500">{structure.function}</p>}
                </>
              ) : <div className="text-navy-500">{t(COPY.pick)}</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              {picks.map((id) => (
                <button key={id} type="button" onClick={() => setSelected(id)} data-testid={`forum-struct-${id}`}
                  className={cn('rounded-full px-3 py-1.5 text-[13px] font-semibold', selected === id ? 'bg-teal text-white' : 'bg-bg text-navy-700 hover:bg-teal-50')}>
                  {lang === 'ru' ? STRUCTURE_BY_ID[id].name : STRUCTURE_BY_ID[id].latin}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Demo 2: simulation */}
      <Section id="simulation" title={t(COPY.simTitle)} className="bg-bg">
        <p className="-mt-4 mb-5 max-w-3xl text-[15px] text-navy-500">{t(COPY.simHint)}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {SIM_EXERCISES.map((id) => (
            <button key={id} type="button" onClick={() => setExercise(id)} aria-pressed={exercise === id} data-testid={`forum-ex-${id}`}
              className={cn('rounded-full px-4 py-2 text-[14px] font-semibold', exercise === id ? 'bg-navy text-white' : 'bg-white text-navy-700 ring-1 ring-line')}>{exName(id)}</button>
          ))}
          {!SIM_EXERCISES.includes(exercise) && <span className="rounded-full bg-navy px-4 py-2 text-[14px] font-semibold text-white">{exName(exercise)}</span>}
        </div>
        <Suspense fallback={<div className="h-[440px] rounded-2xl bg-white"><Spinner /></div>}>
          <ExercisePlayer ex={EXERCISE_BY_ID[exercise]} lang={lang} className="h-[380px] md:h-[480px]" />
        </Suspense>
      </Section>

      {/* Demo 3: AI agents */}
      <Section id="agents" title={t(COPY.agentsTitle)}>
        <p className="-mt-4 mb-5 max-w-3xl text-[15px] text-navy-500">{t(COPY.agentsHint)}</p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-2">
            {SCENARIOS.map((s) => (
              <button key={s.id} type="button" onClick={() => setScenario(s)} data-testid={`forum-scenario-${s.id}`}
                className={cn('flex items-start gap-3 rounded-2xl border p-4 text-left text-[14.5px] font-semibold', scenario?.id === s.id ? 'border-teal bg-teal-50' : 'border-line hover:border-teal')}>
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {t(s.ask)}
              </button>
            ))}
          </div>
          <div className="min-h-[320px] rounded-3xl bg-navy p-6 text-white md:p-8" data-testid="forum-agent">
            {!scenario ? (
              <div className="grid h-full place-items-center text-center text-navy-300"><div><Bot className="mx-auto h-10 w-10 text-cyan" /><p className="mt-3">{t(COPY.agentsHint).split('.')[0]}.</p></div></div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-cyan"><Bot className="h-4 w-4" /> {scenario.brand ? 'FAB3D Brand' : 'Rehab navigator'}</div>
                <p className="mt-2 text-[17px] font-semibold">«{t(scenario.ask)}»</p>
                <ol className="mt-5 space-y-2">
                  {COPY.agentSteps.map((st, i) => (
                    <li key={st.en} className={cn('flex items-center gap-2.5 text-[14px] transition-opacity', agentStep > i ? 'opacity-100' : 'opacity-40')}>
                      {agentStep > i ? <CheckCircle2 className="h-4 w-4 text-cyan" /> : <Loader2 className="h-4 w-4 animate-spin" />} {t(st)}
                    </li>
                  ))}
                </ol>
                {agentStep >= 4 && (
                  <div className="mt-6 space-y-4 border-t border-white/10 pt-5" data-testid="forum-agent-result">
                    <div className="text-[18px] font-bold text-cyan">{t(scenario.region)}</div>
                    {scenario.structures.length > 0 && (
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-wider text-navy-300">{t(COPY.agentAnatomy)}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {scenario.structures.map((id) => <span key={id} className="rounded-full bg-white/10 px-3 py-1 text-[13px]">{lang === 'ru' ? STRUCTURE_BY_ID[id].name : STRUCTURE_BY_ID[id].latin}</span>)}
                          <button type="button" onClick={() => showIn3d(scenario)} className="rounded-full bg-teal px-3 py-1 text-[13px] font-semibold" data-testid="forum-agent-3d">{t(COPY.showIn3d)} →</button>
                        </div>
                      </div>
                    )}
                    {scenario.exercises.length > 0 && (
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-wider text-navy-300">{t(COPY.agentExercises)}</div>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {scenario.exercises.map((id) => <button key={id} type="button" onClick={() => showSim(id)} className="rounded-full bg-white/10 px-3 py-1 text-[13px] hover:bg-white/20" data-testid={`forum-agent-ex-${id}`}>{exName(id)} ▶</button>)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-wider text-navy-300">{t(COPY.agentPlan)}</div>
                      <p className="mt-1 text-[14.5px] leading-relaxed">{t(scenario.plan)}</p>
                    </div>
                    {scenario.brand && <Link to="/brand#demo" className="inline-flex h-10 items-center rounded-xl bg-teal px-4 text-[14px] font-semibold">{t(COPY.openBrand)} →</Link>}
                    <button type="button" onClick={() => go('contact')} className="block text-[14px] font-semibold text-cyan underline underline-offset-4">{t(COPY.wantAgent)}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Section>

      {/* Recognition and partners */}
      <Section id="partners" title={t(COPY.partnersTitle)} className="bg-bg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COPY.partners.map((p, i) => {
            const I = [Building2, GraduationCap, Handshake][i];
            return (
              <div key={p.title.en} className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                <I className="h-7 w-7 text-teal" />
                <h3 className="mt-3 text-[18px] font-bold">{t(p.title)}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-500">{t(p.text)}</p>
              </div>
            );
          })}
        </div>
        <h3 className="mt-12 text-[22px] font-bold">{t(COPY.recTitle)}</h3>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {COPY.rec.map((r) => <li key={r.en} className="flex gap-3 rounded-2xl bg-white p-4 text-[14.5px] ring-1 ring-line"><Award className="h-5 w-5 shrink-0 text-teal" /> {t(r)}</li>)}
        </ul>
      </Section>

      {/* Lead form */}
      <Section id="contact" title={t(COPY.formTitle)} className="bg-navy text-white">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[16px] leading-relaxed text-navy-300">{t(COPY.formSub)}</p>
            <div className="mt-6 flex flex-col items-start gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal px-5 font-semibold" data-testid="forum-whatsapp"><MessageCircle className="h-5 w-5" /> WhatsApp +7 707 373 77 67</a>
              <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-5 font-semibold"><Send className="h-5 w-5" /> Telegram @{CONTACTS.telegram}</a>
            </div>
          </div>
          <LeadForm lang={lang} />
        </div>
      </Section>

      <footer className="bg-[#0B1F33] text-navy-300">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-[13px] md:px-8">
          <span className="font-semibold text-white">FAB3D AI · fab3d-scan.com</span>
          <Link to="/" className="hover:text-white">FAB3D Academy</Link>
          <Link to="/brand" className="hover:text-white">FAB3D Brand</Link>
          <Link to="/privacy" className="hover:text-white">{t(COPY.footer.privacy)}</Link>
          <span className="w-full">{t(COPY.footer.edu)} 3D: BodyParts3D © DBCLS, CC BY 4.0.</span>
        </div>
      </footer>

      {/* Always-visible call to action on phones */}
      <button type="button" onClick={() => go('contact')} className="fixed inset-x-4 bottom-4 z-40 h-12 rounded-2xl bg-teal font-semibold text-white shadow-2xl md:hidden" data-testid="forum-sticky">{t(COPY.ctaContact)}</button>
    </div>
  );
}

const field = 'h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-[15px] text-white placeholder:text-white/40 focus:border-cyan focus:outline-none';

function LeadForm({ lang }: { lang: ForumLang }) {
  const f = COPY.f;
  const t = (x: Record<ForumLang, string>) => x[lang];
  const [v, setV] = useState({ name: '', contact: '', org: '', role: '', country: '', message: '', _honey: '' });
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error' | 'invalid'>('idle');
  const [summary, setSummary] = useState('');
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (v._honey) return;
    if (!consent || !v.name.trim() || !v.contact.trim()) { setState('invalid'); return; }
    setState('busy');
    const fields: Record<string, string> = {
      'Имя': v.name, 'Контакт': v.contact, 'Организация': v.org, 'Должность': v.role, 'Страна, город': v.country,
      'Интересы': COPY.interests.filter((i) => interests.includes(i.id)).map((i) => i.ru).join(', '),
      'Сообщение': v.message, 'Язык страницы': lang.toUpperCase(), 'Источник': 'MedTech-форум, fab3d-scan.com/forum', 'Согласие': 'Связаться и обработать данные — да',
    };
    const clean = Object.fromEntries(Object.entries(fields).filter(([, x]) => x.trim()));
    if (/@/.test(v.contact)) clean._replyto = v.contact.trim();
    setSummary(`MedTech-форум, FAB3D AI\n${Object.entries(clean).filter(([k]) => !k.startsWith('_')).map(([k, x]) => `${k}: ${x}`).join('\n')}`);
    try { await sendForm(`MedTech-форум: ${v.name}${v.org ? ` — ${v.org}` : ''}`, clean); setState('sent'); } catch { setState('error'); }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-3xl bg-white p-7 text-navy" data-testid="forum-form-sent">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h3 className="mt-3 text-[22px] font-bold">{t(f.sentTitle)}</h3>
        <p className="mt-1.5 text-[15px] text-navy-500">{t(f.sentText)}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-teal px-5 font-semibold text-white"><MessageCircle className="h-5 w-5" /> WhatsApp</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-5 font-semibold text-white"><Send className="h-5 w-5" /> Telegram</a>
        </div>
      </div>
    );
  }

  const input = (k: keyof typeof v, label: string, required = false) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{label}{required && ' *'}</span>
      <input name={k} value={v[k]} onChange={set(k)} className={field} autoComplete={k === 'name' ? 'name' : k === 'org' ? 'organization' : undefined} />
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 md:p-7" data-testid="forum-form">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {input('name', t(f.name), true)}
        {input('contact', t(f.contact), true)}
        {input('org', t(f.org))}
        {input('role', t(f.role))}
        <div className="sm:col-span-2">{input('country', t(f.country))}</div>
      </div>
      <div className="mt-4">
        <div className="mb-2 text-[13px] font-medium text-white/80">{t(f.interest)}</div>
        <div className="flex flex-wrap gap-2">
          {COPY.interests.map((i) => {
            const on = interests.includes(i.id);
            return (
              <button key={i.id} type="button" onClick={() => setInterests((x) => (on ? x.filter((y) => y !== i.id) : [...x, i.id]))} aria-pressed={on} data-testid={`forum-interest-${i.id}`}
                className={cn('rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold', on ? 'bg-cyan text-navy' : 'bg-white/10 text-white hover:bg-white/15')}>{i[lang]}</button>
            );
          })}
        </div>
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-white/80">{t(f.message)}</span>
        <textarea name="message" rows={3} value={v.message} onChange={set('message')} className={cn(field, 'h-auto py-2.5')} />
      </label>
      <input name="_honey" value={v._honey} onChange={set('_honey')} className="hidden" tabIndex={-1} autoComplete="off" />
      <label className="mt-4 flex items-start gap-2.5 text-[13px] leading-snug text-white/70">
        <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal" />
        <span>{t(f.consent)} · <Link to="/privacy" target="_blank" className="underline">{t(COPY.footer.privacy)}</Link></span>
      </label>
      {state === 'invalid' && <p className="mt-3 text-[13px] text-[#FF8A8A]">{t(f.required)}</p>}
      {state === 'error' && (
        <div className="mt-4 rounded-2xl bg-white/10 p-4 text-[13.5px]" data-testid="forum-form-error">
          <p>{t(f.error)}</p>
          <a href={whatsappWith(summary)} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-4 font-semibold" data-testid="forum-form-whatsapp"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        </div>
      )}
      <button type="submit" disabled={state === 'busy'} className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-teal px-7 font-semibold disabled:opacity-60" data-testid="forum-submit">
        {state === 'busy' && <Loader2 className="h-4 w-4 animate-spin" />} {t(f.submit)}
      </button>
    </form>
  );
}
