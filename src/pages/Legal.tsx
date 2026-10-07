import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useT } from '../i18n/useT';
import Footer from '../components/Footer';
import { OFFER, PRIVACY, SELLER, type Section } from '../data/legal';

function Sections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <section key={i} className="legal-section">
          <h2>{s.h}</h2>
          {s.p.map((para, j) => (
            <p key={j}>{para}</p>
          ))}
        </section>
      ))}
    </>
  );
}

function Contacts() {
  return (
    <div className="legal-section">
      <h2>Контакты</h2>
      <p><strong>{SELLER.entity}</strong></p>
      <p>ИИН/БИН: {SELLER.iin}</p>
      <p>Банк: {SELLER.bank}</p>
      <p>Источник данных: {SELLER.taxAuthority}</p>
      <p>Телефон: {SELLER.phone}</p>
      <p>Instagram: <a href={SELLER.instagramUrl} target="_blank" rel="noreferrer noopener">{SELLER.instagram}</a></p>
      <p>Сайт: <a href={SELLER.siteUrl} target="_blank" rel="noreferrer noopener">{SELLER.site}</a></p>
      <p>Юридический адрес: {SELLER.address}</p>
    </div>
  );
}

export default function Legal() {
  const { doc } = useParams();
  const { t } = useT();
  const lang = useAuth((s) => s.lang);
  const user = useAuth((s) => s.user);

  const title = doc === 'privacy' ? t('privacyDoc') : doc === 'contacts' ? t('contactsDoc') : t('offerDoc');
  const home = user ? (user.role === 'trainer' ? '/dashboard' : '/home') : '/login';

  return (
    <div className="legal-wrap">
      <header className="legal-top">
        <Link to={home} className="brand"><span className="logo">🏋️</span> {t('appName')}</Link>
        <Link to={home} className="btn small">← {lang === 'ru' ? 'Назад' : lang === 'tr' ? 'Geri' : 'Back'}</Link>
      </header>

      <main className="legal-body">
        <h1>{title}</h1>
        <p className="legal-updated">
          {lang === 'ru' ? 'Обновлено' : lang === 'tr' ? 'Güncellendi' : 'Updated'}: {SELLER.updated}
          {' · '}{lang === 'ru' ? 'Юридически значимая версия — на русском языке.' : lang === 'tr' ? 'Yasal olarak bağlayıcı sürüm Rusçadır.' : 'The legally binding version is in Russian.'}
        </p>

        {doc === 'privacy' ? <Sections sections={PRIVACY} /> : doc === 'contacts' ? <Contacts /> : <Sections sections={OFFER} />}

        <div className="legal-nav">
          <Link to="/legal/offer" className="btn small">{t('offerDoc')}</Link>
          <Link to="/legal/privacy" className="btn small">{t('privacyDoc')}</Link>
          <Link to="/legal/contacts" className="btn small">{t('contactsDoc')}</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
