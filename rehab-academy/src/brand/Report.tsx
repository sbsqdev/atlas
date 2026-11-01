import { useState } from 'react';
import { CheckCircle2, Copy, Download, FileText, Printer, RotateCcw, Sparkles, Target, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { reportText, type Report } from './generate';
import { SOURCES } from './content';

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('break-inside-avoid rounded-3xl border border-[#E6E1F5] bg-white p-6 md:p-7', className)}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6D4AFF]">{title}</h2>
      <div className="mt-3 text-[15px] leading-relaxed text-[#2A2540]">{children}</div>
    </section>
  );
}
const Ul = ({ items, icon = 'check' }: { items: string[]; icon?: 'check' | 'x' }) => (
  <ul className="space-y-2">
    {items.map((x) => (
      <li key={x} className="flex gap-2.5">{icon === 'x' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E4572E]" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6D4AFF]" />}<span>{x}</span></li>
    ))}
  </ul>
);

export default function ReportView({ r, onRestart, demo }: { r: Report; onRestart: () => void; demo?: boolean }) {
  const [copied, setCopied] = useState('');
  const max = Math.max(1, ...r.kpi.months.map((m) => m.value));
  const copy = async (k: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(k);
    setTimeout(() => setCopied(''), 2000);
  };
  function download() {
    const url = URL.createObjectURL(new Blob([reportText(r)], { type: 'text/markdown;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'fab3d-brand-report.md' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="print-area mx-auto max-w-5xl px-4 py-8 md:px-8" data-testid="brand-report">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFF6E5] p-4 text-[14px] text-[#5B4300]">
        <span className="flex-1">Мы не сохраняем ваши ответы и отчёт. Скачайте его сейчас: после закрытия страницы его не будет.</span>
        <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#14112B] px-4 font-semibold text-white" data-testid="report-pdf"><Printer className="h-4 w-4" /> Скачать PDF</button>
        <button onClick={download} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-[#14112B] ring-1 ring-[#E6E1F5]" data-testid="report-md"><Download className="h-4 w-4" /> Скачать текстом</button>
        <button onClick={onRestart} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 font-semibold text-[#5B4300]"><RotateCcw className="h-4 w-4" /> Заново</button>
      </div>

      <header className="rounded-3xl bg-gradient-to-br from-[#14112B] to-[#3B2A8C] p-7 text-white md:p-10">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#FFB547]"><Sparkles className="h-4 w-4" /> FAB3D Brand · {demo ? 'пример отчёта' : r.ai ? 'тексты улучшены ИИ' : 'собрано по вашим ответам'}</div>
        <h1 className="mt-3 text-[30px] font-extrabold leading-tight md:text-[42px]">Распаковка личного бренда{r.name !== 'Вы' ? ` — ${r.name}` : ''}</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-white/85" data-testid="report-positioning">{r.positioning}</p>
        <p className="mt-4 inline-block rounded-2xl bg-white/10 px-4 py-2 text-[15px]">Суперсила: <b>{r.superpower}</b></p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Block title="Точка А → точка Б" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F6F4FC] p-4"><div className="text-[12px] font-bold uppercase text-[#7C7699]">Сейчас</div><p className="mt-1">{r.pointA || '—'}</p></div>
            <div className="rounded-2xl bg-[#F0ECFF] p-4"><div className="text-[12px] font-bold uppercase text-[#6D4AFF]">Цель</div><p className="mt-1">{r.pointB || '—'}</p></div>
          </div>
          <div className="mt-5 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-[#6D4AFF]" /> KPI «{r.kpi.name}»: {r.kpi.now} → {r.kpi.target} за {r.kpi.horizon} мес</div>
          <div className="mt-3 flex h-36 items-end gap-2" data-testid="report-kpi">
            {r.kpi.months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[12px] font-semibold">{m.value}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#6D4AFF] to-[#A58BFF]" style={{ height: `${Math.max(4, (m.value / max) * 100)}px` }} />
                <span className="text-[11px] text-[#7C7699]">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-[14px] font-semibold">Опережающие показатели — что делать каждую неделю</div>
          <div className="mt-2"><Ul items={r.leading} /></div>
        </Block>

        <Block title="Сильные стороны">
          <div className="flex flex-wrap gap-2">{r.strengths.map((s) => <span key={s} className="rounded-full bg-[#F0ECFF] px-3 py-1 text-[13.5px] font-semibold text-[#3B2A8C]">{s}</span>)}</div>
        </Block>
        <Block title="Позиционирование (формула Мура)"><p>{r.statement}</p></Block>

        <Block title="Ценностное предложение" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div><div className="mb-2 text-[14px] font-semibold">Боли аудитории</div><Ul items={r.valueProp.pains.length ? r.valueProp.pains : ['—']} icon="x" /></div>
            <div><div className="mb-2 text-[14px] font-semibold">Что вы даёте</div><Ul items={r.valueProp.gains.length ? r.valueProp.gains : ['—']} /></div>
          </div>
        </Block>

        <Block title="Оффер" className="md:col-span-2">
          <p className="text-[20px] font-bold" data-testid="report-offer">{r.offer.headline}</p>
          <div className="mt-3"><Ul items={r.offer.bullets} /></div>
          <p className="mt-3 rounded-xl bg-[#FFF6E5] px-4 py-2 font-semibold text-[#5B4300]">{r.offer.cta}</p>
        </Block>

        <Block title="Био для профилей" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(['instagram', 'linkedin', 'telegram'] as const).map((k) => (
              <div key={k} className="flex flex-col rounded-2xl bg-[#F6F4FC] p-4">
                <div className="text-[12px] font-bold uppercase text-[#7C7699]">{k === 'instagram' ? 'Instagram · до 150 знаков' : k === 'linkedin' ? 'LinkedIn · заголовок' : 'Telegram · описание'}</div>
                <p className="mt-2 flex-1 text-[14.5px]" data-testid={`bio-${k}`}>{r.bios[k]}</p>
                <button onClick={() => copy(k, r.bios[k])} className="no-print mt-3 inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-[#6D4AFF]"><Copy className="h-3.5 w-3.5" /> {copied === k ? 'Скопировано' : 'Скопировать'}</button>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Рубрики контента" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {r.pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-[#E6E1F5] p-4"><div className="font-bold">{p.title}</div><ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">{p.ideas.map((i) => <li key={i}>{i}</li>)}</ul></div>
            ))}
          </div>
        </Block>

        <Block title="Куда давить в первую очередь"><Ul items={r.focus} /></Block>
        <Block title="Чего не делать"><Ul items={r.avoid} icon="x" /></Block>

        <Block title="Контент-план на 30 дней" className="md:col-span-2">
          <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[14px] md:grid-cols-2" data-testid="report-plan">{r.contentPlan.map((d) => <li key={d}>{d}</li>)}</ol>
        </Block>

        <Block title="План на 90 дней · кайдзен" className="md:col-span-2">
          <ol className="space-y-2 text-[14.5px]">{r.plan90.map((w) => <li key={w} className="rounded-xl bg-[#F6F4FC] px-4 py-2">{w}</li>)}</ol>
        </Block>

        {r.safety.length > 0 && <Block title="Безопасность" className="md:col-span-2"><Ul items={r.safety} /></Block>}

        <Block title="На чём основана распаковка" className="md:col-span-2">
          <ul className="space-y-1 text-[13px] text-[#5C5677]">{SOURCES.map((s) => <li key={s} className="flex gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />{s}</li>)}</ul>
          <p className="mt-3 text-[12.5px] text-[#7C7699]">Gallup, CliftonStrengths и Harvard Business Review — товарные знаки правообладателей. Распаковка использует опубликованные подходы и не является их официальным продуктом или тестом.</p>
        </Block>
      </div>
    </div>
  );
}
