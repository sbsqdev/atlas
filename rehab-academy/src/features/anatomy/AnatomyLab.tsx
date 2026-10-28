import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, BookMarked, Eye, EyeOff, Focus, Layers, Maximize2, Minimize2, Minus, Plus, RotateCcw, Rotate3d, Search, Target, Trophy, X,
} from 'lucide-react';
import { ANATOMY_MODELS, MODEL_IDS, STRUCTURE_BY_ID, structuresOf } from '@/data/content/anatomy';
import { logAnatomyView } from '@/data/api';
import type { AnatomyStructure, ModelId } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, EduNotice, PageHeader, Tabs } from '@/components/ui';
import { AnatomyViewer, type ViewerHandle } from './AnatomyViewer';

const GROUPS: { id: AnatomyStructure['group']; key: I18nKey }[] = [
  { id: 'bone', key: 'anat.bones' },
  { id: 'muscle', key: 'anat.muscles' },
  { id: 'fascia', key: 'anat.fascia' },
  { id: 'ligament', key: 'anat.ligaments' },
];
const QUIZ_LEN = 5;
const MODEL_LABEL: Record<ModelId, I18nKey> = { knee: 'anat.knee', foot: 'anat.foot' };

/** Region from ?m=, else the first model that shows the ?s= structure. */
function initialModel(params: URLSearchParams): ModelId {
  const m = params.get('m');
  if (m && (MODEL_IDS as string[]).includes(m)) return m as ModelId;
  const s = params.get('s');
  return MODEL_IDS.find((id) => s && [...ANATOMY_MODELS[id].ids, ...ANATOMY_MODELS[id].textOnly].includes(s)) ?? 'knee';
}

export default function AnatomyLab() {
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const [model, setModel] = useState<ModelId>(() => initialModel(params));
  const STRUCTURES = useMemo(() => structuresOf(model), [model]);
  const inModel = (id: string) => ANATOMY_MODELS[model].ids.includes(id);
  const focus = useMemo(() => params.get('focus')?.split(',').filter((id) => STRUCTURE_BY_ID[id]) ?? null, [params]);
  const [selected, setSelected] = useState<string | null>(params.get('s'));
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(focus ? ANATOMY_MODELS[model].ids.filter((id) => !focus.includes(id)) : []));
  const [isolated, setIsolated] = useState<string | null>(null);
  const [ghost, setGhost] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [query, setQuery] = useState('');
  const [hover, setHover] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [quiz, setQuiz] = useState<{ queue: string[]; i: number; score: number; flash: string | null; msg: string | null } | null>(null);
  const viewer = useRef<ViewerHandle>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  function switchModel(m: ModelId) {
    setModel(m);
    setSelected(null);
    setHidden(new Set());
    setIsolated(null);
    setQuiz(null);
    setParams(new URLSearchParams({ m }), { replace: true });
  }

  function select(id: string) {
    setSelected(id);
    logAnatomyView(id);
    const next = new URLSearchParams(params);
    next.set('s', id);
    next.set('m', model);
    setParams(next, { replace: true });
  }

  function pick(id: string) {
    if (quiz && quiz.i < quiz.queue.length) {
      const target = quiz.queue[quiz.i];
      const ok = id === target;
      setQuiz({ ...quiz, i: quiz.i + 1, score: quiz.score + (ok ? 1 : 0), flash: ok ? null : id, msg: ok ? t('anat.quizCorrect') : t('anat.quizWrong', { name: STRUCTURE_BY_ID[id]?.name ?? id }) });
      return;
    }
    select(id);
  }

  function startQuiz() {
    const pool = ANATOMY_MODELS[model].ids.filter((id) => !hidden.has(id));
    const queue = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(QUIZ_LEN, pool.length));
    setIsolated(null);
    setSelected(null);
    setQuiz({ queue, i: 0, score: 0, flash: null, msg: null });
  }

  const toggleHidden = (id: string) => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleGroup = (g: AnatomyStructure['group'], show: boolean) =>
    setHidden((h) => { const n = new Set(h); STRUCTURES.filter((s) => s.group === g).forEach((s) => (show ? n.delete(s.id) : n.add(s.id))); return n; });

  const list = STRUCTURES.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.latin.toLowerCase().includes(q);
  });
  const sel = selected ? STRUCTURE_BY_ID[selected] : null;
  const quizDone = quiz && quiz.i >= quiz.queue.length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={`${t('anat.lowerLimb')} · ${t(MODEL_LABEL[model])}`} title={t('anat.title')}
        actions={<Tabs value={model} onChange={switchModel} items={MODEL_IDS.map((m) => ({ value: m, label: t(MODEL_LABEL[m]) }))} />}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_340px]">
        {/* Left: systems, structures */}
        <Card className="flex max-h-[720px] flex-col overflow-hidden">
          <div className="border-b border-line p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-navy-500"><Layers className="h-3.5 w-3.5" /> {t('anat.systems')}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {GROUPS.map((g) => {
                const ids = STRUCTURES.filter((s) => s.group === g.id).map((s) => s.id);
                const visible = ids.some((id) => !hidden.has(id));
                return (
                  <button key={g.id} onClick={() => toggleGroup(g.id, !visible)} className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12px] font-semibold', visible ? 'border-teal bg-teal-50 text-teal' : 'border-line text-navy-300')}>
                    {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {t(g.key)}
                  </button>
                );
              })}
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-300" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('anat.searchPh')} className="h-9 w-full rounded-lg border border-line bg-bg pl-8 pr-2 text-[13px] focus:border-teal focus:outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {GROUPS.map((g) => {
              const items = list.filter((s) => s.group === g.id);
              if (!items.length) return null;
              return (
                <div key={g.id} className="mb-2">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy-300">{t(g.key)}</div>
                  {items.map((s) => (
                    <div key={s.id} className={cn('group flex items-center gap-1 rounded-lg pr-1', selected === s.id ? 'bg-teal-50' : 'hover:bg-bg')}>
                      <button onClick={() => select(s.id)} className={cn('min-w-0 flex-1 truncate px-2 py-1.5 text-left text-[13px]', selected === s.id ? 'font-semibold text-teal' : 'text-navy', hidden.has(s.id) && inModel(s.id) && 'opacity-45')} data-testid={`struct-${s.id}`}>
                        {s.name}
                      </button>
                      {inModel(s.id) ? (
                        <button onClick={() => toggleHidden(s.id)} className="rounded p-1 text-navy-300 hover:text-navy" aria-label={t('anat.hide')}>
                          {hidden.has(s.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      ) : <span className="px-1 text-[10px] font-semibold text-[#9A6B12]" title={t('anat.noModel')}>2D</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Center: viewport */}
        <div ref={stage} className={cn('relative flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-line bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#E8EEF4_70%,#DCE5EE_100%)]', full ? 'h-screen' : 'h-[560px] xl:h-[720px]')}>
          <AnatomyViewer
            ref={viewer} className="flex-1" model={model} selected={quiz ? null : selected} hidden={hidden} isolated={isolated} ghost={ghost} autoRotate={rotate}
            flash={quiz?.flash ?? null} onPick={pick} onHover={setHover} errorText={t('anat.loadError')} loadingText={t('common.loading')}
          />
          {hover && STRUCTURE_BY_ID[hover] && !quiz && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-navy/90 px-3 py-1.5 text-[12px] font-semibold text-white">{STRUCTURE_BY_ID[hover].name}</div>
          )}
          {quiz && (
            <div className="absolute left-1/2 top-4 w-[min(92%,420px)] -translate-x-1/2 rounded-2xl bg-white/95 p-4 text-center shadow-[var(--shadow-lift)]" data-testid="anat-quiz">
              {quizDone ? (
                <>
                  <Trophy className="mx-auto h-7 w-7 text-warning" />
                  <div className="mt-1 font-semibold">{t('anat.quizDone', { score: quiz.score, total: quiz.queue.length })}</div>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button size="sm" onClick={startQuiz}>{t('common.retry')}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setQuiz(null)}>{t('anat.quizExit')}</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[12px] text-navy-500">{quiz.i + 1} / {quiz.queue.length}</div>
                  <div className="mt-0.5 font-semibold">{t('anat.quizFind', { name: STRUCTURE_BY_ID[quiz.queue[quiz.i]].name })}</div>
                  {quiz.msg && <div className={cn('mt-1 text-[13px] font-semibold', quiz.flash ? 'text-error' : 'text-success')}>{quiz.msg}</div>}
                  <button onClick={() => setQuiz(null)} className="absolute right-3 top-3 text-navy-300 hover:text-navy" aria-label={t('anat.quizExit')}><X className="h-4 w-4" /></button>
                </>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-1 border-t border-line bg-white/90 p-2 backdrop-blur" role="toolbar">
            <Tool icon={<Rotate3d />} label={t('anat.rotate')} active={rotate} onClick={() => setRotate((v) => !v)} />
            <Tool icon={<Plus />} label={t('anat.zoomIn')} onClick={() => viewer.current?.zoom(0.8)} />
            <Tool icon={<Minus />} label={t('anat.zoomOut')} onClick={() => viewer.current?.zoom(1.25)} />
            <Tool icon={<RotateCcw />} label={t('anat.reset')} onClick={() => viewer.current?.reset()} />
            <span className="mx-1 h-6 w-px bg-line" />
            <Tool icon={<Focus />} label={t('anat.isolate')} active={!!isolated} disabled={!(sel && inModel(sel.id)) && !isolated} onClick={() => setIsolated(isolated ? null : selected)} />
            <Tool icon={<EyeOff />} label={t('anat.hide')} disabled={!(sel && inModel(sel.id))} onClick={() => selected && toggleHidden(selected)} />
            <Tool icon={<Eye />} label={t('anat.showAll')} onClick={() => { setHidden(new Set()); setIsolated(null); }} />
            <Tool icon={<Layers />} label={t('anat.transparency')} active={ghost} onClick={() => setGhost((v) => !v)} />
            <span className="mx-1 h-6 w-px bg-line" />
            <Tool icon={full ? <Minimize2 /> : <Maximize2 />} label={t('anat.fullscreen')} onClick={() => (full ? document.exitFullscreen() : stage.current?.requestFullscreen?.())} />
            <Tool icon={<Target />} label={t('anat.quiz')} active={!!quiz} onClick={() => (quiz ? setQuiz(null) : startQuiz())} />
          </div>
        </div>

        {/* Right: info */}
        <Card className="max-h-[720px] overflow-y-auto scrollbar-thin">
          {sel ? <StructureInfo s={sel} /> : <div className="grid h-full min-h-48 place-items-center p-6 text-center text-sm text-navy-500">{t('anat.selectHint')}</div>}
        </Card>
      </div>
      <p className="mt-3 text-[12px] text-navy-500">{t('anat.attribution')}</p>
    </div>
  );
}

function Tool({ icon, label, onClick, active, disabled }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={label} aria-label={label} aria-pressed={active}
      className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-35 [&_svg]:h-4 [&_svg]:w-4', active ? 'bg-navy text-white' : 'text-navy-500 hover:bg-bg hover:text-navy')}
    >
      {icon}<span className="hidden 2xl:inline">{label}</span>
    </button>
  );
}

function StructureInfo({ s }: { s: AnatomyStructure }) {
  const { t } = useT();
  const row = (k: I18nKey, v?: string) => v && (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">{t(k)}</div>
      <p className="mt-0.5 text-[13.5px] leading-relaxed text-navy">{v}</p>
    </div>
  );
  return (
    <div className="space-y-4 p-5" data-testid="structure-info">
      <div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="teal">{t(GROUPS.find((g) => g.id === s.group)!.key)}</Badge>
          {!s.verified && <Badge tone="warning">{t('anat.notVerified')}</Badge>}
        </div>
        <h2 className="mt-2 text-xl font-bold">{s.name}</h2>
        <div className="text-sm italic text-navy-500">{s.latin}</div>
      </div>
      {!s.hasModel && (
        <div className="flex gap-2 rounded-xl border border-[#F4D99B] bg-[#FFF9EC] p-3 text-[12.5px] text-[#7A5410]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div><b>{t('anat.noModel')}.</b> {t('anat.noModelText')}</div>
        </div>
      )}
      {row('anat.classification', s.classification)}
      {row('anat.origin', s.origin)}
      {row('anat.insertion', s.insertion)}
      {row('anat.innervation', s.innervation)}
      {row('anat.function', s.function)}
      {row('anat.biomech', s.biomech)}
      {row('anat.notes', s.notes)}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-500"><BookMarked className="h-3.5 w-3.5" /> {t('anat.references')}</div>
        <ul className="mt-1 space-y-1.5">
          {s.references.map((r) => (
            <li key={r.title} className="text-[12px] text-navy-700">
              {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-teal hover:underline">{r.title}</a> : r.title}
              <span className="text-navy-500"> — {r.source}</span>
            </li>
          ))}
        </ul>
      </div>
      <EduNotice />
    </div>
  );
}
