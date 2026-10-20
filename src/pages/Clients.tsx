import { useState } from 'react';
import { useAuth } from '../store/useAuth';
import { useCrm, FUNNEL } from '../store/useCrm';
import { useT } from '../i18n/useT';
import type { Client, ClientStage } from '../types';

const ALL_STAGES: ClientStage[] = [...FUNNEL, 'lost'];

function ClientCard({ c }: { c: Client }) {
  const { t } = useT();
  const update = useCrm((s) => s.update);
  const moveBy = useCrm((s) => s.moveBy);
  const setStage = useCrm((s) => s.setStage);
  const remove = useCrm((s) => s.remove);
  const idx = FUNNEL.indexOf(c.stage);

  return (
    <div className="card client-card">
      <div className="client-head">
        <div>
          <div className="client-name">{c.name}</div>
          {c.contact && <div className="client-contact">{c.contact}</div>}
        </div>
        <button className="btn ghost small" onClick={() => remove(c.id)} aria-label="delete">🗑</button>
      </div>

      <div className="client-fields">
        <input defaultValue={c.nextAction ?? ''} placeholder={`➡ ${t('crmNextPh')}`} onBlur={(e) => update(c.id, { nextAction: e.target.value })} />
        <div className="client-row2">
          <input defaultValue={c.note ?? ''} placeholder={t('crmNotePh')} onBlur={(e) => update(c.id, { note: e.target.value })} />
          <input type="number" defaultValue={c.value ?? ''} placeholder={t('crmValuePh')} onBlur={(e) => update(c.id, { value: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
      </div>

      <div className="client-actions">
        {c.stage !== 'lost' && idx > 0 && <button className="btn ghost small" onClick={() => moveBy(c.id, -1)}>◀</button>}
        {c.stage !== 'lost' && idx < FUNNEL.length - 1 && <button className="btn primary small" onClick={() => moveBy(c.id, 1)}>{t(stageKey(FUNNEL[idx + 1]))} ▶</button>}
        {c.stage !== 'lost'
          ? <button className="btn ghost small danger" onClick={() => setStage(c.id, 'lost')}>{t('crmMarkLost')}</button>
          : <button className="btn ghost small" onClick={() => setStage(c.id, 'lead')}>↩ {t('stageLead')}</button>}
      </div>
    </div>
  );
}

function stageKey(s: ClientStage) {
  return ({ lead: 'stageLead', contacted: 'stageContacted', trial: 'stageTrial', sold: 'stageSold', active: 'stageActive', lost: 'stageLost' } as const)[s];
}

export default function Clients() {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const clients = useCrm((s) => (user ? s.clients.filter((c) => c.trainerId === user.id) : []));
  const add = useCrm((s) => s.add);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  if (!user) return null;
  const revenue = clients.filter((c) => c.stage === 'sold' || c.stage === 'active').reduce((n, c) => n + (c.value ?? 0), 0);
  const countIn = (s: ClientStage) => clients.filter((c) => c.stage === s).length;

  const submit = () => { if (name.trim()) { add(user.id, name, contact); setName(''); setContact(''); } };

  return (
    <div>
      <h1>👥 {t('clients')}</h1>
      <p className="sub">{t('crmTagline')}</p>

      <div className="card funnel-card">
        <div className="funnel-row">
          {FUNNEL.map((s) => (
            <div key={s} className="funnel-step">
              <div className="funnel-n">{countIn(s)}</div>
              <div className="funnel-label">{t(stageKey(s))}</div>
            </div>
          ))}
        </div>
        <div className="funnel-rev">💰 {t('crmRevenue')}: <b>{revenue.toLocaleString()}</b></div>
      </div>

      <div className="add-client">
        <input value={name} placeholder={t('crmNamePh')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <input value={contact} placeholder={t('crmContactPh')} onChange={(e) => setContact(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="btn primary" disabled={!name.trim()} onClick={submit}>+ {t('crmAdd')}</button>
      </div>

      {clients.length === 0 && <p className="placeholder" style={{ marginTop: 14 }}>{t('crmEmpty')}</p>}

      <div className="crm-columns">
        {ALL_STAGES.map((s) => {
          const inStage = clients.filter((c) => c.stage === s);
          if (inStage.length === 0 && s === 'lost') return null;
          return (
            <div key={s} className="crm-column">
              <div className={`crm-col-head stage-${s}`}>{t(stageKey(s))} <span>{inStage.length}</span></div>
              <div className="crm-col-list">
                {inStage.map((c) => <ClientCard key={c.id} c={c} />)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="hint" style={{ marginTop: 16 }}>ℹ️ {t('crmLocalNote')}</p>
    </div>
  );
}
