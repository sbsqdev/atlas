import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Bone, Building2, CalendarClock, ClipboardCheck, Clock, FlaskConical, Footprints, GraduationCap, MessageCircle, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useDb } from '@/data/db';
import { activeSubscriptions, courseLessons, forTrack, isAthlete, useMe } from '@/data/api';
import { activityByDay, avg, bestAttempts, coursePct, missedQuestions, totalMinutes } from '@/data/analytics';
import { canSeeCourse } from '@/data/rbac';
import { STRUCTURE_BY_ID } from '@/data/content/anatomy';
import { SIM_BY_ID } from '@/data/content/simulations';
import { PLAN_BY_ID } from '@/data/content/plans';
import { RUN_LINKS, RUN_OFFER } from '@/data/content/runners';
import type { User } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { fmtDate, fmtHours, LOCALE_TAG } from '@/lib/format';
import { Badge, buttonVariants, Card, CardBody, CardHeader, EmptyState, PageHeader, Progress, StatCard } from '@/components/ui';
import { BarSeries } from '@/components/charts';

export default function Dashboard() {
  const u = useMe()!;
  if (isAthlete(u)) return <AthleteDash u={u} />;
  if (u.role === 'instructor') return <InstructorDash u={u} />;
  if (u.role === 'uni_admin' || u.role === 'clinic_admin') return <OrgDash u={u} />;
  if (u.role === 'super_admin') return <PlatformDash u={u} />;
  return <StudentDash u={u} />;
}

/** Home for athletes: continue the course, open the 3D atlas, join the chat. */
function AthleteDash({ u }: { u: User }) {
  const { t } = useT();
  const d = useDb();
  const v = useMemo(() => {
    const enrolled = d.enrollments.filter((e) => e.userId === u.id);
    const courses = enrolled.map((e) => d.courses.find((c) => c.id === e.courseId)).filter((c): c is NonNullable<typeof c> => !!c);
    const current = courses.find((c) => coursePct(d, u.id, c.id) < 100) ?? courses[0];
    const lessons = current ? courseLessons(current.id) : [];
    const last = enrolled.find((e) => e.courseId === current?.id)?.lastLessonId;
    const next = lessons.find((l) => l.id === last && !d.progress.some((p) => p.userId === u.id && p.lessonId === l.id))
      ?? lessons.find((l) => !d.progress.some((p) => p.userId === u.id && p.lessonId === l.id));
    const more = d.courses.filter((c) => c.status === 'published' && canSeeCourse(u, c) && forTrack(u, c) && !enrolled.some((e) => e.courseId === c.id));
    const recent = d.anatomyViews.filter((x) => x.userId === u.id).sort((a, b) => b.at - a.at).slice(0, 6);
    const done = d.progress.filter((p) => p.userId === u.id).length;
    return { current, next, more, recent, done, lessonsTotal: lessons.length };
  }, [d, u]);
  const pct = v.current ? coursePct(d, u.id, v.current.id) : 0;
  const chatHref = RUN_LINKS.telegramChat || `/courses/${RUN_OFFER.courseId}/lessons/l-r3`;

  return (
    <div className="animate-fade-up" data-testid="athlete-home">
      <PageHeader eyebrow={t('ath.eyebrow')} title={t('dash.welcome', { name: u.fullName.split(' ')[0] })} subtitle={t('ath.sub')} />
      {v.current ? (
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[1fr_260px]">
            <div className="p-6 md:p-8">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-teal">{t('dash.continue')}</div>
              <h2 className="mt-2 text-2xl font-bold">{v.current.title}</h2>
              {v.next && <p className="mt-1 text-sm text-navy-500">{t('courses.nextLesson')}: {v.next.title}</p>}
              <div className="mt-5 flex items-center gap-3"><Progress value={pct} className="max-w-sm" /><span className="text-sm font-semibold">{pct}%</span></div>
              <Link to={v.next ? `/courses/${v.current.id}/lessons/${v.next.id}` : `/courses/${v.current.id}`} className={buttonVariants({ size: 'lg', className: 'mt-6' })}>{t('common.continue')}</Link>
            </div>
            <div className="hidden items-center justify-center bg-gradient-to-br from-teal to-navy md:flex"><Footprints className="h-24 w-24 text-white/80" strokeWidth={1.2} /></div>
          </div>
        </Card>
      ) : (
        <EmptyState title={t('dash.noCourses')} action={<Link to="/courses" className={buttonVariants()}>{t('dash.browseCourses')}</Link>} />
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { to: '/anatomy?m=knee', icon: <Bone className="h-5 w-5" />, title: t('ath.knee'), text: t('ath.kneeText') },
          { to: '/anatomy?m=foot', icon: <Footprints className="h-5 w-5" />, title: t('ath.foot'), text: t('ath.footText') },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-[var(--shadow-lift)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal">{c.icon}</span>
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-1 text-[13px] text-navy-500">{c.text}</p>
            </Card>
          </Link>
        ))}
        {(() => {
          const inner = (
            <Card className="h-full p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><MessageCircle className="h-5 w-5" /></span>
              <h3 className="mt-3 font-semibold">{t('ath.chat')}</h3>
              <p className="mt-1 text-[13px] text-navy-500">{t('ath.chatText')}</p>
            </Card>
          );
          return chatHref.startsWith('http') ? <a href={chatHref} target="_blank" rel="noreferrer">{inner}</a> : <Link to={chatHref}>{inner}</Link>;
        })()}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 xl:col-span-2">
          <StatCard label={t('dash.lessonsDone')} value={v.done} icon={<BookOpen className="h-4 w-4" />} />
          <StatCard label={t('dash.hours')} value={fmtHours(totalMinutes(d, u.id))} icon={<Clock className="h-4 w-4" />} tone="cyan" />
        </div>
        <Card>
          <CardHeader title={t('dash.recentAnatomy')} icon={<Bone className="h-4 w-4" />} />
          <CardBody>
            {v.recent.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
              <div className="flex flex-wrap gap-2">
                {v.recent.map((x) => STRUCTURE_BY_ID[x.structureId] && (
                  <Link key={x.structureId} to={`/anatomy?s=${x.structureId}`} className="rounded-full bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal hover:bg-teal hover:text-white">{STRUCTURE_BY_ID[x.structureId].name}</Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {v.more.length > 0 && (
        <Card className="mt-6">
          <CardHeader title={t('ath.more')} icon={<BookOpen className="h-4 w-4" />} />
          <CardBody className="grid gap-3 md:grid-cols-2">
            {v.more.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`} className="rounded-xl border border-line p-4 hover:border-teal">
                <div className="font-semibold">{c.title}</div>
                <div className="mt-1 text-[12px] text-navy-500">{c.durationMin} {t('common.min')}</div>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StudentDash({ u }: { u: User }) {
  const { t, locale } = useT();
  const d = useDb();
  const data = useMemo(() => {
    const enrolled = d.enrollments.filter((e) => e.userId === u.id);
    const active = enrolled.filter((e) => !e.completedAt);
    const myClasses = d.classes.filter((c) => c.studentIds.includes(u.id));
    const assignments = d.assignments
      .filter((a) => myClasses.some((c) => c.id === a.classId))
      .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
    const continueCourse = active.map((e) => d.courses.find((c) => c.id === e.courseId)).find(Boolean);
    const nextLesson = continueCourse
      ? courseLessons(continueCourse.id).find((l) => !d.progress.some((p) => p.userId === u.id && p.lessonId === l.id))
      : undefined;
    const recommended = d.courses.filter((c) => canSeeCourse(u, c) && c.status === 'published' && !enrolled.some((e) => e.courseId === c.id)).slice(0, 3);
    const recent = d.anatomyViews.filter((v) => v.userId === u.id).sort((a, b) => b.at - a.at).slice(0, 5);
    const sims = d.simAttempts.filter((s) => s.userId === u.id).sort((a, b) => a.completedAt - b.completedAt).slice(-6)
      .map((s, i) => ({ name: `#${i + 1}`, pct: Math.round((s.score / s.maxScore) * 100) }));
    const passed = new Set(d.attempts.filter((a) => a.userId === u.id && a.passed).map((a) => a.assessmentId)).size;
    const feedback = d.feedback.filter((f) => f.studentId === u.id).sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    return { active, assignments, continueCourse, nextLesson, recommended, recent, sims, passed, feedback, simCount: d.simAttempts.filter((s) => s.userId === u.id).length };
  }, [d, u]);

  const doneOf = (kind: string, refId: string) =>
    kind === 'course' ? coursePct(d, u.id, refId) === 100
      : kind === 'simulation' ? d.simAttempts.some((s) => s.userId === u.id && s.simulationId === refId)
        : d.attempts.some((a) => a.userId === u.id && a.assessmentId === refId);
  const titleOf = (kind: string, refId: string) =>
    kind === 'course' ? d.courses.find((c) => c.id === refId)?.title : kind === 'simulation' ? SIM_BY_ID[refId]?.title : d.assessments.find((a) => a.id === refId)?.title;
  const linkOf = (kind: string, refId: string) => (kind === 'course' ? `/courses/${refId}` : kind === 'simulation' ? `/simulations/${refId}` : `/assessments/${refId}`);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('dash.welcome', { name: u.fullName.split(' ')[0] })} subtitle={t('dash.welcomeSub')} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={t('dash.activeCourses')} value={data.active.length} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label={t('dash.hours')} value={fmtHours(totalMinutes(d, u.id))} icon={<Clock className="h-4 w-4" />} tone="cyan" />
        <StatCard label={t('dash.simulations')} value={data.simCount} icon={<FlaskConical className="h-4 w-4" />} tone="navy" />
        <StatCard label={t('dash.assessments')} value={data.passed} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label={t('dash.certificates')} value={d.certificates.filter((c) => c.userId === u.id).length} icon={<Award className="h-4 w-4" />} tone="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[1fr_auto]">
              <div className="p-6">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-teal">{t('dash.continue')}</div>
                {data.continueCourse ? (
                  <>
                    <h2 className="mt-2 text-xl font-bold">{data.continueCourse.title}</h2>
                    {data.nextLesson && <p className="mt-1 text-sm text-navy-500">{t('courses.nextLesson')}: {data.nextLesson.title}</p>}
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={coursePct(d, u.id, data.continueCourse.id)} className="max-w-xs" />
                      <span className="text-sm font-semibold">{coursePct(d, u.id, data.continueCourse.id)}%</span>
                    </div>
                    <Link to={data.nextLesson ? `/courses/${data.continueCourse.id}/lessons/${data.nextLesson.id}` : `/courses/${data.continueCourse.id}`} className={buttonVariants({ className: 'mt-5' })}>{t('common.continue')}</Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-navy-500">{t('dash.noCourses')}</p>
                    <Link to="/courses" className={buttonVariants({ className: 'mt-4' })}>{t('dash.browseCourses')}</Link>
                  </>
                )}
              </div>
              <div className="hidden w-56 items-center justify-center bg-gradient-to-br from-teal to-navy md:flex">
                <GraduationCap className="h-20 w-20 text-white/80" strokeWidth={1.2} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('dash.assignments')} icon={<CalendarClock className="h-4 w-4" />} />
            <CardBody>
              {data.assignments.length === 0 ? <p className="text-sm text-navy-500">{t('dash.noAssignments')}</p> : (
                <ul className="divide-y divide-line">
                  {data.assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link to={linkOf(a.kind, a.refId)} className="block truncate text-sm font-semibold hover:text-teal">{titleOf(a.kind, a.refId)}</Link>
                        <div className="text-[12px] text-navy-500">{t(`cls.kind.${a.kind}` as I18nKey)}{a.dueAt ? ` · ${t('dash.due')}: ${fmtDate(a.dueAt, locale)}` : ''}</div>
                      </div>
                      {doneOf(a.kind, a.refId) ? <Badge tone="success">{t('common.completed')}</Badge> : <Badge tone="gray">{t('common.notStarted')}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('dash.simPerformance')} subtitle="%" icon={<FlaskConical className="h-4 w-4" />} />
            <CardBody>{data.sims.length ? <BarSeries data={data.sims} x="name" y="pct" unit="%" max={100} /> : <p className="text-sm text-navy-500">{t('common.noData')}</p>}</CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {data.feedback.length > 0 && (
            <Card>
              <CardHeader title={t('cls.feedback')} icon={<MessageSquare className="h-4 w-4" />} />
              <CardBody className="space-y-3">
                {data.feedback.map((f) => (
                  <div key={f.id} className="rounded-xl bg-bg p-3 text-sm">
                    <p>{f.text}</p>
                    <p className="mt-1 text-[11px] text-navy-500">{d.users.find((x) => x.id === f.instructorId)?.fullName} · {fmtDate(f.createdAt, locale)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title={t('dash.recommended')} icon={<BookOpen className="h-4 w-4" />} />
            <CardBody className="space-y-3">
              {data.recommended.length === 0 && <p className="text-sm text-navy-500">{t('common.noData')}</p>}
              {data.recommended.map((c) => (
                <Link key={c.id} to={`/courses/${c.id}`} className="block rounded-xl border border-line p-3 hover:border-teal">
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="mt-1 text-[12px] text-navy-500">{t(`level.${c.level}` as I18nKey)} · {c.durationMin} {t('common.min')}</div>
                </Link>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t('dash.recentAnatomy')} icon={<Bone className="h-4 w-4" />} />
            <CardBody>
              {data.recent.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
                <div className="flex flex-wrap gap-2">
                  {data.recent.map((v) => STRUCTURE_BY_ID[v.structureId] && (
                    <Link key={v.structureId} to={`/anatomy?s=${v.structureId}`} className="rounded-full bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal hover:bg-teal hover:text-white">{STRUCTURE_BY_ID[v.structureId].name}</Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InstructorDash({ u }: { u: User }) {
  const { t, locale } = useT();
  const d = useDb();
  const v = useMemo(() => {
    const classes = d.classes.filter((c) => c.instructorId === u.id);
    const studentIds = new Set(classes.flatMap((c) => c.studentIds));
    const myCourses = d.courses.filter((c) => c.instructorId === u.id);
    const myAssessments = new Set(d.assessments.filter((a) => myCourses.some((c) => c.id === a.courseId)).map((a) => a.id));
    const best = bestAttempts(d, studentIds).filter((a) => myAssessments.has(a.assessmentId));
    const groupProgress = classes.map((c) => {
      const courseIds = d.assignments.filter((a) => a.classId === c.id && a.kind === 'course').map((a) => a.refId);
      const pcts = c.studentIds.flatMap((s) => courseIds.map((cid) => coursePct(d, s, cid)));
      return { name: c.name, pct: avg(pcts) ?? 0 };
    });
    const support = [...studentIds].map((sid) => {
      const s = d.users.find((x) => x.id === sid)!;
      const scores = best.filter((a) => a.userId === sid).map((a) => a.score);
      const prog = avg(classes.flatMap((c) => (c.studentIds.includes(sid) ? d.assignments.filter((a) => a.classId === c.id && a.kind === 'course').map((a) => coursePct(d, sid, a.refId)) : []))) ?? 0;
      return { s, score: avg(scores), prog };
    }).filter((x) => (x.score !== null && x.score < 70) || x.prog < 30);
    return {
      classes, studentIds, myCourses, groupProgress, support,
      pending: myCourses.filter((c) => c.status === 'medical_review').length,
      avgScore: avg(best.map((a) => a.score)),
      missed: missedQuestions(d, studentIds, myAssessments),
      activity: activityByDay(d, studentIds, 7, LOCALE_TAG[locale]),
    };
  }, [d, u, locale]);

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('dash.instructorTitle')} subtitle={t('dash.welcome', { name: u.fullName })} actions={<Link to="/teach/classes" className={buttonVariants()}>{t('nav.classes')}</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dash.studentsCount')} value={v.studentIds.size} icon={<Users className="h-4 w-4" />} />
        <StatCard label={t('dash.myCourses')} value={v.myCourses.length} icon={<BookOpen className="h-4 w-4" />} tone="cyan" />
        <StatCard label={t('dash.pending')} value={v.pending} icon={<ShieldCheck className="h-4 w-4" />} tone="warning" />
        <StatCard label={t('dash.avgScore')} value={v.avgScore === null ? '—' : `${v.avgScore}%`} icon={<ClipboardCheck className="h-4 w-4" />} tone="navy" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('dash.groupProgress')} />
          <CardBody className="space-y-4">
            {v.groupProgress.length === 0 && <p className="text-sm text-navy-500">{t('cls.empty')}</p>}
            {v.groupProgress.map((g) => (
              <div key={g.name}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{g.name}</span><span className="font-semibold">{g.pct}%</span></div>
                <Progress value={g.pct} />
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('dash.activity')} subtitle={t('common.min')} />
          <CardBody><BarSeries data={v.activity} x="day" y="minutes" unit={` ${t('common.min')}`} /></CardBody>
        </Card>
        <Card>
          <CardHeader title={t('dash.missed')} />
          <CardBody>
            {v.missed.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
              <ul className="space-y-3">
                {v.missed.map((m) => (
                  <li key={m.q.id}>
                    <div className="flex justify-between gap-3 text-sm"><span className="line-clamp-2">{m.q.prompt}</span><span className="shrink-0 font-semibold text-error">{m.rate}%</span></div>
                    <Progress value={m.rate} tone="warning" className="mt-1.5" />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('dash.needHelp')} />
          <CardBody>
            {v.support.length === 0 ? <p className="text-sm text-navy-500">{t('common.noData')}</p> : (
              <ul className="divide-y divide-line">
                {v.support.map(({ s, score, prog }) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{s.fullName}</span>
                    <span className="flex gap-2"><Badge tone="gray">{prog}%</Badge>{score !== null && <Badge tone={score < 70 ? 'error' : 'success'}>{score}%</Badge>}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function OrgDash({ u }: { u: User }) {
  const { t, locale } = useT();
  const d = useDb();
  const v = useMemo(() => {
    const members = d.users.filter((x) => x.orgId === u.orgId && x.id !== u.id);
    const ids = new Set(members.map((m) => m.id));
    const sub = activeSubscriptions(u)[0];
    const learners = members.filter((m) => m.role === 'student' || m.role === 'instructor').length;
    const util = d.courses.filter((c) => c.status === 'published').map((c) => ({ name: c.title.length > 22 ? c.title.slice(0, 22) + '…' : c.title, n: d.enrollments.filter((e) => e.courseId === c.id && ids.has(e.userId)).length }));
    return { members, sub, learners, util, avgScore: avg(bestAttempts(d, ids).map((a) => a.score)), activity: activityByDay(d, ids, 7, LOCALE_TAG[locale]) };
  }, [d, u, locale]);
  const org = d.orgs.find((o) => o.id === u.orgId);
  return (
    <div className="animate-fade-up">
      <PageHeader eyebrow={org?.name} title={t('dash.orgTitle')} actions={<Link to="/org" className={buttonVariants()}>{t('nav.org')}</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dash.licenses')} value={v.sub ? PLAN_BY_ID[v.sub.planId].name : '—'} hint={v.sub ? `${t('org.validUntil')} ${fmtDate(v.sub.endsAt, locale)}` : t('org.noLicense')} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label={t('dash.seatsUsed')} value={v.sub ? `${v.learners} / ${v.sub.seats}` : v.learners} icon={<Users className="h-4 w-4" />} tone="cyan" />
        <StatCard label={t('dash.members')} value={v.members.length} icon={<GraduationCap className="h-4 w-4" />} tone="navy" />
        <StatCard label={t('dash.avgScore')} value={v.avgScore === null ? '—' : `${v.avgScore}%`} icon={<ClipboardCheck className="h-4 w-4" />} tone="warning" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card><CardHeader title={t('dash.utilization')} /><CardBody><BarSeries data={v.util} x="name" y="n" /></CardBody></Card>
        <Card><CardHeader title={t('dash.activity')} subtitle={t('common.min')} /><CardBody><BarSeries data={v.activity} x="day" y="minutes" unit={` ${t('common.min')}`} /></CardBody></Card>
      </div>
    </div>
  );
}

function PlatformDash({ u }: { u: User }) {
  const { t, locale } = useT();
  const d = useDb();
  const review = d.courses.filter((c) => c.status === 'medical_review' || c.status === 'approved');
  const requested = d.subscriptions.filter((s) => s.status === 'requested');
  const activity = useMemo(() => activityByDay(d, null, 7, LOCALE_TAG[locale]), [d, locale]);
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('dash.platformTitle')} subtitle={t('dash.welcome', { name: u.fullName })} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dash.orgs')} value={d.orgs.filter((o) => o.type !== 'platform').length} icon={<Building2 className="h-4 w-4" />} />
        <StatCard label={t('dash.users')} value={d.users.length} icon={<Users className="h-4 w-4" />} tone="cyan" />
        <StatCard label={t('dash.reviewQueue')} value={review.length} icon={<ShieldCheck className="h-4 w-4" />} tone="warning" />
        <StatCard label={t('dash.licenses')} value={d.subscriptions.filter((s) => s.status === 'pilot' || s.status === 'active').length} hint={requested.length ? `+${requested.length} ${t('adm.requests').toLowerCase()}` : undefined} icon={<Award className="h-4 w-4" />} tone="navy" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card><CardHeader title={t('dash.activity')} subtitle={t('common.min')} /><CardBody><BarSeries data={activity} x="day" y="minutes" unit={` ${t('common.min')}`} /></CardBody></Card>
        <Card>
          <CardHeader title={t('dash.reviewQueue')} action={<Link to="/admin/review" className="text-sm font-semibold text-teal">{t('common.open')}</Link>} />
          <CardBody>
            {review.length === 0 ? <EmptyState title={t('review.empty')} /> : (
              <ul className="divide-y divide-line">
                {review.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{c.title}</span>
                    <Badge tone="warning">{t(`status.${c.status}` as I18nKey)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
