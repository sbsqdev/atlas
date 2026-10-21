import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useDb } from '@/data/db';
import { allowedMoves, transitionCourse, useMe } from '@/data/api';
import type { ContentStatus } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { fmtDate } from '@/lib/format';
import { Badge, Button, buttonVariants, Card, EmptyState, PageHeader, Textarea } from '@/components/ui';
import { STATUS_TONE } from '@/features/courses/Builder';

const LABEL: Partial<Record<ContentStatus, I18nKey>> = { approved: 'review.approve', published: 'review.publish', draft: 'review.reject', archived: 'builder.archive' };

export default function Review() {
  const { t, locale } = useT();
  const u = useMe()!;
  const d = useDb();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [err, setErr] = useState<I18nKey | null>(null);
  const queue = d.courses.filter((c) => c.status === 'medical_review' || c.status === 'approved').sort((a, b) => a.updatedAt - b.updatedAt);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('review.title')} subtitle={t('review.subtitle')} />
      {err && <div className="mb-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      {queue.length === 0 ? <EmptyState title={t('review.empty')} /> : (
        <div className="space-y-4">
          {queue.map((c) => (
            <Card key={c.id} className="p-5" data-testid={`review-${c.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Badge tone={STATUS_TONE[c.status]}>{t(`status.${c.status}` as I18nKey)}</Badge><span className="text-[12px] text-navy-500">{fmtDate(c.updatedAt, locale)}</span></div>
                  <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                  <p className="text-[13px] text-navy-500">{t('review.author')}: {d.users.find((x) => x.id === c.instructorId)?.fullName} · {d.lessons.filter((l) => l.courseId === c.id).length} {t('courses.lessons')} · {d.questions.filter((q) => d.assessments.some((a) => a.id === q.assessmentId && a.courseId === c.id)).length} {t('tests.questions')}</p>
                </div>
                <Link to={`/courses/${c.id}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}><Eye className="h-4 w-4" /> {t('courses.preview')}</Link>
              </div>
              <Textarea className="mt-4 min-h-16" placeholder={t('review.note')} value={notes[c.id] ?? ''} onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })} />
              <div className="mt-3 flex flex-wrap gap-2">
                {allowedMoves(u, c).filter((m) => LABEL[m]).map((m) => (
                  <Button key={m} variant={m === 'draft' ? 'secondary' : m === 'archived' ? 'ghost' : 'primary'} size="sm" data-testid={`review-move-${m}`}
                    onClick={() => { try { transitionCourse(c.id, m, notes[c.id]); setErr(null); } catch (e) { setErr(errorKey(e)); } }}>
                    {t(LABEL[m]!)}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
