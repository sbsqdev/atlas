import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import type { ReactNode } from 'react';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang } = useT();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const setLang = useAuth((s) => s.setLang);
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="logo">🏋️</span>
          <span>
            {t('appName')}
            <small>{t('tagline')}</small>
          </span>
        </NavLink>

        <nav className="navlinks">
          {user?.role === 'student' && <NavLink to="/home">{t('myCourses')}</NavLink>}
          {user?.role === 'student' && <NavLink to="/achievements">{t('achievements')}</NavLink>}
          {user?.role === 'trainer' && <NavLink to="/dashboard">{t('dashboard')}</NavLink>}
          {user && <NavLink to="/calculators">{t('calculators')}</NavLink>}
        </nav>

        <span className="spacer" />

        <div className="lang-toggle">
          {(['ru', 'en', 'tr'] as const).map((l) => (
            <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {user && (
          <div className="user-chip">
            <span
              className="avatar"
              style={{ background: user.role === 'trainer' ? '#5e8a73' : '#c08a5e' }}
            >
              {initials(user.name)}
            </span>
            <span>
              {user.name}
              <span className="role-tag" style={{ display: 'block' }}>
                {t(user.role)}
              </span>
            </span>
            <button
              className="btn ghost small"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              {t('logout')}
            </button>
          </div>
        )}
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
