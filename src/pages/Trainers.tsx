import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Trainers() {
  const { t, tr } = useT();
  const trainers = useStore((s) => s.trainers);
  const courses = useStore((s) => s.courses);

  return (
    <div>
      <h1>{t('chooseTrainer')}</h1>
      <p className="sub">{t('tagline')}</p>

      {trainers.map((trainer) => {
        const theirCourses = courses.filter((c) => c.trainerId === trainer.id);
        return (
          <section key={trainer.id} className="workout-section">
            <div className="trainer-head">
              <span className="avatar" style={{ background: trainer.avatarColor }}>
                {initials(trainer.name)}
              </span>
              <div>
                <h2 style={{ marginBottom: 2 }}>{trainer.name}</h2>
                <p className="sub" style={{ margin: 0 }}>{tr(trainer.bio)}</p>
              </div>
            </div>

            {theirCourses.length === 0 ? (
              <p className="placeholder">—</p>
            ) : (
              <div className="grid cols-2">
                {theirCourses.map((course) => {
                  const total = course.workouts.reduce((n, w) => n + w.exercises.length, 0);
                  return (
                    <Link key={course.id} to={`/course/${course.id}`} className="card link">
                      <span className="pill">{tr(course.level)}</span>
                      <h3>{tr(course.title)}</h3>
                      <p>{tr(course.summary)}</p>
                      <div className="meta">
                        <span>📋 {course.workouts.length} {t('workouts')}</span>
                        <span>🏋️ {total} {t('exercises')}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
