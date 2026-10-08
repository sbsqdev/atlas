import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import Footer from '../components/Footer';

export default function Landing() {
  const { t } = useT();
  const lang = useAuth((s) => s.lang);
  const setLang = useAuth((s) => s.setLang);
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const joinWithCode = () => {
    const c = code.trim().toUpperCase();
    navigate('/login', { state: { mode: 'up', role: 'student', code: c } });
  };

  const features = [
    { icon: '🦾', t: t('landF1t'), d: t('landF1d') },
    { icon: '🎯', t: t('landF2t'), d: t('landF2d') },
    { icon: '🤝', t: t('landF3t'), d: t('landF3d') },
  ];
  const steps = [t('landStep1'), t('landStep2'), t('landStep3')];

  return (
    <div className="landing">
      <header className="land-top">
        <span className="brand"><span className="logo">🏋️</span>
          <span>{t('appName')}<small>{t('tagline')}</small></span>
        </span>
        <span className="spacer" />
        <span className="lang-toggle">
          {(['ru', 'en', 'tr'] as const).map((l) => (
            <button key={l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </span>
        <button className="btn small" onClick={() => navigate('/login', { state: { mode: 'in' } })}>{t('landSignIn')}</button>
      </header>

      <main className="land-main">
        <section className="land-hero">
          <div className="hero-copy">
            <h1>{t('landHeroTitle')}</h1>
            <p className="hero-sub">{t('landHeroSub')}</p>
            <div className="hero-cta">
              <button className="btn primary big" onClick={() => navigate('/login', { state: { mode: 'up', role: 'student' } })}>{t('landStart')}</button>
              <button className="btn big" onClick={() => navigate('/login', { state: { mode: 'up', role: 'trainer' } })}>{t('landTrainerCta')}</button>
            </div>
            <p className="privacy-note">🔒 {t('landPrivacyNote')}</p>
          </div>

          <div className="card code-card">
            <h2>🎟️ {t('landCodeTitle')}</h2>
            <p className="muted-sm" style={{ marginBottom: 14 }}>{t('landCodeSub')}</p>
            <div className="code-join">
              <input value={code} placeholder="RAUANA" onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && code.trim() && joinWithCode()} />
              <button className="btn primary" disabled={!code.trim()} onClick={joinWithCode}>{t('landCodeGo')} →</button>
            </div>
            <div className="land-steps">
              {steps.map((s, i) => (
                <div key={i} className="land-step"><span className="step-n">{i + 1}</span>{s}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="land-features">
          {features.map((f, i) => (
            <div key={i} className="card feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </section>

        <section className="land-how card">
          <h2>{t('landHowTitle')}</h2>
          <div className="how-row">
            {steps.map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-n">{i + 1}</div>
                <div>{s}</div>
              </div>
            ))}
          </div>
          <div className="hero-cta" style={{ marginTop: 18 }}>
            <button className="btn primary" onClick={() => navigate('/login', { state: { mode: 'up', role: 'student' } })}>{t('landStart')}</button>
            <Link className="btn" to="/legal/offer">{t('offerDoc')}</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
