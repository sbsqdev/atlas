import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDb } from '@/data/db';
import { activatePilot, cancelSubscription, createOrg, createOrgAdmin, roleKey, useMe } from '@/data/api';
import { PLANS, PLAN_BY_ID } from '@/data/content/plans';
import { SIMULATIONS } from '@/data/content/simulations';
import type { OrgType, PlanId } from '@/data/types';
import { useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { Badge, Button, Card, CardHeader, Dialog, Field, Input, PageHeader, Select, Tabs } from '@/components/ui';

type Tab = 'orgs' | 'subs' | 'users' | 'sims' | 'audit';
type PilotTarget = { orgId?: string; userId?: string; label: string; planId: PlanId };

export default function Admin() {
  const { t, locale } = useT();
  useMe();
  const d = useDb();
  const [tab, setTab] = useState<Tab>('orgs');
  const [err, setErr] = useState<I18nKey | null>(null);
  const [orgForm, setOrgForm] = useState<{ name: string; type: OrgType; city: string } | null>(null);
  const [adminForm, setAdminForm] = useState<{ orgId: string; email: string; fullName: string } | null>(null);
  const [created, setCreated] = useState<{ email: string; pwd: string } | null>(null);
  const [pilot, setPilot] = useState<(PilotTarget & { seats: number; days: number }) | null>(null);
  const guard = (fn: () => void) => { try { fn(); setErr(null); } catch (e) { setErr(errorKey(e)); } };
  const orgs = d.orgs.filter((o) => o.type !== 'platform');
  const requests = d.subscriptions.filter((s) => s.status === 'requested');

  return (
    <div className="animate-fade-up">
      <PageHeader title={t('adm.title')} subtitle={t('adm.pilotNote')} />
      <Tabs value={tab} onChange={setTab} items={[
        { value: 'orgs', label: t('adm.orgs') }, { value: 'subs', label: `${t('adm.subs')}${requests.length ? ` (${requests.length})` : ''}` },
        { value: 'users', label: t('adm.users') }, { value: 'sims', label: t('adm.simLibrary') }, { value: 'audit', label: t('adm.audit') },
      ]} />
      {err && <div className="mt-4 rounded-xl bg-[#FBE7E9] px-4 py-3 text-sm text-error">{t(err)}</div>}
      {created && <div className="mt-4 rounded-xl border border-success/30 bg-[#E3F5F1] p-4 text-sm">{created.email} — {t('org.tempPassword')} <span className="font-mono font-semibold">{created.pwd}</span></div>}

      {tab === 'orgs' && (
        <Card className="mt-5 overflow-x-auto">
          <CardHeader title={t('adm.orgs')} action={<Button size="sm" onClick={() => setOrgForm({ name: '', type: 'university', city: '' })} data-testid="new-org"><Plus className="h-4 w-4" /> {t('adm.newOrg')}</Button>} />
          <table className="mt-3 w-full min-w-[760px] text-sm">
            <thead className="border-y border-line bg-bg text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-2.5">{t('adm.orgName')}</th><th className="px-3 py-2.5">{t('adm.orgType')}</th><th className="px-3 py-2.5">{t('dash.users')}</th><th className="px-3 py-2.5">{t('org.license')}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map((o) => {
                const sub = d.subscriptions.find((s) => s.orgId === o.id && (s.status === 'pilot' || s.status === 'active') && s.endsAt > Date.now());
                return (
                  <tr key={o.id}>
                    <td className="px-5 py-2.5"><div className="font-medium">{o.name}</div><div className="text-[12px] text-navy-500">{o.city}</div></td>
                    <td className="px-3 py-2.5"><Badge tone="gray">{t(`adm.type.${o.type}` as I18nKey)}</Badge></td>
                    <td className="px-3 py-2.5">{d.users.filter((u) => u.orgId === o.id).length}</td>
                    <td className="px-3 py-2.5">{sub ? <span>{PLAN_BY_ID[sub.planId].name} · {sub.seats} · {fmtDate(sub.endsAt, locale)}</span> : <span className="text-navy-500">—</span>}</td>
                    <td className="space-x-2 whitespace-nowrap px-3 py-2.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setAdminForm({ orgId: o.id, email: '', fullName: '' })}>{t('adm.addAdmin')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setPilot({ orgId: o.id, label: o.name, planId: o.type === 'clinic' ? 'clinic' : 'university', seats: 25, days: 90 })} data-testid={`pilot-org-${o.id}`}>{t('adm.activatePilot')}</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'subs' && (
        <Card className="mt-5 overflow-x-auto">
          <CardHeader title={t('adm.subs')} subtitle={t('adm.pilotNote')} />
          <table className="mt-3 w-full min-w-[760px] text-sm">
            <thead className="border-y border-line bg-bg text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-2.5">{t('adm.subject')}</th><th className="px-3 py-2.5">{t('org.plan')}</th><th className="px-3 py-2.5">{t('common.status')}</th><th className="px-3 py-2.5">{t('org.validUntil')}</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...d.subscriptions].sort((a, b) => b.startedAt - a.startedAt).map((s) => {
                const label = s.orgId ? d.orgs.find((o) => o.id === s.orgId)?.name : d.users.find((u) => u.id === s.userId)?.fullName;
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-2.5 font-medium">{label}</td>
                    <td className="px-3 py-2.5">{PLAN_BY_ID[s.planId].name} · {s.seats}</td>
                    <td className="px-3 py-2.5"><Badge tone={s.status === 'requested' ? 'cyan' : s.status === 'cancelled' ? 'gray' : 'warning'}>{t(`sub.${s.status}` as I18nKey)}</Badge></td>
                    <td className="px-3 py-2.5 text-navy-500">{s.status === 'requested' ? '—' : fmtDate(s.endsAt, locale)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {s.status === 'requested' && <Button size="sm" onClick={() => setPilot({ orgId: s.orgId ?? undefined, userId: s.userId ?? undefined, label: label ?? '', planId: s.planId, seats: s.seats, days: 30 })} data-testid="approve-request">{t('adm.activatePilot')}</Button>}
                      {(s.status === 'pilot' || s.status === 'active') && <Button size="sm" variant="ghost" onClick={() => guard(() => cancelSubscription(s.id))}>{t('common.cancel')}</Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'users' && (
        <Card className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-bg text-left text-[12px] uppercase tracking-wider text-navy-500">
              <tr><th className="px-5 py-2.5">{t('auth.fullName')}</th><th className="px-3 py-2.5">{t('auth.role')}</th><th className="px-3 py-2.5">{t('set.org')}</th><th className="px-3 py-2.5">{t('common.date')}</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-2.5"><div className="font-medium">{u.fullName} {u.demo && <Badge tone="warning" className="ml-1">DEMO</Badge>}</div><div className="text-[12px] text-navy-500">{u.email}</div></td>
                  <td className="px-3 py-2.5">{t(roleKey(u) as I18nKey)}</td>
                  <td className="px-3 py-2.5 text-navy-500">{d.orgs.find((o) => o.id === u.orgId)?.name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-navy-500">{fmtDate(u.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'sims' && (
        <Card className="mt-5">
          <ul className="divide-y divide-line">
            {SIMULATIONS.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div><div className="font-medium">{s.title}</div><div className="text-[12px] text-navy-500">{t(`sim.cat.${s.category}` as I18nKey)} · {s.nodes.length} {t('sim.stepsCount')}</div></div>
                <Badge tone={s.available ? 'success' : 'gray'}>{s.available ? t(`status.${s.status}` as I18nKey) : t('common.comingSoon')}</Badge>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-[12px] text-navy-500">{t('adm.simNote')}</p>
        </Card>
      )}

      {tab === 'audit' && (
        <Card className="mt-5">
          <ul className="divide-y divide-line">
            {d.audit.slice(0, 100).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                <span><span className="font-mono text-[12px] text-teal">{a.action}</span> <span className="text-navy-500">{a.meta}</span></span>
                <span className="text-[12px] text-navy-500">{d.users.find((u) => u.id === a.actorId)?.fullName ?? '—'} · {fmtDateTime(a.at, locale)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={!!orgForm} onClose={() => setOrgForm(null)} title={t('adm.newOrg')} footer={<><Button variant="secondary" onClick={() => setOrgForm(null)}>{t('common.cancel')}</Button><Button disabled={!orgForm?.name.trim()} onClick={() => { guard(() => createOrg(orgForm!.name.trim(), orgForm!.type, orgForm!.city.trim() || undefined)); setOrgForm(null); }} data-testid="save-org">{t('common.create')}</Button></>}>
        {orgForm && (
          <div className="space-y-4">
            <Field label={t('adm.orgName')}><Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} name="orgName" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('adm.orgType')}><Select value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value as OrgType })}><option value="university">{t('adm.type.university')}</option><option value="clinic">{t('adm.type.clinic')}</option></Select></Field>
              <Field label={t('adm.city')}><Input value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} /></Field>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog open={!!adminForm} onClose={() => setAdminForm(null)} title={t('adm.addAdmin')} footer={<><Button variant="secondary" onClick={() => setAdminForm(null)}>{t('common.cancel')}</Button><Button onClick={async () => { try { const r = await createOrgAdmin(adminForm!.orgId, adminForm!.email, adminForm!.fullName); setCreated({ email: r.user.email, pwd: r.tempPassword }); setErr(null); } catch (e) { setErr(errorKey(e)); } setAdminForm(null); }}>{t('common.create')}</Button></>}>
        {adminForm && (
          <div className="space-y-4">
            <Field label={t('auth.fullName')}><Input value={adminForm.fullName} onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })} /></Field>
            <Field label={t('auth.email')}><Input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} /></Field>
          </div>
        )}
      </Dialog>
      <Dialog open={!!pilot} onClose={() => setPilot(null)} title={`${t('adm.activatePilot')}: ${pilot?.label ?? ''}`} footer={<><Button variant="secondary" onClick={() => setPilot(null)}>{t('common.cancel')}</Button><Button onClick={() => { guard(() => activatePilot({ orgId: pilot!.orgId, userId: pilot!.userId }, pilot!.planId, pilot!.seats, pilot!.days)); setPilot(null); }} data-testid="confirm-pilot">{t('adm.activatePilot')}</Button></>}>
        {pilot && (
          <div className="space-y-4">
            <Field label={t('org.plan')}><Select value={pilot.planId} onChange={(e) => setPilot({ ...pilot, planId: e.target.value as PlanId })}>{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('org.seats')}><Input type="number" min={1} value={pilot.seats} onChange={(e) => setPilot({ ...pilot, seats: Number(e.target.value) })} /></Field>
              <Field label={t('adm.days')}><Input type="number" min={1} value={pilot.days} onChange={(e) => setPilot({ ...pilot, days: Number(e.target.value) })} /></Field>
            </div>
            <p className="text-[12px] text-navy-500">{t('adm.pilotNote')}</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
