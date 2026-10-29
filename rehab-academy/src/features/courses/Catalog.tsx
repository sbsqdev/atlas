import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Lock, Search } from 'lucide-react';
import { useDb } from '@/data/db';
import { canOpenCourse, forTrack, isAthlete, useMe } from '@/data/api';
import { canSeeCourse } from '@/data/rbac';
import { coursePct } from '@/data/analytics';
import type { Course } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Card, EmptyState, PageHeader, Progress, Select } from '@/components/ui';

export const COVER: Record<Course['cover'], string> = {
  teal: 'from-teal to-cyan',
  navy: 'from-navy to-navy-500',
  cyan: 'from-cyan to-teal-600',
  slate: 'from-navy-500 to-navy-300',
};

export default function Catalog() {
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const [cat, setCat] = useState('');
  const [level, setLevel] = useState('');
  const [q, setQ] = useState('');
  const courses = useMemo(() => d.courses.filter((c) => c.status === 'published' && canSeeCourse(u, c) && forTrack(u, c)), [d.courses, u]);
  const categories = [...new Set(courses.map((c) => c.category))];
  const list = courses.filter((c) => (!cat || c.category === cat) && (!level || c.level === level) && (!q || c.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('courses.title')} subtitle={t(isAthlete(u) ? 'courses.subtitleAthlete' : 'courses.subtitle')} />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm focus:border-teal focus:outline-none" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto"><option value="">{t('courses.filterAll')}</option>{categories.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-auto">
          <option value="">{t('courses.level')}: {t('common.all')}</option>
          {(['beginner', 'intermediate', 'advanced'] as const).map((l) => <option key={l} value={l}>{t(`level.${l}` as I18nKey)}</option>)}
        </Select>
      </div>
      {list.length === 0 ? <EmptyState title={t('courses.empty')} /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => <CourseCard key={c.id} c={c} />)}
        </div>
      )}
      <p className="mt-6 text-[12.5px] text-navy-500">{t('courses.licensedNote')}</p>
    </div>
  );
}

function CourseCard({ c }: { c: Course }) {
  const { t } = useT();
  const u = useMe()!;
  const d = useDb();
  const enrolled = d.enrollments.some((e) => e.userId === u.id && e.courseId === c.id);
  const modules = d.modules.filter((m) => m.courseId === c.id);
  const lessons = d.lessons.filter((l) => l.courseId === c.id).length;
  const instructor = d.users.find((x) => x.id === c.instructorId);
  const open = canOpenCourse(u, c);
  const pct = coursePct(d, u.id, c.id);
  return (
    <Link to={`/courses/${c.id}`} className="group" data-testid={`course-${c.id}`}>
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-[var(--shadow-lift)]">
        <div className={cn('relative flex h-32 items-end bg-gradient-to-br p-4', COVER[c.cover])}>
          <BookOpen className="absolute right-4 top-4 h-10 w-10 text-white/25" />
          <Badge tone="navy" className="bg-white/15 backdrop-blur">{c.category}</Badge>
        </div>
        <div className="p-5">
          <h3 className="font-semibold leading-snug">{c.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-navy-500">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-navy-500">
            <span>{t(`level.${c.level}` as I18nKey)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.durationMin} {t('common.min')}</span>
            <span>{modules.length} {t('courses.modules')} · {lessons} {t('courses.lessons')}</span>
          </div>
          {instructor && <div className="mt-2 text-[12px] text-navy-500">{t('courses.instructor')}: {instructor.fullName}</div>}
          <div className="mt-4">
            {enrolled ? (
              <div className="flex items-center gap-2"><Progress value={pct} /><span className="text-[12px] font-semibold">{pct}%</span></div>
            ) : open ? <Badge tone="teal">{t('courses.enroll')}</Badge> : <Badge tone="gray"><Lock className="h-3 w-3" /> {t('err.locked')}</Badge>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
