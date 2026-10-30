import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { activateAccess } from '@/data/api';
import { verifyAccessCode } from '@/data/access';
import { useT, type I18nKey } from '@/i18n';
import { Button, Field, Input } from '@/components/ui';
import LangSwitch from '@/components/LangSwitch';

/* Public page: the athlete pastes the email and code from the owner's letter
   (or opens the link in it, which fills both) and gets full access on this device. */
export default function Activate() {
  const { t } = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<I18nKey | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = `${t('access.title')} · FAB3D Academy`; }, [t]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!consent) return setErr('auth.err.consent');
    setBusy(true);
    try {
      const g = await verifyAccessCode(code);
      if (!g) return setErr('access.bad');
      if (g.email !== email.trim().toLowerCase()) return setErr('access.wrongEmail');
      if (g.until < Date.now()) return setErr('access.expired');
      await activateAccess(g, name);
      nav('/', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-sm md:p-9" data-testid="activate-form">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal/10 text-teal"><KeyRound className="h-5 w-5" /></span>
          <LangSwitch />
        </div>
        <h1 className="mt-4 text-[24px] font-bold">{t('access.title')}</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-navy-500">{t('access.sub')}</p>
        <div className="mt-6 space-y-4">
          <Field label={t('auth.email')}><Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field label={t('access.code')}><textarea name="code" value={code} onChange={(e) => setCode(e.target.value)} rows={3} className="w-full rounded-xl border border-line px-3 py-2 font-mono text-[12px] focus:border-teal focus:outline-none" /></Field>
          <Field label={t('access.name')}><Input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
          <label className="flex items-start gap-2.5 text-[13px] text-navy-500">
            <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal" />
            <span><Link to="/offer" target="_blank" className="font-semibold text-teal">{t('access.consent')}</Link></span>
          </label>
        </div>
        {err && <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-[13px] text-error" data-testid="activate-error">{t(err)}</p>}
        <Button type="submit" size="lg" loading={busy} className="mt-6 w-full" data-testid="activate-submit">{t('access.activate')}</Button>
        <p className="mt-4 text-center text-[13px]"><Link to="/" className="text-navy-500 hover:text-teal">← {t('auth.toCourse')}</Link></p>
      </form>
    </div>
  );
}
