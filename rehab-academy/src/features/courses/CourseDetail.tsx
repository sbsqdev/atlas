import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Award, CheckCircle2, ClipboardCheck, Clock, FileText, FlaskConical, Bone, Lock, PlayCircle, Circle, type LucideIcon } from 'lucide-react';
import { useDb } from '@/data/db';
import { canOpenCourse, courseStatus, enroll, lessonLocked, useMe } from '@/data/api';
import { canSeeCourse } from '@/data/rbac';
import type { LessonType } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Badge, Button, buttonVariants, Card, CardBody, CardHeader, EduNotice, Progress } from '@/components/ui';
import { NotFound } from '@/pages/Status';
import { COVER } from './Catalog';

export const LESSON_ICON: Record<LessonType, LucideIcon> = {
  text: FileText, video: PlayCircle, anatomy: Bone, simulation: FlaskConical, quiz: ClipboardCheck, file: FileText,
};

export default function CourseDetail() {
  const { id = '' } = useParams();
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const nav = useNavigate();
  const [err, setErr] = useState<I18nKey | null>(null);
  const c = d.courses.find((x) => x.id === id);
  if (!c || !canSeeCourse(u, c)) return <NotFound />;
  const enrollment = d.enrollments.find((e) => e.userId === u.id && e.courseId === c.id);
  const st = courseStatus(u.id, c.id);
  const modules = d.modules.filter((m) => m.courseId === c.id).sort((a, b) => a.order - b.order);
  const instructor = d.users.find((x) => x.id === c.instructorId);
  const finalTest = c.finalAssessmentId ? d.assessments.find((a) => a.id === c.finalAssessmentId) : undefined;
  const cert = d.certificates.find((x) => x.userId === u.id && x.courseId === c.id);
  const isAuthor = c.instructorId === u.id || u.role === 'super_admin';
  const resume = st.lessons.find((l) => l.id === enrollment?.lastLessonId && !st.done.has(l.id)) ?? st.lessons.find((l) => !st.done.has(l.id)) ?? st.lessons[0];

  function doEnroll() {
    try { enroll(c!.id); setErr(null); if (resume) nav(`/courses/${c!.id}/lessons/${resume.id}`); } catch (e) { setErr(errorKey(e)); }
  }

  return (
    <div className="animate-fade-up">
      <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-white', COVER[c.cover])}>
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="navy" className="bg-white/15">{c.category}</Badge>
            <Badge tone="navy" className="bg-white/15">{t(`level.${c.level}` as I18nKey)}</Badge>
            {c.status !== 'published' && <Badge tone="warning">{t(`status.${c.status}` as I18nKey)}</Badge>}
          </div>
          <h1 className="mt-3 text-[28px] font-bold leading-tight">{c.title}</h1>
          <p className="mt-2 text-[15px] text-white/85">{c.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-white/85">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {c.durationMin} {t('common.min')}</span>
            <span>{modules.length} {t('courses.modules')} · {st.lessons.length} {t('courses.lessons')}</span>
            {instructor && <span>{t('courses.instructor')}: {instructor.fullName}</span>}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {enrollment ? (
              resume && <Link to={`/courses/${c.id}/lessons/${resume.id}`} className={buttonVariants({ variant: 'dark', size: 'lg' })} data-testid="course-continue">{st.completedLessons ? t('courses.continue') : t('common.start')}</Link>
            ) : canOpenCourse(u, c) ? (
              <Button variant="dark" size="lg" onClick={doEnroll} data-testid="course-enroll">{t('courses.enroll')}</Button>
            ) : (
              <Link to="/pricing" className={buttonVariants({ variant: 'secondary', size: 'lg' })}><Lock className="h-4 w-4" /> {t('err.locked')}</Link>
            )}
            {isAuthor && !enrollment && resume && <Link to={`/courses/${c.id}/lessons/${resume.id}`} className={buttonVariants({ variant: 'secondary', size: 'lg' })}>{t('courses.preview')}</Link>}
          </div>
          {err && <p className="mt-3 rounded-lg bg-white/90 px-3 py-2 text-sm text-error">{t(err)}</p>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title={t('courses.program')} />
          <CardBody className="space-y-5">
            {modules.map((m, mi) => (
              <section key={m.id}>
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-navy-500">{mi + 1}. {m.title}</h3>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {d.lessons.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order).map((l) => {
                    const Icon = LESSON_ICON[l.type];
                    const done = st.done.has(l.id);
                    const inner = (
                      <>
                        <Icon className="h-4 w-4 shrink-0 text-teal" />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        <span className="hidden text-[12px] text-navy-500 sm:inline">{t(`lesson.${l.type}` as I18nKey)} · {l.durationMin} {t('common.min')}</span>
                        {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : lessonLocked(u, l) ? <Lock className="h-4 w-4 text-navy-300" data-testid="lesson-locked" /> : <Circle className="h-4 w-4 text-line" />}
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {enrollment || isAuthor
                          ? <Link to={`/courses/${c.id}/lessons/${l.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-bg">{inner}</Link>
                          : <div className="flex items-center gap-3 px-4 py-3 text-sm text-navy-500">{inner}</div>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {!enrollment && !isAuthor && <p className="text-sm text-navy-500">{t('courses.notEnrolled')}</p>}
          </CardBody>
        </Card>
        <div className="space-y-4">
          {enrollment && (
            <Card>
              <CardHeader title={t('courses.progress')} />
              <CardBody>
                <div className="flex items-center gap-3"><Progress value={st.pct} /><span className="font-semibold">{st.pct}%</span></div>
                <p className="mt-2 text-[13px] text-navy-500">{st.completedLessons} / {st.lessons.length} {t('courses.lessons')}</p>
                {finalTest && <p className="mt-1 text-[13px]">{finalTest.title}: {st.finalPassed ? <span className="font-semibold text-success">{t('common.passed')}</span> : <span className="text-navy-500">{t('common.notStarted')}</span>}</p>}
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title={t('nav.certificates')} icon={<Award className="h-4 w-4" />} />
            <CardBody>
              {cert ? <Link to={`/certificates/${cert.id}/print`} className={buttonVariants({ size: 'sm' })}>{t('cert.print')}</Link> : <p className="text-[13px] text-navy-500">{t('courses.completeToCert')}</p>}
            </CardBody>
          </Card>
          <EduNotice />
          <p className="text-[12px] text-navy-500">{t('app.needsReview')}</p>
        </div>
      </div>
    </div>
  );
}
