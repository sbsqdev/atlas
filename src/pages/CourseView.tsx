import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { MUSCLE_BY_ID } from '../data/muscles';
import { useBrandStyle } from '../components/useBrandStyle';
import type { MuscleId } from '../types';

export default function CourseView() {
  const { courseId } = useParams();
  const { t, tr } = useT();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const coach = useAuth((s) => s.accounts.find((a) => a.id === course?.trainerId));
  const completedFor = useAuth((s) => s.completedFor);
  const user = useAuth((s) => s.user);
  const brand = useBrandStyle(courseId);

  if (!course) return <p className="placeholder">404</p>;

  const completed = completedFor(course.id);
  const backTo = user?.role === 'trainer' ? '/dashboard' : '/home';

  return (
    <div style={brand}>
      <div className="breadcrumb">
        <Link to={backTo}>{user?.role === 'trainer' ? t('dashboard') : t('myCourses')}</Link>
        <span>›</span>
        <span>{tr(course.title)}</span>
      </div>

      <h1>{tr(course.title)}</h1>
      {coach && (
        <p style={{ margin: '0 0 6px', color: 'var(--muted)' }}>
          {t('by')}: <strong style={{ color: coach.brandColor || 'var(--accent)' }}>{coach.brandName || coach.name}</strong>
        </p>
      )}
      <p className="sub">{tr(course.summary)}</p>

      <div className="grid cols-2">
        {course.workouts.map((w, i) => {
          const muscles = new Set<MuscleId>();
          w.exercises.forEach((e) => e.primary.forEach((m) => muscles.add(m)));
          const isDone = completed.includes(w.id);
          return (
            <Link key={w.id} to={`/course/${course.id}/workout/${w.id}`} className="card link">
              <span className="pill">{t('workout')} {i + 1}</span>
              {isDone && <span className="done-badge">✓ {t('done')}</span>}
              <h3>{tr(w.title)}</h3>
              <div className="meta" style={{ marginBottom: 10 }}>
                <span>🏋️ {w.exercises.length} {t('exercises')}</span>
              </div>
              <div className="chips">
                {[...muscles].slice(0, 6).map((m) => (
                  <span key={m} className="chip primary">{tr(MUSCLE_BY_ID[m]?.name)}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
