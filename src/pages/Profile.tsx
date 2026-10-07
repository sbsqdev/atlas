import { Link } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { useGamification } from './Achievements';
import { bestStreakOf, activityHeatmap } from '../lib/gamification';
import { habitStreak } from '../lib/habits';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const accounts = useAuth((s) => s.accounts);
  const activityFor = useAuth((s) => s.activityFor);
  const goals = useAuth((s) => (s.user ? s.goals[s.user.id] ?? [] : []));
  const habits = useAuth((s) => (s.user ? s.habits[s.user.id] ?? [] : []));
  const g = useGamification();

  if (!user) return null;
  const acc = accounts.find((a) => a.id === user.id);
  const activity = activityFor(user.id);
  const best = bestStreakOf(activity);
  const heat = activityHeatmap(activity, 20);

  const goalDone = (go: typeof goals[number]) => {
    const cur = go.source === 'manual' ? go.manualCount ?? 0
      : go.source === 'workouts' ? g.totalDone
      : habits.find((h) => h.id === go.habitId)?.checkIns.length ?? 0;
    return cur >= go.target;
  };
  const goalsDone = goals.filter(goalDone).length;
  const bestHabit = habits.reduce((m, h) => Math.max(m, habitStreak(h.checkIns)), 0);
  const badgesEarned = g.badges.filter((b) => b.earned).length;

  const tiles: Array<{ icon: string; big: string | number; label: string; hot?: boolean }> = [
    { icon: '⭐', big: g.level, label: `${t('level')} · ${g.xp} XP` },
    { icon: '🔥', big: g.streak, label: t('statCurStreak'), hot: g.streak > 0 },
    { icon: '🏅', big: best, label: t('statBestStreak') },
    { icon: '💪', big: g.totalDone, label: t('statWorkouts') },
    { icon: '▶', big: g.totalWatched, label: t('statVideos') },
    { icon: '📅', big: activity.length, label: t('statActiveDays') },
    { icon: '🎯', big: `${goalsDone}/${goals.length}`, label: t('statGoalsDone') },
    { icon: '🧩', big: habits.length, label: `${t('statHabits')} · 🔥${bestHabit}` },
    { icon: '🏆', big: `${badgesEarned}/${g.badges.length}`, label: t('statBadges') },
  ];

  return (
    <div>
      <div className="profile-head">
        <span className="avatar profile-avatar" style={{ background: acc?.avatarColor || '#8b5cf6' }}>{initials(user.name)}</span>
        <div>
          <h1 style={{ margin: 0 }}>{user.name}</h1>
          <p className="sub" style={{ margin: '4px 0 0' }}>{t('identityLine')}</p>
        </div>
      </div>

      <div className="level-bar" style={{ margin: '4px 0 22px' }}>
        <span style={{ width: `${(g.intoLevel / g.span) * 100}%` }} />
      </div>

      <div className="profile-grid">
        {tiles.map((tile, i) => (
          <div key={i} className={`card stat-tile${tile.hot ? ' hot' : ''}`}>
            <div className="stat-icon">{tile.icon}</div>
            <div className="stat-big">{tile.big}</div>
            <div className="stat-label">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="card heat-card">
        <div className="heat-head">
          <h2 style={{ margin: 0 }}>{t('activityTitle')}</h2>
          <span className="muted-sm">{t('activityLegend')}</span>
        </div>
        <div className="heatmap">
          {heat.map((on, i) => <span key={i} className={`heat-cell${on ? ' on' : ''}`} />)}
        </div>
        <p className="keep-going">✨ {t('keepGoing')}</p>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link className="btn primary" to="/home">{t('toTrainings')}</Link>
      </div>
    </div>
  );
}
