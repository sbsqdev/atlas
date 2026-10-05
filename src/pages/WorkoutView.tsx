import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import { MUSCLE_BY_ID } from '../data/muscles';
import MusclePanel from '../components/MusclePanel';
import type { MuscleId } from '../types';

export default function WorkoutView() {
  const { courseId, workoutId } = useParams();
  const { t, tr } = useT();
  const navigate = useNavigate();

  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const workout = course?.workouts.find((w) => w.id === workoutId);

  const [selected, setSelected] = useState<string | null>(null);

  const { primary, secondary, isAggregate } = useMemo(() => {
    if (!workout) return { primary: [], secondary: [], isAggregate: true };
    const sel = workout.exercises.find((e) => e.id === selected);
    if (sel) return { primary: sel.primary, secondary: sel.secondary, isAggregate: false };
    // Aggregate: every primary muscle in the session.
    const prim = new Set<MuscleId>();
    workout.exercises.forEach((e) => e.primary.forEach((m) => prim.add(m)));
    return { primary: [...prim], secondary: [], isAggregate: true };
  }, [workout, selected]);

  if (!course || !workout) return <p className="placeholder">404</p>;

  const selectedExercise = workout.exercises.find((e) => e.id === selected);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/trainers">{t('trainers')}</Link>
        <span>›</span>
        <Link to={`/course/${course.id}`}>{tr(course.title)}</Link>
        <span>›</span>
        <span>{tr(workout.title)}</span>
      </div>

      <h1>{tr(workout.title)}</h1>
      <p className="sub">
        {isAggregate ? t('workoutMuscleMap') : tr(selectedExercise?.name)}
      </p>

      <div className="split">
        <MusclePanel primary={primary} secondary={secondary} />

        <div>
          <div className="exercise-list">
            {workout.exercises.map((e, i) => (
              <div
                key={e.id}
                className={`exercise-row${selected === e.id ? ' active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(selected === e.id ? null : e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') setSelected(selected === e.id ? null : e.id);
                }}
              >
                <span className="idx">{i + 1}</span>
                <div className="body">
                  <div className="name">{tr(e.name)}</div>
                  <div className="presc">{tr(e.prescription)}</div>
                  <div className="chips">
                    {e.primary.map((m) => (
                      <span key={m} className="chip primary">{tr(MUSCLE_BY_ID[m]?.name)}</span>
                    ))}
                    {e.secondary.map((m) => (
                      <span key={m} className="chip">{tr(MUSCLE_BY_ID[m]?.name)}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn ghost small"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    navigate(`/course/${course.id}/workout/${workout.id}/exercise/${e.id}`);
                  }}
                >
                  →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
