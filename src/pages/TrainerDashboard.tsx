import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import type { Course } from '../types';

let n = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

export default function TrainerDashboard() {
  const { t, tr, lang } = useT();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const courses = useStore((s) => s.courses);
  const addCourse = useStore((s) => s.addCourse);
  const deleteCourse = useStore((s) => s.deleteCourse);
  const reset = useStore((s) => s.reset);

  const mine = courses.filter((c) => c.trainerId === user?.id);

  const create = () => {
    const course: Course = {
      id: newId('course'),
      trainerId: user!.id,
      title: { ru: 'Новый курс', en: 'New course' },
      summary: { ru: '', en: '' },
      level: { ru: 'Начальный', en: 'Beginner' },
      workouts: [],
    };
    addCourse(course);
    navigate(`/dashboard/course/${course.id}`);
  };

  return (
    <div>
      <div className="toolbar">
        <h1 style={{ margin: 0 }}>{t('myCourses')}</h1>
        <span className="spacer" />
        <button
          className="btn ghost small"
          onClick={() => {
            if (confirm(t('confirmReset'))) reset();
          }}
        >
          ↺ {t('resetDemo')}
        </button>
        <button className="btn primary" onClick={create}>+ {t('newCourse')}</button>
      </div>

      {mine.length === 0 ? (
        <p className="placeholder">{t('noCoursesYet')}</p>
      ) : (
        <div className="grid cols-2">
          {mine.map((course) => {
            const total = course.workouts.reduce((a, w) => a + w.exercises.length, 0);
            return (
              <div key={course.id} className="card">
                <span className="pill">{tr(course.level)}</span>
                <h3>{tr(course.title)}</h3>
                <p>{tr(course.summary) || (lang === 'ru' ? 'Без описания' : 'No description')}</p>
                <div className="meta" style={{ marginBottom: 12 }}>
                  <span>📋 {course.workouts.length} {t('workouts')}</span>
                  <span>🏋️ {total} {t('exercises')}</span>
                </div>
                <div className="row-actions">
                  <button
                    className="btn small"
                    onClick={() => navigate(`/dashboard/course/${course.id}`)}
                  >
                    ✎ {t('edit')}
                  </button>
                  <button className="btn small" onClick={() => navigate(`/course/${course.id}`)}>
                    👁 {t('openCourse')}
                  </button>
                  <button
                    className="btn small danger"
                    onClick={() => {
                      if (confirm(`${t('delete')}: ${tr(course.title)}?`)) deleteCourse(course.id);
                    }}
                  >
                    🗑 {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
