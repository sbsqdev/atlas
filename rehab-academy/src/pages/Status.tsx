import { Link } from 'react-router-dom';
import { Lock, SearchX } from 'lucide-react';
import { buttonVariants, EmptyState } from '@/components/ui';
import { useT } from '@/i18n';

export function Forbidden() {
  const { t } = useT();
  return <EmptyState icon={<Lock className="h-6 w-6" />} title={t('common.forbidden')} action={<Link className={buttonVariants({ variant: 'secondary' })} to="/">{t('common.toHome')}</Link>} />;
}
export function NotFound() {
  const { t } = useT();
  return <EmptyState icon={<SearchX className="h-6 w-6" />} title={t('common.notFound')} action={<Link className={buttonVariants({ variant: 'secondary' })} to="/">{t('common.toHome')}</Link>} />;
}
