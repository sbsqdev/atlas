import { Check, Info } from 'lucide-react';
import { useDb } from '@/data/db';
import { activeSubscriptions, requestPilot, useMe } from '@/data/api';
import { PLANS } from '@/data/content/plans';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { fmtKzt } from '@/lib/format';
import { Badge, Button, Card, PageHeader } from '@/components/ui';

export default function Pricing() {
  const { t } = useT();
  const u = useMe()!;
  const subs = useDb((s) => s.subscriptions);
  const current = new Set(activeSubscriptions(u).map((s) => s.planId));
  const forOrg = (u.role === 'uni_admin' || u.role === 'clinic_admin') && !!u.orgId;
  const requested = new Set(subs.filter((s) => s.status === 'requested' && (forOrg ? s.orgId === u.orgId : s.userId === u.id)).map((s) => s.planId));
  return (
    <div className="animate-fade-up">
      <PageHeader title={t('price.title')} subtitle={t('price.subtitle')} />
      <div className="mb-6 flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-navy-700">
        <Info className="h-5 w-5 shrink-0 text-teal" /> <span>{t('price.noPayments')} {t('price.indicative')}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PLANS.map((p) => {
          const highlight = p.id === 'professional';
          return (
            <Card key={p.id} className={cn('flex flex-col p-5', highlight && 'border-teal ring-2 ring-teal/15')}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {current.has(p.id) && <Badge tone="success">{t('price.current')}</Badge>}
              </div>
              <p className="mt-1 min-h-10 text-[13px] text-navy-500">{p.audience}</p>
              <div className="mt-4">
                {p.priceKzt === null ? <span className="text-2xl font-bold">{t('price.contact')}</span> : (
                  <>
                    <span className="text-2xl font-bold">{fmtKzt(p.priceKzt)}</span>
                    <span className="text-[13px] text-navy-500"> {p.perSeat ? t('price.perSeat') : t('price.perMonth')}</span>
                  </>
                )}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => <li key={f} className="flex gap-2 text-[13px]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{f}</li>)}
              </ul>
              <Button className="mt-5" variant={highlight ? 'primary' : 'secondary'} disabled={current.has(p.id) || requested.has(p.id)} onClick={() => requestPilot(p.id)} data-testid={`pilot-${p.id}`}>
                {requested.has(p.id) ? t('price.requestedShort') : t('price.pilot')}
              </Button>
            </Card>
          );
        })}
      </div>
      {requested.size > 0 && <p className="mt-4 text-sm text-success">{t('price.requested')}</p>}
    </div>
  );
}
