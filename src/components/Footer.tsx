import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { SELLER } from '../data/legal';

export default function Footer({ compact }: { compact?: boolean }) {
  const { t } = useT();
  return (
    <footer className={`site-footer${compact ? ' compact' : ''}`}>
      <div className="foot-links">
        <Link to="/legal/offer">{t('offerDoc')}</Link>
        <Link to="/legal/privacy">{t('privacyDoc')}</Link>
        <Link to="/legal/contacts">{t('contactsDoc')}</Link>
      </div>
      <div className="foot-legal">
        {SELLER.entity} · ИИН {SELLER.iin}
      </div>
    </footer>
  );
}
