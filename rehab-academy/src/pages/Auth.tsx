import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Bone, FlaskConical, Users } from 'lucide-react';
import { login, register, useMe } from '@/data/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/seed';
import { LOCALES, useLocale, useT, type I18nKey } from '@/i18n';
import { errorKey } from '@/lib/errors';
import { Button, Field, Input, Select } from '@/components/ui';
import { Logo, DemoBanner } from '@/components/layout/AppShell';
import { cn } from '@/lib/cn';

export default function AuthPage({ mode }: { mode: 'in' | 'up' }) {
  const { t } = useT();
  const { locale, setLocale } = useLocale();
  const me = useMe();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<I18nKey | null>(null);
  const [busy, setBusy] = useState(false);

  if (me) return <Navigate to="/" replace />;
  const from = (loc.state as { from?: string } | null)?.from ?? '/';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'in') await login(email, password);
      else await register({ email, password, fullName, role, consent });
      nav(from, { replace: true });
    } catch (x) {
      setErr(errorKey(x));
    } finally {
      setBusy(false);
    }
  }
  async function quick(e: string) {
    setBusy(true);
    try { await login(e, DEMO_PASSWORD); nav('/', { replace: true }); } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <div className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
        <section className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
          <Logo />
          <div className="relative mt-auto max-w-lg">
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">{t('auth.heroTitle')}</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-300">{t('auth.heroText')}</p>
            <ul className="mt-8 space-y-3">
              {([['auth.feature1', <Bone key="b" />], ['auth.feature2', <FlaskConical key="f" />], ['auth.feature3', <Users key="u" />]] as const).map(([k, icon]) => (
                <li key={k} className="flex items-center gap-3 text-[14px]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-cyan [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative mt-auto pt-10 text-[12px] text-navy-300">{t('app.eduOnly')}</p>
        </section>

        <section className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="rounded-xl bg-navy px-3 py-2"><Logo /></div>
            </div>
            <div className="mb-6 flex justify-end gap-1">
              {LOCALES.map((l) => (
                <button key={l.id} onClick={() => setLocale(l.id)} className={cn('rounded-lg px-2.5 py-1 text-[12px] font-semibold', locale === l.id ? 'bg-navy text-white' : 'text-navy-500 hover:bg-white')}>{l.label}</button>
              ))}
            </div>
            <h2 className="text-[26px] font-bold tracking-tight">{t(mode === 'in' ? 'auth.signIn' : 'auth.signUp')}</h2>
            <p className="mt-1 text-sm text-navy-500">{t('app.tagline')}</p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {mode === 'up' && (
                <Field label={t('auth.fullName')}><Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" name="fullName" /></Field>
              )}
              <Field label={t('auth.email')}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" name="email" /></Field>
              <Field label={t('auth.password')}><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} name="password" /></Field>
              {mode === 'up' && (
                <>
                  <Field label={t('auth.role')}>
                    <Select value={role} onChange={(e) => setRole(e.target.value as 'student' | 'instructor')} name="role">
                      <option value="student">{t('role.student')}</option>
                      <option value="instructor">{t('role.instructor')}</option>
                    </Select>
                  </Field>
                  <label className="flex items-start gap-2.5 text-[13px] text-navy-700">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal" name="consent" />
                    {t('auth.consent')}
                  </label>
                  <p className="text-[12px] text-navy-500">{t('auth.selfRegisterNote')}</p>
                </>
              )}
              {err && <div role="alert" className="rounded-xl bg-[#FBE7E9] px-3 py-2 text-[13px] text-error">{t(err)}</div>}
              <Button type="submit" size="lg" className="w-full" loading={busy}>{t(mode === 'in' ? 'auth.submitIn' : 'auth.submitUp')}</Button>
            </form>

            <p className="mt-4 text-center text-sm text-navy-500">
              {mode === 'in' ? <>{t('auth.noAccount')} <Link className="font-semibold text-teal" to="/register">{t('auth.signUp')}</Link></> : <>{t('auth.haveAccount')} <Link className="font-semibold text-teal" to="/login">{t('auth.signIn')}</Link></>}
            </p>

            {mode === 'in' && (
              <div className="mt-8 rounded-2xl border border-line bg-white p-4">
                <div className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-navy-500">{t('auth.demoAccounts')}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button key={a.email} disabled={busy} onClick={() => quick(a.email)} className="rounded-xl border border-line px-3 py-2 text-left hover:border-teal hover:bg-teal-50" data-testid={`demo-${a.role}`}>
                      <div className="text-[13px] font-semibold text-navy">{t(`role.${a.role}` as I18nKey)}</div>
                      <div className="truncate text-[11px] text-navy-500">{a.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
