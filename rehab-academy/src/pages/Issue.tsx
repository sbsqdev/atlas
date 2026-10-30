import { useEffect, useState } from 'react';
import { Copy, KeyRound, Mail, Trash2 } from 'lucide-react';
import { signAccessCode, type PlanId } from '@/data/access';
import { PRICING } from '@/data/content/launch';
import { fmtKzt } from '@/lib/format';
import { Button, Card, CardBody, CardHeader, Field, Input, Select } from '@/components/ui';

/* Owner-only tool (not linked anywhere): after a Kaspi payment, issue an
   access code and email it. The private key is imported once and stays in
   this browser's storage; without it the page can do nothing. */

const KEY_STORE = 'fab3d-issuer-key';
const LOG_STORE = 'fab3d-issued';
const DAY = 86_400_000;

interface Issued { at: number; email: string; name: string; plan: PlanId; until: number; link: string }

const PLANS: { id: PlanId; label: string; days: number }[] = [
  { id: 'launch', label: `Первый поток — ${fmtKzt(PRICING.launch.firstMonthKzt)}, 1 месяц`, days: 31 },
  { id: 'month', label: `Подписка — ${fmtKzt(PRICING.monthlyKzt)}, 1 месяц`, days: 31 },
  { id: 'personal', label: `Персональное сопровождение — ${fmtKzt(PRICING.personalKzt)}, 3 месяца`, days: 92 },
];

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
const day = (ms: number) => new Date(ms).toLocaleDateString('ru-RU');

function letter(name: string, link: string, code: string, until: number) {
  const hi = name ? `Здравствуйте, ${name}!` : 'Здравствуйте!';
  return `${hi}

Спасибо за оплату. Ваш доступ к FAB3D Academy открыт до ${day(until)}.

Откройте ссылку, чтобы войти:
${link}

Если ссылка не открывается, зайдите на страницу активации и вставьте код:
${code}

—
Сәлеметсіз бе! Төлеміңізге рақмет. FAB3D Academy-ге қолжетімділік ${day(until)} дейін ашық. Кіру үшін жоғарыдағы сілтемені ашыңыз.

Вопросы: WhatsApp +7 707 373 77 67, Telegram @ecosystem_tech`;
}

export default function Issue() {
  const [key, setKey] = useState<JsonWebKey | null>(() => read<JsonWebKey | null>(KEY_STORE, null));
  const [log, setLog] = useState<Issued[]>(() => read<Issued[]>(LOG_STORE, []));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<PlanId>('launch');
  const [days, setDays] = useState(31);
  const [out, setOut] = useState<{ code: string; link: string; until: number } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { document.title = 'Выдача доступа'; }, []);

  async function importKey(file: File) {
    setErr('');
    try {
      const j = JSON.parse(await file.text());
      const jwk: JsonWebKey = j.jwk ?? j;
      if (jwk.kty !== 'EC' || !jwk.d) throw new Error();
      save(KEY_STORE, jwk);
      setKey(jwk);
    } catch {
      setErr('Это не файл ключа. Нужен fab3d-access-private-key.json.');
    }
  }

  async function issue() {
    setErr('');
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setErr('Проверьте email.');
    const until = Date.now() + days * DAY;
    try {
      const code = await signAccessCode(key!, { email: e, plan, until });
      const link = `${location.origin}${import.meta.env.BASE_URL}activate?email=${encodeURIComponent(e)}&code=${encodeURIComponent(code)}`;
      setOut({ code, link, until });
      const next = [{ at: Date.now(), email: e, name, plan, until, link }, ...log];
      setLog(next);
      save(LOG_STORE, next);
    } catch {
      setErr('Не удалось подписать код. Импортируйте ключ заново.');
    }
  }

  function exportCsv() {
    const rows = [['Дата', 'Email', 'Имя', 'Тариф', 'Доступ до'], ...log.map((x) => [day(x.at), x.email, x.name, x.plan, day(x.until)])];
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'access-log.csv' });
    document.body.appendChild(a); a.click(); a.remove();
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <meta name="robots" content="noindex" />
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="flex items-center gap-2 text-[26px] font-bold"><KeyRound className="h-6 w-6 text-teal" /> Выдача доступа</h1>
        {!key ? (
          <Card>
            <CardHeader title="Шаг 1. Импортируйте ключ" />
            <CardBody className="space-y-3 text-[14px] text-navy-700">
              <p>Выберите файл <b>fab3d-access-private-key.json</b>. Ключ сохранится только в этом браузере. Никому не отправляйте этот файл.</p>
              <input type="file" accept=".json,application/json" onChange={(e) => e.target.files?.[0] && importKey(e.target.files[0])} data-testid="issuer-key" />
              {err && <p className="text-error">{err}</p>}
            </CardBody>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader title="Новый доступ" subtitle="После того как увидели оплату в Kaspi" />
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Email участника"><Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                  <Field label="Имя"><Input name="name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                  <Field label="Тариф">
                    <Select name="plan" value={plan} onChange={(e) => { const p = PLANS.find((x) => x.id === e.target.value)!; setPlan(p.id); setDays(p.days); }}>
                      {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Дней доступа"><Input name="days" type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} /></Field>
                </div>
                {err && <p className="text-[13px] text-error">{err}</p>}
                <Button onClick={issue} data-testid="issue-submit">Создать код</Button>
                {out && (
                  <div className="space-y-3 rounded-2xl border border-teal/30 bg-teal/5 p-4" data-testid="issue-result">
                    <p className="text-[14px]">Доступ до <b>{day(out.until)}</b>. Отправьте участнику письмо со ссылкой:</p>
                    <textarea readOnly value={out.link} rows={3} className="w-full rounded-xl border border-line bg-white p-2 font-mono text-[12px]" data-testid="issue-link" />
                    <div className="flex flex-wrap gap-2">
                      <a className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-white" href={`mailto:${email.trim()}?subject=${encodeURIComponent('Доступ к FAB3D Academy')}&body=${encodeURIComponent(letter(name, out.link, out.code, out.until))}`}><Mail className="h-4 w-4" /> Открыть письмо</a>
                      <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(letter(name, out.link, out.code, out.until))}><Copy className="h-4 w-4" /> Скопировать текст письма</Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={`Выданные доступы (${log.length})`} subtitle="Журнал хранится в этом браузере" action={log.length ? <Button size="sm" variant="secondary" onClick={exportCsv}>Скачать CSV</Button> : undefined} />
              <CardBody className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead className="text-left text-navy-500"><tr><th className="py-1.5">Дата</th><th>Email</th><th>Имя</th><th>Тариф</th><th>До</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {log.map((x) => <tr key={x.at}><td className="py-1.5">{day(x.at)}</td><td>{x.email}</td><td>{x.name}</td><td>{x.plan}</td><td className={x.until < Date.now() ? 'text-error' : ''}>{day(x.until)}</td></tr>)}
                  </tbody>
                </table>
              </CardBody>
            </Card>
            <button onClick={() => { localStorage.removeItem(KEY_STORE); setKey(null); }} className="flex items-center gap-1.5 text-[13px] text-navy-500 hover:text-error"><Trash2 className="h-4 w-4" /> Удалить ключ из этого браузера</button>
          </>
        )}
      </div>
    </div>
  );
}
