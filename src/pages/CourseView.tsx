import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import { MUSCLE_BY_ID } from '../data/muscles';
import type { MuscleId } from '../types';

export default function CourseView() {
  const { courseId } = useParams();
  const { t, tr } = useT();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const trainer = useStore((s) => s.trainers.find((tr2) => tr2.id === course?.trainerId));

  if (!course) return <p className="placeholder">404</p>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/trainers">{t('trainers')}</Link>
        <span>›</span>
        <span>{trainer?.name}</span>
        <span>›</span>
        <span>{tr(course.title)}</span>
      </div>

      <h1>{tr(course.title)}</h1>
      <p className="sub">{tr(course.summary)}</p>

      <div className="grid cols-2">
        {course.workouts.map((w, i) => {
          // Aggregate the primary muscles across the workout for a quick preview.
          const muscles = new Set<MuscleId>();
          w.exercises.forEach((e) => e.primary.forEach((m) => muscles.add(m)));
          return (
            <Link
              key={w.id}
              to={`/course/${course.id}/workout/${w.id}`}
              className="card link"
            >
              <span className="pill">{t('workout')} {i + 1}</span>
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
