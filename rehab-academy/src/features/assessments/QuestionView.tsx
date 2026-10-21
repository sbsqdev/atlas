import { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { AnswerValue, Question } from '@/data/types';
import { correctAnswer, isCorrect } from '@/data/grading';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui';
import { shuffle } from '@/lib/shuffle';
import { KneeViewer } from '@/features/anatomy/KneeViewer';

const HINT: Record<Question['type'], I18nKey> = {
  single: 'tests.chooseOne', multi: 'tests.chooseMany', match: 'tests.match', sequence: 'tests.sequence', identify: 'tests.identify', case: 'tests.case',
};

/** Renders one question. `reveal` shows correctness + explanation. */
export function QuestionView({ q, value, onChange, reveal, index }: { q: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void; reveal: boolean; index: number }) {
  const { t } = useT();
  const rights = useMemo(() => shuffle((q.pairs ?? []).map((p) => p.right)), [q]);
  // Authors usually write the correct option first; never show it that way.
  const options = useMemo(() => shuffle(q.options ?? []), [q]);
  const correct = reveal && isCorrect(q, value);
  return (
    <div data-testid={`question-${q.id}`}>
      <div className="text-[12px] font-semibold uppercase tracking-wider text-teal">{t('builder.question')} {index + 1} · {t(HINT[q.type])}</div>
      {q.caseText && <div className="mt-3 rounded-xl border-l-4 border-cyan bg-cyan-50 px-4 py-3 text-sm text-navy-700">{q.caseText}</div>}
      <h2 className="mt-3 text-lg font-semibold leading-snug">{q.prompt}</h2>
      {q.type === 'identify' && q.structureId && (
        <div className="mt-3 h-72 overflow-hidden rounded-2xl border border-line bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#E8EEF4_75%)]">
          <KneeViewer className="h-full" selected={q.structureId} errorText={t('anat.loadError')} loadingText={t('common.loading')} />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {(q.type === 'single' || q.type === 'identify' || q.type === 'case' || q.type === 'multi') && options.map((o) => {
          const multi = q.type === 'multi';
          const sel = multi ? Array.isArray(value) && value.includes(o.id) : value === o.id;
          const toggle = () => {
            if (reveal) return;
            if (!multi) return onChange(o.id);
            const cur = Array.isArray(value) ? value : [];
            onChange(sel ? cur.filter((x) => x !== o.id) : [...cur, o.id]);
          };
          return (
            <button
              key={o.id} type="button" onClick={toggle} disabled={reveal} data-testid={`ans-${o.id}`}
              className={cn('flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                reveal ? (o.correct ? 'border-success bg-[#E3F5F1]' : sel ? 'border-error bg-[#FBE7E9]' : 'border-line opacity-70') : sel ? 'border-teal bg-teal-50' : 'border-line hover:border-teal/50')}
            >
              <span className={cn('mt-0.5 h-4 w-4 shrink-0 border-2', multi ? 'rounded' : 'rounded-full', sel ? 'border-teal bg-teal' : 'border-navy-300')} />
              {o.text}
            </button>
          );
        })}

        {q.type === 'match' && (q.pairs ?? []).map((p) => {
          const m = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Record<string, string>;
          const ok = m[p.left] === p.right;
          return (
            <div key={p.left} className={cn('grid gap-2 rounded-xl border p-3 md:grid-cols-[1fr_1.4fr] md:items-center', reveal ? (ok ? 'border-success bg-[#E3F5F1]' : 'border-error bg-[#FBE7E9]') : 'border-line')}>
              <span className="text-sm font-medium">{p.left}</span>
              <div>
                <Select value={m[p.left] ?? ''} disabled={reveal} onChange={(e) => onChange({ ...m, [p.left]: e.target.value })} aria-label={p.left} data-testid={`match-${p.left}`}>
                  <option value="">—</option>
                  {rights.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                {reveal && !ok && <p className="mt-1 text-[12px] text-success">✓ {p.right}</p>}
              </div>
            </div>
          );
        })}

        {q.type === 'sequence' && (() => {
          const seq = Array.isArray(value) ? value : [];
          const move = (i: number, dir: -1 | 1) => {
            const j = i + dir;
            if (j < 0 || j >= seq.length) return;
            const n = [...seq];
            [n[i], n[j]] = [n[j], n[i]];
            onChange(n);
          };
          return (
            <ol className="space-y-2">
              {seq.map((item, i) => (
                <li key={item} className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm', reveal ? (q.sequence![i] === item ? 'border-success bg-[#E3F5F1]' : 'border-error bg-[#FBE7E9]') : 'border-line bg-white')}>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">{i + 1}</span>
                  <span className="flex-1">{item}</span>
                  {!reveal && (
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-navy-500 hover:bg-bg disabled:opacity-30" aria-label={t('tests.moveUp')}><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === seq.length - 1} className="rounded-lg p-1.5 text-navy-500 hover:bg-bg disabled:opacity-30" aria-label={t('tests.moveDown')}><ArrowDown className="h-4 w-4" /></button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          );
        })()}
      </div>

      {reveal && (
        <div className={cn('mt-4 rounded-xl p-4 text-sm', correct ? 'bg-[#E3F5F1]' : 'bg-[#FDF3DF]')}>
          <div className={cn('font-semibold', correct ? 'text-success' : 'text-[#9A6B12]')}>{correct ? t('sim.correct') : t('tests.incorrect')}</div>
          {!correct && q.type === 'sequence' && <p className="mt-1 text-navy-700">{t('tests.correctAnswer')}: {(correctAnswer(q) as string[]).join(' → ')}</p>}
          <p className="mt-1 text-navy-700">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}
