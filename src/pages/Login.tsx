import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import type { Role } from '../types';

export default function Login() {
  const { t } = useT();
  const login = useAuth((s) => s.login);
  const lang = useAuth((s) => s.lang);
  const setLang = useAuth((s) => s.setLang);
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const submit = (r: Role, n = name, e = email) => {
    login(n, e, r);
    navigate(r === 'trainer' ? '/dashboard' : '/trainers');
  };

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="logo">🏋️</span> {t('appName')}
          </span>
          <span className="lang-toggle">
            <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>
              RU
            </button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
              EN
            </button>
          </span>
        </div>
        <p className="sub" style={{ marginTop: 8 }}>{t('tagline')}</p>

        <h2>{t('signIn')}</h2>

        <div className="role-switch">
          <button
            className={`role-opt ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            <div className="big">🎓</div>
            <div className="t">{t('student')}</div>
            <div className="d">{lang === 'ru' ? 'Проходить курсы' : 'Follow courses'}</div>
          </button>
          <button
            className={`role-opt ${role === 'trainer' ? 'active' : ''}`}
            onClick={() => setRole('trainer')}
          >
            <div className="big">🧑‍🏫</div>
            <div className="t">{t('trainer')}</div>
            <div className="d">{lang === 'ru' ? 'Создавать курсы' : 'Create courses'}</div>
          </button>
        </div>

        <div className="field">
          <label>{t('name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} />
        </div>
        <div className="field">
          <label>{t('email')}</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            type="email"
          />
        </div>

        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => submit(role)}>
          {t('continueAs')} {t(role)}
        </button>

        <div className="quick">
          <button className="btn small" onClick={() => submit('student', 'Student', 'student@demo.app')}>
            {t('quickStudent')}
          </button>
          <button className="btn small" onClick={() => submit('trainer', 'Rauana Kuangaliyeva', 'rauana@demo.app')}>
            {t('quickTrainer')}
          </button>
        </div>

        <p className="hint">{t('demoHint')}</p>
      </div>
    </div>
  );
}
