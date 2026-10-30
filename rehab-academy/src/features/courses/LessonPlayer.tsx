import { useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, ExternalLink, Lock } from 'lucide-react';
import { useDb } from '@/data/db';
import { completeLesson, courseStatus, lessonLocked, touchLesson, useMe } from '@/data/api';
import Paywall from '@/features/access/Paywall';
import ExerciseSet from '@/features/exercises/ExerciseSet';
import { ConsultBanner } from '@/features/consult/Consult';
import { canSeeCourse } from '@/data/rbac';
import { SIM_BY_ID } from '@/data/content/simulations';
import { ANATOMY_MODELS, STRUCTURE_BY_ID } from '@/data/content/anatomy';
import type { Lesson } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Button, buttonVariants, Card, EduNotice } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { AnatomyViewer } from '@/features/anatomy/AnatomyViewer';
import { NotFound } from '@/pages/Status';
import { LESSON_ICON } from './CourseDetail';

export default function LessonPlayer() {
  const { id = '', lessonId = '' } = useParams();
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const nav = useNavigate();
  const opened = useRef(Date.now());
  const c = d.courses.find((x) => x.id === id);
  const enrolled = d.enrollments.some((e) => e.userId === u.id && e.courseId === id);
  const isAuthor = !!c && (c.instructorId === u.id || u.role === 'super_admin');
  const st = c ? courseStatus(u.id, c.id) : null;
  const idx = st?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = idx >= 0 ? st!.lessons[idx] : undefined;

  useEffect(() => {
    opened.current = Date.now();
    if (enrolled && lesson && !lessonLocked(u, lesson)) touchLesson(id, lesson.id);
  }, [id, lesson, enrolled, u]);

  // Simulation and quiz lessons complete themselves once the activity is done.
  const simDone = lesson?.type === 'simulation' && d.simAttempts.some((a) => a.userId === u.id && a.simulationId === lesson.simulationId);
  const quizDone = lesson?.type === 'quiz' && d.attempts.some((a) => a.userId === u.id && a.assessmentId === lesson.assessmentId && a.passed);
  useEffect(() => {
    if (enrolled && lesson && (simDone || quizDone) && !st?.done.has(lesson.id)) completeLesson(id, lesson.id, lesson.durationMin * 60);
  }, [enrolled, lesson, simDone, quizDone, st, id]);

  if (!c || !canSeeCourse(u, c) || !st) return <NotFound />;
  if (!enrolled && !isAuthor) return <Navigate to={`/courses/${id}`} replace />;
  if (!lesson) return <NotFound />;
  const locked = lessonLocked(u, lesson);
  const isAthleteCourse = !!c.audience?.includes('athlete');
  const done = st.done.has(lesson.id);
  const prev = st.lessons[idx - 1];
  const next = st.lessons[idx + 1];
  const canMark = enrolled && !done && !locked && lesson.type !== 'quiz' && lesson.type !== 'simulation';

  function markDone() {
    completeLesson(id, lesson!.id, Math.max(60, Math.round((Date.now() - opened.current) / 1000)));
    if (next) nav(`/courses/${id}/lessons/${next.id}`);
  }

  return (
    <div className="animate-fade-up grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="order-2 lg:order-1">
        <Card className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-3 scrollbar-thin">
          <Link to={`/courses/${id}`} className="mb-2 flex items-center gap-1.5 px-2 py-1 text-[13px] font-semibold text-teal"><ArrowLeft className="h-4 w-4" /> {c.title}</Link>
          <div className="mb-3 px-2"><div className="h-1.5 overflow-hidden rounded-full bg-[#E8EEF4]"><div className="h-full bg-teal" style={{ width: `${st.pct}%` }} /></div></div>
          {st.lessons.map((l, i) => {
            const Icon = LESSON_ICON[l.type];
            return (
              <Link key={l.id} to={`/courses/${id}/lessons/${l.id}`} className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px]', l.id === lesson.id ? 'bg-teal-50 font-semibold text-teal' : 'text-navy hover:bg-bg')}>
                {st.done.has(l.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : lessonLocked(u, l) ? <Lock className="h-4 w-4 shrink-0 text-navy-300" /> : <Icon className="h-4 w-4 shrink-0 text-navy-300" />}
                <span className="truncate">{i + 1}. {l.title}</span>
              </Link>
            );
          })}
        </Card>
      </aside>

      <article className="order-1 min-w-0 lg:order-2">
        <Card className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal">{t(`lesson.${lesson.type}` as I18nKey)}</Badge>
            <span className="text-[12px] text-navy-500">{lesson.durationMin} {t('common.min')}</span>
            {done && <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> {t('courses.lessonDone')}</Badge>}
            {!enrolled && <Badge tone="warning">{t('courses.preview')}</Badge>}
          </div>
          <h1 className="mt-3 text-[24px] font-bold tracking-tight">{lesson.title}</h1>
          {locked ? <div className="mt-5"><Paywall /></div> : <>
          <div className="mt-2"><LessonBody lesson={lesson} /></div>
          {lesson.exercises?.length ? <ExerciseSet ids={lesson.exercises} /> : null}
          {lesson.ctaLabel && (
            lesson.ctaUrl
              ? <a href={lesson.ctaUrl} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', className: 'mt-5' })} data-testid="lesson-cta"><ExternalLink className="h-4 w-4" /> {lesson.ctaLabel}</a>
              : <p className="mt-5 rounded-xl border border-dashed border-line bg-bg px-4 py-3 text-sm text-navy-500" data-testid="lesson-cta">{t('lesson.ctaPending')}</p>
          )}
          </>}
          {isAthleteCourse && !locked && <ConsultBanner className="mt-6" />}
          <EduNotice className="mt-6" />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {prev ? <Link to={`/courses/${id}/lessons/${prev.id}`} className={buttonVariants({ variant: 'ghost' })}><ArrowLeft className="h-4 w-4" /> {t('courses.prevLesson')}</Link> : <span />}
            <div className="flex gap-2">
              {canMark && <Button onClick={markDone} data-testid="lesson-done"><CheckCircle2 className="h-4 w-4" /> {t('courses.markDone')}</Button>}
              {next && (!canMark) && <Link to={`/courses/${id}/lessons/${next.id}`} className={buttonVariants({ variant: 'secondary' })} data-testid="lesson-next">{t('courses.nextLesson')} <ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </div>
        </Card>
      </article>
    </div>
  );
}

function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const { t } = useT();
  const d = useDb();
  const u = useMe()!;
  const body = lesson.body ? <Markdown source={lesson.body} /> : null;
  switch (lesson.type) {
    case 'video': {
      const yt = lesson.videoUrl && youtubeEmbed(lesson.videoUrl);
      return (
        <>
          <div className="my-4 aspect-video overflow-hidden rounded-2xl bg-navy">
            {yt ? <iframe src={yt} title={lesson.title} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
              : lesson.videoUrl ? <video src={lesson.videoUrl} controls className="h-full w-full" />
                : <div className="grid h-full place-items-center p-6 text-center text-sm text-navy-300">{t('lesson.noVideo')}</div>}
          </div>
          {body}
        </>
      );
    }
    case 'anatomy': {
      const focus = lesson.anatomyFocus ?? [];
      const model = lesson.anatomyModel ?? 'knee';
      const hidden = new Set(ANATOMY_MODELS[model].ids.filter((id) => !focus.includes(id)));
      return (
        <>
          {body}
          <div className="my-4 h-[420px] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#E8EEF4_75%)]">
            <AnatomyViewer className="h-full" model={model} hidden={hidden} errorText={t('anat.loadError')} loadingText={t('common.loading')} />
          </div>
          <div className="flex flex-wrap gap-2">{focus.map((s) => <Badge key={s} tone="teal">{STRUCTURE_BY_ID[s]?.name}</Badge>)}</div>
          <Link to={`/anatomy?m=${model}&focus=${focus.join(',')}`} className={buttonVariants({ variant: 'outline', className: 'mt-4' })}><ExternalLink className="h-4 w-4" /> {t('courses.openAnatomy')}</Link>
        </>
      );
    }
    case 'simulation': {
      const sim = lesson.simulationId ? SIM_BY_ID[lesson.simulationId] : undefined;
      return (
        <>
          {body}
          {sim && (
            <div className="mt-4 rounded-2xl border border-line bg-bg p-5">
              <div className="font-semibold">{sim.title}</div>
              <div className="mt-1 text-[13px] text-navy-500">{sim.durationMin} {t('common.min')} · {t(`sim.diff.${sim.difficulty}` as I18nKey)}</div>
              <Link to={`/simulations/${sim.id}`} className={buttonVariants({ className: 'mt-4' })}>{t('courses.openSim')}</Link>
            </div>
          )}
        </>
      );
    }
    case 'quiz': {
      const a = d.assessments.find((x) => x.id === lesson.assessmentId);
      const best = d.attempts.filter((x) => x.userId === u.id && x.assessmentId === lesson.assessmentId).reduce((m, x) => Math.max(m, x.score), -1);
      return (
        <>
          {body}
          {a && (
            <div className="mt-4 rounded-2xl border border-line bg-bg p-5">
              <div className="font-semibold">{a.title}</div>
              <div className="mt-1 text-[13px] text-navy-500">{t('tests.passing', { n: a.passingScore })} · {a.timeLimitMin ? t('tests.timeLimit', { n: a.timeLimitMin }) : t('tests.noLimit')}</div>
              {best >= 0 && <div className="mt-1 text-[13px]">{t('tests.bestScore')}: <b>{best}%</b></div>}
              <Link to={`/assessments/${a.id}`} className={buttonVariants({ className: 'mt-4' })}>{t('courses.openTest')}</Link>
            </div>
          )}
        </>
      );
    }
    case 'file':
      return (
        <>
          {body}
          {lesson.fileUrl && <a href={lesson.fileUrl.startsWith('/') ? import.meta.env.BASE_URL + lesson.fileUrl.slice(1) : lesson.fileUrl} download className={buttonVariants({ variant: 'outline', className: 'mt-4' })}><Download className="h-4 w-4" /> {t('courses.download')}</a>}
        </>
      );
    default:
      return body;
  }
}
