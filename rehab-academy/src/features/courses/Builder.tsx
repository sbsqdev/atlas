import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDb } from '@/data/db';
import { createCourse, useMe } from '@/data/api';
import type { ContentStatus, Level } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { fmtDate } from '@/lib/format';
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, PageHeader, Select, Textarea } from '@/components/ui';

export const STATUS_TONE: Record<ContentStatus, 'gray' | 'warning' | 'cyan' | 'success' | 'navy'> = {
  draft: 'gray', medical_review: 'warning', approved: 'cyan', published: 'success', archived: 'navy',
};

export default function Builder() {
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', level: 'beginner' as Level, description: '', durationMin: 60 });
  const mine = d.courses.filter((c) => c.instructorId === u.id || u.role === 'super_admin').sort((a, b) => b.updatedAt - a.updatedAt);

  function create() {
    if (!form.title.trim()) return;
    const c = createCourse({ ...form, title: form.title.trim(), category: form.category.trim() || '—' });
    setOpen(false);
    nav(`/teach/builder/${c.id}`);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('builder.title')} subtitle={t('builder.subtitle')} actions={<Button onClick={() => setOpen(true)} data-testid="new-course"><Plus className="h-4 w-4" /> {t('builder.newCourse')}</Button>} />
      {mine.length === 0 ? <EmptyState title={t('builder.noCourses')} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-3">{t('common.name')}</th><th className="px-5 py-3">{t('common.status')}</th><th className="px-5 py-3">{t('courses.lessons')}</th><th className="px-5 py-3">{t('common.date')}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mine.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium">{c.title}</td>
                  <td className="px-5 py-3"><Badge tone={STATUS_TONE[c.status]}>{t(`status.${c.status}` as I18nKey)}</Badge></td>
                  <td className="px-5 py-3">{d.lessons.filter((l) => l.courseId === c.id).length}</td>
                  <td className="px-5 py-3 text-navy-500">{fmtDate(c.updatedAt, locale)}</td>
                  <td className="px-5 py-3 text-right"><Link to={`/teach/builder/${c.id}`} className="font-semibold text-teal">{t('common.open')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={t('builder.newCourse')} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button onClick={create} disabled={!form.title.trim()} data-testid="create-course">{t('common.create')}</Button></>}>
        <div className="space-y-4">
          <Field label={t('builder.courseTitle')}><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} name="title" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('builder.category')}><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label={t('courses.level')}>
              <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((l) => <option key={l} value={l}>{t(`level.${l}` as I18nKey)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label={t('builder.duration')}><Input type="number" min={5} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></Field>
          <Field label={t('common.description')}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
      </Dialog>
    </div>
  );
}
