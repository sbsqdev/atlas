import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { computeGamification, type CourseProgress } from '../lib/gamification';
import { habitStreak, consistency, doneToday, habitTemplates } from '../lib/habits';
import { notificationState, requestNotifyPermission } from '../lib/reminders';
import Celebrate from '../components/Celebrate';
import type { Goal, Habit } from '../types';

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

/** One habit: identity + daily check-in + streak, expandable 4-laws editor. */
function HabitCard({ habit }: { habit: Habit }) {
  const { t, lang } = useT();
  const updateHabit = useAuth((s) => s.updateHabit);
  const removeHabit = useAuth((s) => s.removeHabit);
  const toggleHabitDone = useAuth((s) => s.toggleHabitDone);
  const [open, setOpen] = useState(false);

  const done = doneToday(habit);
  const streak = habitStreak(habit.checkIns);
  const cons = consistency(habit.checkIns);
  const days = DAY_LABELS[lang];

  const field = (key: keyof Habit, value: string) => updateHabit(habit.id, { [key]: value } as Partial<Habit>);
  const toggleDay = (i: number) => {
    const set = new Set(habit.remindDays ?? []);
    set.has(i) ? set.delete(i) : set.add(i);
    updateHabit(habit.id, { remindDays: [...set].sort((a, b) => a - b) });
  };

  return (
    <div className="card habit-item">
      <div className="habit-head">
        <button
          className={`check-btn ${done ? 'on' : ''}`}
          onClick={() => toggleHabitDone(habit.id)}
          aria-label={done ? t('doneTodayOk') : t('doneTodayBtn')}
          title={done ? t('doneTodayOk') : t('doneTodayBtn')}
        >
          {done ? '✓' : ''}
        </button>
        <div className="habit-main">
          <div className="habit-title">{habit.title}</div>
          {habit.identity && <div className="habit-identity">“{habit.identity}”</div>}
          <div className="habit-meta">
            <span className="streak-pill">🔥 {streak} {t('streakLabel')}</span>
            <span className="cons-pill">{cons}% {t('consistency30')}</span>
            {habit.remindOn && habit.time && <span className="rem-pill">⏰ {habit.time}</span>}
          </div>
        </div>
        <button className="btn ghost small" onClick={() => setOpen((v) => !v)} aria-label="edit">
          {open ? '▲' : '⚙'}
        </button>
      </div>

      {open && (
        <div className="habit-edit">
          <div className="field"><label>{t('identityLabel')}</label>
            <input defaultValue={habit.identity ?? ''} placeholder={t('identityPh')} onBlur={(e) => field('identity', e.target.value)} /></div>

          <div className="law-block">
            <div className="law-head">{t('cueLabel')}</div>
            <div className="field-row">
              <div className="field"><label>⏰</label>
                <input type="time" defaultValue={habit.time ?? ''} onBlur={(e) => field('time', e.target.value)} /></div>
              <div className="field"><label>📍</label>
                <input defaultValue={habit.place ?? ''} placeholder={t('placePh')} onBlur={(e) => field('place', e.target.value)} /></div>
            </div>
            <div className="field"><label>{t('afterLabel')}</label>
              <input defaultValue={habit.afterHabit ?? ''} placeholder={t('stackPh')} onBlur={(e) => field('afterHabit', e.target.value)} /></div>
          </div>

          <div className="law-block">
            <div className="law-head">{t('attractiveLabel')}</div>
            <div className="field"><input defaultValue={habit.bundle ?? ''} placeholder={t('bundlePh')} onBlur={(e) => field('bundle', e.target.value)} /></div>
          </div>
          <div className="law-block">
            <div className="law-head">{t('easyLabel')}</div>
            <div className="field"><input defaultValue={habit.twoMinute ?? ''} placeholder={t('twoMinPh')} onBlur={(e) => field('twoMinute', e.target.value)} /></div>
          </div>
          <div className="law-block">
            <div className="law-head">{t('satisfyingLabel')}</div>
            <div className="field"><input defaultValue={habit.reward ?? ''} placeholder={t('rewardPh')} onBlur={(e) => field('reward', e.target.value)} /></div>
          </div>

          <div className="law-block">
            <label className="switch-row">
              <input type="checkbox" checked={!!habit.remindOn} onChange={(e) => updateHabit(habit.id, { remindOn: e.target.checked })} />
              <span>{t('reminderLabel')}{habit.time ? ` · ${habit.time}` : ''}</span>
            </label>
            {habit.remindOn && (
              <div className="day-row">
                {days.map((d, i) => (
                  <button
                    key={i}
                    className={`day-btn ${(habit.remindDays ?? []).includes(i) || !(habit.remindDays ?? []).length ? 'on' : ''}`}
                    onClick={() => toggleDay(i)}
                  >{d}</button>
                ))}
              </div>
            )}
          </div>

          <button className="btn ghost small danger" onClick={() => removeHabit(habit.id)}>🗑 {t('deleteHabit')}</button>
        </div>
      )}
    </div>
  );
}

/** Browser Web-Notifications toggle. */
function BrowserReminders() {
  const { t } = useT();
  const [state, setState] = useState(notificationState());
  return (
    <div className="card notif-card">
      <div className="notif-row">
        <div>
          <strong>🔔 {t('browserReminders')}</strong>
          <div className="muted-sm">{t('notifHint')}</div>
        </div>
        {state === 'granted' && <span className="ok-pill">✓ {t('notifOn')}</span>}
        {state === 'default' && (
          <button className="btn primary small" onClick={async () => setState((await requestNotifyPermission()) ? 'granted' : notificationState())}>
            {t('enableNotif')}
          </button>
        )}
        {state === 'denied' && <span className="warn-sm">{t('notifDenied')}</span>}
        {state === 'unsupported' && <span className="warn-sm">{t('notifUnsupported')}</span>}
      </div>
    </div>
  );
}

/** Opt-in e-mail reminders (collected only with separate consent). */
function EmailReminders() {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const accounts = useAuth((s) => s.accounts);
  const setReminderEmail = useAuth((s) => s.setReminderEmail);
  const clearReminderEmail = useAuth((s) => s.clearReminderEmail);
  const acc = accounts.find((a) => a.id === user?.id);
  const [email, setEmail] = useState(acc?.remindEmail ?? '');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');

  if (acc?.remindByEmail && acc.remindEmail) {
    return (
      <div className="card notif-card">
        <div className="notif-row">
          <div><strong>✉️ {t('emailReminders')}</strong>
            <div className="muted-sm">{t('emailSavedAs')} <b>{acc.remindEmail}</b></div></div>
          <button className="btn ghost small" onClick={() => { clearReminderEmail(); setEmail(''); setConsent(false); }}>{t('turnOff')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card notif-card">
      <strong>✉️ {t('emailReminders')}</strong>
      <div className="muted-sm" style={{ margin: '4px 0 10px' }}>{t('emailRemindHint')}</div>
      <div className="field"><input type="email" value={email} placeholder={t('emailPh')} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></div>
      <label className="consent-row" style={{ fontSize: 13 }}>
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErr(''); }} />
        <span>{t('emailConsent')}</span>
      </label>
      {err && <div className="warn-sm" style={{ marginTop: 6 }}>{err}</div>}
      <button className="btn primary small" style={{ marginTop: 10 }}
        onClick={() => { const r = setReminderEmail(email, consent); if (!r.ok) setErr(r.error === 'consentRequired' ? t('consentRequired') : t('emailPh')); }}>
        {t('saveEmail')}
      </button>
    </div>
  );
}

/** The "Today" focus card — the engine that makes you act right now:
 *  shows today's unchecked habits with one-tap done, and warns when the
 *  streak is about to break. */
function TodayCard() {
  const { t } = useT();
  const navigate = useNavigate();
  const habits = useAuth((s) => (s.user ? s.habits[s.user.id] ?? [] : []));
  const toggleHabitDone = useAuth((s) => s.toggleHabitDone);
  const g = useGamification();
  const todo = habits.filter((h) => !doneToday(h));
  const activeToday = g.last7[g.last7.length - 1];
  const atRisk = g.streak > 0 && !activeToday;

  return (
    <div className="card today-card">
      <div className="today-head">
        <h2 style={{ margin: 0 }}>☀️ {t('todayTitle')}</h2>
        <span className="today-streak">🔥 {g.streak}</span>
      </div>
      <p className="today-sub">{t('todaySub')}</p>

      {atRisk && (
        <div className="risk-banner">⚠️ {t('streakAtRisk')} <b>{g.streak}</b> 🔥</div>
      )}

      {habits.length === 0 ? (
        <p className="muted-sm">{t('todayNoHabits')}</p>
      ) : todo.length === 0 ? (
        <div className="today-done">✅ {t('todayAllDone')}</div>
      ) : (
        <div className="today-list">
          {todo.map((h) => (
            <button key={h.id} className="today-item" onClick={() => toggleHabitDone(h.id)}>
              <span className="today-check" />
              <span className="today-name">{h.title}{h.time ? ` · ⏰ ${h.time}` : ''}</span>
              <span className="today-go">{t('todayDoOne')} ✓</span>
            </button>
          ))}
        </div>
      )}

      <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => navigate('/home')}>{t('todayOpenTraining')}</button>
    </div>
  );
}

function GoalCard({ goal, workoutsDone, habits }: { goal: Goal; workoutsDone: number; habits: Habit[] }) {
  const { t } = useT();
  const incGoal = useAuth((s) => s.incGoal);
  const removeGoal = useAuth((s) => s.removeGoal);
  const updateGoal = useAuth((s) => s.updateGoal);
  const [celebrate, setCelebrate] = useState(false);

  const current = goal.source === 'manual'
    ? goal.manualCount ?? 0
    : goal.source === 'workouts'
      ? workoutsDone
      : habits.find((h) => h.id === goal.habitId)?.checkIns.length ?? 0;
  const pct = Math.min(100, Math.round((current / Math.max(1, goal.target)) * 100));
  const done = current >= goal.target;

  useEffect(() => {
    if (done && !goal.celebrated) {
      setCelebrate(true);
      updateGoal(goal.id, { celebrated: true, doneAt: goal.doneAt ?? Date.now() });
    }
  }, [done, goal.celebrated, goal.id, goal.doneAt, updateGoal]);

  return (
    <div className={`card goal-item${done ? ' done' : ''}`}>
      <Celebrate show={celebrate} onClose={() => setCelebrate(false)} />
      <div className="goal-head">
        <div className="goal-main">
          <div className="goal-title">{done ? '✅ ' : '🎯 '}{goal.title}</div>
          {goal.why && <div className="goal-why">“{goal.why}”</div>}
        </div>
        <button className="btn ghost small danger" onClick={() => removeGoal(goal.id)} aria-label="delete">🗑</button>
      </div>
      <div className="goal-prog">
        <div className="goal-track"><span style={{ width: `${pct}%` }} /></div>
        <div className="goal-nums"><b>{current}</b> {t('goalProgressOf')} {goal.target} {goal.unit || ''} · {pct}%</div>
      </div>
      {goal.source === 'manual' && !done && (
        <button className="btn primary small" onClick={() => incGoal(goal.id, 1)}>{t('logOne')}</button>
      )}
      {done && <div className="goal-done-badge">🎉 {t('goalDone')}</div>}
    </div>
  );
}

function Goals() {
  const { t } = useT();
  const g = useGamification();
  const goals = useAuth((s) => (s.user ? s.goals[s.user.id] ?? [] : []));
  const habits = useAuth((s) => (s.user ? s.habits[s.user.id] ?? [] : []));
  const addGoal = useAuth((s) => s.addGoal);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [target, setTarget] = useState(12);
  const [unit, setUnit] = useState('');
  const [source, setSource] = useState<'manual' | 'workouts' | 'habit'>('workouts');
  const [habitId, setHabitId] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      why: why.trim() || undefined,
      target: Math.max(1, Number(target) || 1),
      unit: unit.trim() || undefined,
      source,
      habitId: source === 'habit' ? (habitId || habits[0]?.id) : undefined,
    });
    setTitle(''); setWhy(''); setTarget(12); setUnit(''); setOpen(false);
  };

  return (
    <div className="goals-section" style={{ marginBottom: 26 }}>
      <h2 style={{ marginBottom: 4 }}>🎯 {t('myGoals')}</h2>
      <p className="sub" style={{ marginTop: 0 }}>{t('goalsHint')}</p>

      {goals.length === 0 && <p className="placeholder" style={{ margin: '8px 0' }}>{t('noGoalsYet')}</p>}

      <div className="goal-list">
        {goals.map((goal) => <GoalCard key={goal.id} goal={goal} workoutsDone={g.totalDone} habits={habits} />)}
      </div>

      {!open ? (
        <button className="btn primary" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>+ {t('newGoal')}</button>
      ) : (
        <div className="card goal-form" style={{ marginTop: 12 }}>
          <div className="field"><label>{t('newGoal')}</label>
            <input value={title} placeholder={t('goalTitlePh')} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>{t('goalWhyLabel')}</label>
            <input value={why} placeholder={t('goalWhyPh')} onChange={(e) => setWhy(e.target.value)} /></div>
          <div className="field-row">
            <div className="field"><label>{t('goalTargetLabel')}</label>
              <input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} /></div>
            <div className="field"><label>{t('goalUnitPh')}</label>
              <input value={unit} placeholder={t('goalUnitPh')} onChange={(e) => setUnit(e.target.value)} /></div>
          </div>
          <div className="field"><label>{t('goalSourceLabel')}</label>
            <select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
              <option value="workouts">{t('srcWorkouts')}</option>
              <option value="manual">{t('srcManual')}</option>
              {habits.length > 0 && <option value="habit">{t('srcHabit')}</option>}
            </select></div>
          {source === 'habit' && habits.length > 0 && (
            <div className="field">
              <select value={habitId} onChange={(e) => setHabitId(e.target.value)}>
                {habits.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
              </select>
            </div>
          )}
          <div className="row-actions">
            <button className="btn primary" disabled={!title.trim()} onClick={submit}>{t('addGoalBtn')}</button>
            <button className="btn ghost" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Habits() {
  const { t, lang } = useT();
  const habits = useAuth((s) => (s.user ? s.habits[s.user.id] ?? [] : []));
  const addHabit = useAuth((s) => s.addHabit);
  const [name, setName] = useState('');
  const templates = habitTemplates(lang);
  const usedTitles = new Set(habits.map((h) => h.title.toLowerCase()));

  return (
    <div className="habits-section">
      <h2 style={{ marginBottom: 4 }}>🧩 {t('myHabits')}</h2>
      <p className="sub" style={{ marginTop: 0 }}>{t('habitsHint')}</p>

      {habits.length === 0 && <p className="placeholder" style={{ margin: '8px 0' }}>{t('noHabitsYet')}</p>}

      <div className="habit-list">
        {habits.map((h) => <HabitCard key={h.id} habit={h} />)}
      </div>

      <div className="add-habit">
        <input value={name} placeholder={t('habitNamePh')} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { addHabit({ title: name.trim() }); setName(''); } }} />
        <button className="btn primary" disabled={!name.trim()} onClick={() => { if (name.trim()) { addHabit({ title: name.trim() }); setName(''); } }}>
          + {t('addHabit')}
        </button>
      </div>

      <div className="tmpl-label">{t('quickStart')}</div>
      <div className="tmpl-row">
        {templates.filter((tm) => !usedTitles.has(tm.title.toLowerCase())).map((tm) => (
          <button key={tm.title} className="tmpl-chip" onClick={() => addHabit({ ...tm, remindOn: true })}>+ {tm.title}</button>
        ))}
      </div>

      <div className="reminders-grid">
        <BrowserReminders />
        <EmailReminders />
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

      <TodayCard />

      <div className="grid cols-3" style={{ marginBottom: 20, marginTop: 20 }}>
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

      <Goals />

      <Habits />

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
