import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { MUSCLE_BY_ID } from '../data/muscles';
import AnatomyPanel from '../components/AnatomyPanel';
import { useBrandStyle } from '../components/useBrandStyle';
import type { MuscleId } from '../types';

export default function WorkoutView() {
  const { courseId, workoutId } = useParams();
  const { t, tr } = useT();
  const navigate = useNavigate();
  const brand = useBrandStyle(courseId);

  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const workout = course?.workouts.find((w) => w.id === workoutId);

  const user = useAuth((s) => s.user);
  const completedFor = useAuth((s) => s.completedFor);
  const toggleWorkoutDone = useAuth((s) => s.toggleWorkoutDone);

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
  const isDone = completedFor(course.id).includes(workout.id);

  return (
    <div style={brand}>
      <div className="breadcrumb">
        <Link to={`/course/${course.id}`}>{tr(course.title)}</Link>
        <span>›</span>
        <span>{tr(workout.title)}</span>
      </div>

      <div className="toolbar">
        <div>
          <h1 style={{ margin: 0 }}>{tr(workout.title)}</h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>
            {isAggregate ? t('workoutMuscleMap') : tr(selectedExercise?.name)}
          </p>
        </div>
        <span className="spacer" />
        {user?.role === 'student' && (
          <button
            className={`btn ${isDone ? '' : 'primary'}`}
            onClick={() => toggleWorkoutDone(course.id, workout.id)}
          >
            {isDone ? `✓ ${t('markUndone')}` : t('markDone')}
          </button>
        )}
      </div>

      <div className="split anatomy">
        <AnatomyPanel primary={primary} secondary={secondary} />

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
