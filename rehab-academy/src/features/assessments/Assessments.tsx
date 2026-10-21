import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useDb } from '@/data/db';
import { attemptsLeft, canTakeAssessment, useMe } from '@/data/api';
import { useT } from '@/i18n';
import { Badge, buttonVariants, Card, EmptyState, PageHeader } from '@/components/ui';

export default function Assessments() {
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const list = d.assessments.filter((a) => a.status === 'published' && canTakeAssessment(u, a));
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('tests.title')} subtitle={t('tests.subtitle')} />
      {list.length === 0 ? <EmptyState title={t('tests.empty')} /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((a) => {
            const mine = d.attempts.filter((x) => x.userId === u.id && x.assessmentId === a.id);
            const best = mine.length ? Math.max(...mine.map((x) => x.score)) : null;
            const passed = mine.some((x) => x.passed);
            const n = d.questions.filter((q) => q.assessmentId === a.id).length;
            const left = attemptsLeft(u, a);
            return (
              <Card key={a.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><ClipboardCheck className="h-5 w-5" /></div>
                  {best !== null && <Badge tone={passed ? 'success' : 'warning'}>{t('tests.bestScore')}: {best}%</Badge>}
                </div>
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-1 text-[12px] text-navy-500">{d.courses.find((c) => c.id === a.courseId)?.title}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-navy-500">
                  <span>{n} {t('tests.questions')}</span>
                  <span>{t('tests.passing', { n: a.passingScore })}</span>
                  <span>{a.timeLimitMin ? t('tests.timeLimit', { n: a.timeLimitMin }) : t('tests.noLimit')}</span>
                  <span>{left === Infinity ? '' : t('tests.attemptsLeft', { n: left })}</span>
                </div>
                <div className="mt-auto pt-4"><Link to={`/assessments/${a.id}`} className={buttonVariants({ size: 'sm' })} data-testid={`test-${a.id}`}>{t('common.open')}</Link></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
