import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { computeGamification, type CourseProgress } from '../lib/gamification';

export function useGamification() {
  const { lang } = useT();
  const user = useAuth((s) => s.user);
  const accounts = useAuth((s) => s.accounts);
  const courses = useStore((s) => s.courses);
  const completedForUser = useAuth((s) => s.completedForUser);
  const watchedForUser = useAuth((s) => s.watchedForUser);
  const activityFor = useAuth((s) => s.activityFor);

  const enrolled = accounts.find((a) => a.id === user?.id)?.enrolledCourseIds ?? [];
  const perCourse: CourseProgress[] = courses
    .filter((c) => enrolled.includes(c.id))
    .map((c) => ({
      totalWorkouts: c.workouts.length,
      doneWorkouts: completedForUser(user!.id, c.id).filter((w) => c.workouts.some((x) => x.id === w)).length,
      totalExercises: c.workouts.reduce((n, w) => n + w.exercises.length, 0),
      watched: watchedForUser(user!.id, c.id).length,
    }));
  return computeGamification(perCourse, user ? activityFor(user.id) : [], lang);
}

const DAY_LABELS = { ru: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'], en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], tr: ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'] };

export default function Achievements() {
  const { t, lang } = useT();
  const g = useGamification();

  return (
    <div>
      <h1>🏅 {t('achievements')}</h1>
      <p className="sub">{t('identityLine')}</p>

      <div className="grid cols-3" style={{ marginBottom: 20 }}>
        <div className="card game-stat">
          <div className="game-big">⭐ {t('level')} <b>{g.level}</b></div>
          <div className="level-bar"><span style={{ width: `${(g.intoLevel / g.span) * 100}%` }} /></div>
          <div className="game-sub">{g.intoLevel}/{g.span} XP · {g.toNext} {t('xpToNext')}</div>
        </div>
        <div className="card game-stat">
          <div className="game-big">🔥 <b>{g.streak}</b> {t('days')}</div>
          <div className="game-sub">{t('dontBreakChain')}</div>
          <div className="chain">
            {g.last7.map((on, i) => (
              <span key={i} className={`chain-dot ${on ? 'on' : ''}`}>{DAY_LABELS[lang][i]}</span>
            ))}
          </div>
        </div>
        <div className="card game-stat">
          <div className="game-big">💪 <b>{g.totalDone}</b></div>
          <div className="game-sub">{g.totalDone} {t('workoutsDone')} · ▶ {g.totalWatched} {t('videosWatched')}</div>
          <div className="game-sub" style={{ marginTop: 6 }}>{g.xp} XP</div>
        </div>
      </div>

      <h2>{t('rewards')}</h2>
      <div className="badge-grid">
        {g.badges.map((b) => (
          <div key={b.id} className={`badge ${b.earned ? 'earned' : 'locked'}`}>
            <div className="badge-icon">{b.earned ? b.icon : '🔒'}</div>
            <div className="badge-name">{b.name}</div>
            <div className="badge-desc">{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
