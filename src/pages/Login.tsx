import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import { DEMO_COACH, DEMO_STUDENT } from '../data/seed';
import type { Role } from '../types';

type Mode = 'in' | 'up';

export default function Login() {
  const { t } = useT();
  const signIn = useAuth((s) => s.signIn);
  const signUp = useAuth((s) => s.signUp);
  const lang = useAuth((s) => s.lang);
  const setLang = useAuth((s) => s.setLang);
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('in');
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const go = (r: Role) => navigate(r === 'trainer' ? '/dashboard' : '/home');

  const submit = () => {
    setError(null);
    const res =
      mode === 'in'
        ? signIn(email, password)
        : signUp(name, email, password, role, role === 'student' ? code : undefined);
    if (!res.ok) {
      setError(res.error ? t(res.error) : t('fillFields'));
      return;
    }
    go(mode === 'in' ? useAuth.getState().user!.role : role);
  };

  const demo = (creds: { email: string; password: string }, r: Role) => {
    setError(null);
    const res = signIn(creds.email, creds.password);
    if (res.ok) go(r);
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="logo">🏋️</span> {t('appName')}
          </span>
          <span className="lang-toggle">
            {(['ru', 'en', 'tr'] as const).map((l) => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </span>
        </div>
        <p className="sub" style={{ marginTop: 8 }}>{t('tagline')}</p>

        <div className="seg" style={{ marginBottom: 18 }}>
          <button className={mode === 'in' ? 'active' : ''} onClick={() => { setMode('in'); setError(null); }}>
            {t('signIn')}
          </button>
          <button className={mode === 'up' ? 'active' : ''} onClick={() => { setMode('up'); setError(null); }}>
            {t('signUp')}
          </button>
        </div>

        {mode === 'up' && (
          <>
            <div className="role-switch">
              <button className={`role-opt ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                <div className="big">🎓</div>
                <div className="t">{t('student')}</div>
              </button>
              <button className={`role-opt ${role === 'trainer' ? 'active' : ''}`} onClick={() => setRole('trainer')}>
                <div className="big">🧑‍🏫</div>
                <div className="t">{t('trainer')}</div>
              </button>
            </div>
            <div className="field">
              <label>{t('name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} />
            </div>
          </>
        )}

        <div className="field">
          <label>{t('email')}</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" type="email" />
        </div>
        <div className="field">
          <label>{t('password')}</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password"
            onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        {mode === 'up' && role === 'student' && (
          <div className="field">
            <label>{t('inviteCode')}</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RAUANA" />
            <p className="hint" style={{ marginTop: 6 }}>{t('inviteCodeHint')}</p>
          </div>
        )}

        {error && <p style={{ color: '#b4544a', fontSize: 13, margin: '4px 0 12px' }}>{error}</p>}

        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit}>
          {mode === 'in' ? t('signIn') : t('createAccount')}
        </button>

        <p className="hint" style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }}>
          {mode === 'in' ? t('noAccount') : t('haveAccount')}
        </p>

        <div className="quick">
          <button className="btn small" onClick={() => demo(DEMO_STUDENT, 'student')}>{t('demoStudent')}</button>
          <button className="btn small" onClick={() => demo(DEMO_COACH, 'trainer')}>{t('demoCoach')}</button>
        </div>
        <p className="hint">{t('demoHint')}</p>
      </div>
    </div>
  );
}
