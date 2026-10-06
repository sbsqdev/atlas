import { useState } from 'react';
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

function HabitBuilder() {
  const { t } = useT();
  const getHabitPlan = useAuth((s) => s.getHabitPlan);
  const setHabitPlan = useAuth((s) => s.setHabitPlan);
  const plan = getHabitPlan();
  const [time, setTime] = useState(plan.time ?? '');
  const [place, setPlace] = useState(plan.place ?? '');
  const [after, setAfter] = useState(plan.afterHabit ?? '');
  const [saved, setSaved] = useState(false);

  const intention = t('intentionSentence')
    .replace('{time}', time || '…')
    .replace('{place}', place || '…');
  const stack = t('stackSentence').replace('{after}', after || '…');

  const laws = [
    { t: t('law1t'), d: t('law1d'), i: '👁' },
    { t: t('law2t'), d: t('law2d'), i: '✨' },
    { t: t('law3t'), d: t('law3d'), i: '🎯' },
    { t: t('law4t'), d: t('law4d'), i: '🏆' },
  ];

  return (
    <div className="card habit-card" style={{ marginBottom: 20 }}>
      <h2 style={{ marginTop: 0 }}>🧩 {t('habitBuilder')}</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>{t('habitBuilderHint')}</p>

      <div className="habit-plan-box"><strong>{intention}</strong></div>
      <div className="field-row">
        <div className="field"><label>{t('intentionTitle')} · ⏰</label>
          <input value={time} onChange={(e) => { setTime(e.target.value); setSaved(false); }} placeholder={t('timePh')} /></div>
        <div className="field"><label>📍</label>
          <input value={place} onChange={(e) => { setPlace(e.target.value); setSaved(false); }} placeholder={t('placePh')} /></div>
      </div>

      <div className="habit-plan-box"><strong>{stack}</strong></div>
      <div className="field"><label>{t('stackTitle')}</label>
        <input value={after} onChange={(e) => { setAfter(e.target.value); setSaved(false); }} placeholder={t('stackPh')} /></div>

      <button className="btn primary" onClick={() => { setHabitPlan({ time, place, afterHabit: after }); setSaved(true); }}>
        {saved ? '✓ ' + t('myPlan') : t('saveHabit')}
      </button>

      <h4 style={{ margin: '20px 0 10px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>{t('fourLaws')}</h4>
      <div className="laws-grid">
        {laws.map((l, i) => (
          <div key={i} className="law">
            <div className="law-i">{l.i}</div>
            <div><div className="law-t">{l.t}</div><div className="law-d">{l.d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      <HabitBuilder />

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
