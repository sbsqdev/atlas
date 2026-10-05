import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import AnatomyPanel from '../components/AnatomyPanel';
import { useBrandStyle } from '../components/useBrandStyle';

export default function ExerciseView() {
  const { courseId, workoutId, exerciseId } = useParams();
  const { t, tr } = useT();
  const brand = useBrandStyle(courseId);

  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  const workout = course?.workouts.find((w) => w.id === workoutId);
  const exercise = workout?.exercises.find((e) => e.id === exerciseId);

  if (!course || !workout || !exercise) return <p className="placeholder">404</p>;

  return (
    <div style={brand}>
      <div className="breadcrumb">
        <Link to={`/course/${course.id}`}>{tr(course.title)}</Link>
        <span>›</span>
        <Link to={`/course/${course.id}/workout/${workout.id}`}>{tr(workout.title)}</Link>
        <span>›</span>
        <span>{tr(exercise.name)}</span>
      </div>

      <div className="split anatomy">
        <AnatomyPanel primary={exercise.primary} secondary={exercise.secondary} />

        <div className="detail">
          <h1>{tr(exercise.name)}</h1>
          <div className="presc-line">{t('prescription')}: {tr(exercise.prescription)}</div>

          <h2>{t('description')}</h2>
          <p className="descr">{tr(exercise.description)}</p>

          {exercise.note && (
            <div className="note">
              <strong>{t('coachNote')}:</strong> {tr(exercise.note)}
            </div>
          )}

          {exercise.videoUrl && (
            <p style={{ marginTop: 18 }}>
              <a
                className="btn primary"
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                ▶ {t('watchVideo')}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
