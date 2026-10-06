import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { useGamification } from './Achievements';

export default function StudentHome() {
  const { t, tr, lang } = useT();
  const courses = useStore((s) => s.courses);
  const accounts = useAuth((s) => s.accounts);
  const user = useAuth((s) => s.user);
  const joinByCode = useAuth((s) => s.joinByCode);
  const completedFor = useAuth((s) => s.completedFor);
  // Re-read enrolled ids reactively from accounts (so joins re-render).
  const enrolledIds = accounts.find((a) => a.id === user?.id)?.enrolledCourseIds ?? [];

  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const mine = courses.filter((c) => enrolledIds.includes(c.id));

  const submit = () => {
    const res = joinByCode(code);
    if (res.ok) {
      setMsg({ ok: true, text: t('enrolledOk') });
      setCode('');
    } else {
      setMsg({ ok: false, text: res.error ? t(res.error) : t('codeInvalid') });
    }
  };

  const g = useGamification();

  return (
    <div>
      <h1>{t('myCourses')}</h1>
      <p className="sub">{t('tagline')}</p>

      <Link to="/achievements" className="game-banner">
        <span className="gb-item">⭐ {t('level')} <b>{g.level}</b></span>
        <span className="gb-bar"><span style={{ width: `${(g.intoLevel / g.span) * 100}%` }} /></span>
        <span className="gb-item">🔥 <b>{g.streak}</b> {t('days')}</span>
        <span className="gb-item">💪 <b>{g.totalDone}</b></span>
        <span className="gb-item">▶ <b>{g.totalWatched}</b></span>
        <span className="gb-cta">{t('achievements')} →</span>
      </Link>

      <div className="card" style={{ marginBottom: 24, maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>{t('joinByCode')}</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>{t('inviteCodeHint')}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="RAUANA"
            style={{ flex: 1, background: 'var(--panel)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)' }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn primary" onClick={submit}>{t('join')}</button>
        </div>
        {msg && (
          <p style={{ color: msg.ok ? 'var(--accent)' : '#b4544a', fontSize: 13, marginBottom: 0 }}>{msg.text}</p>
        )}
      </div>

      {mine.length === 0 ? (
        <p className="placeholder">{t('noEnrollments')}</p>
      ) : (
        <div className="grid cols-2">
          {mine.map((course) => {
            const total = course.workouts.length;
            const done = completedFor(course.id).filter((w) => course.workouts.some((x) => x.id === w)).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const coach = accounts.find((a) => a.id === course.trainerId);
            return (
              <Link key={course.id} to={`/course/${course.id}`} className="card link">
                <span className="pill">{tr(course.level)}</span>
                <h3>{tr(course.title)}</h3>
                {coach && (
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                    {t('by')}: <strong style={{ color: coach.brandColor || 'var(--accent)' }}>{coach.brandName || coach.name}</strong>
                  </p>
                )}
                <p>{tr(course.summary)}</p>
                <div className="progress-line">
                  <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
                  <span className="progress-label">{pct}% {t('completed')} · {done}/{total} {lang === 'ru' ? 'трен.' : lang === 'tr' ? 'antr.' : 'wk'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
