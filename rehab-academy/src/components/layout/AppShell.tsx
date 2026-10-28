import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, Award, Bell, BookOpen, Bone, Briefcase, Building2, ChevronsLeft, ChevronsRight, ClipboardCheck, FlaskConical, GraduationCap,
  LayoutDashboard, LogOut, Menu, PenSquare, Search, Settings, ShieldCheck, Stethoscope, Tag, Users, X,
} from 'lucide-react';
import { useDb } from '@/data/db';
import { logout, markNotificationsRead, useMe } from '@/data/api';
import { can, canSeeCourse } from '@/data/rbac';
import { STRUCTURES } from '@/data/content/anatomy';
import { SIMULATIONS } from '@/data/content/simulations';
import { PATIENTS } from '@/data/content/patients';
import { LOCALES, useLocale, useT, type I18nKey } from '@/i18n';
import { cn } from '@/lib/cn';
import { fmtDateTime } from '@/lib/format';
import { Badge } from '@/components/ui';

type Item = { to: string; key: I18nKey; icon: ReactNode; end?: boolean };

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan text-white shadow-sm">
        <Activity className="h-5 w-5" strokeWidth={2.4} />
      </div>
      {!collapsed && <span className="text-[16px] font-bold tracking-tight text-white">Rehab Academy</span>}
    </div>
  );
}

function useNav() {
  const u = useMe();
  const learn: Item[] = [
    { to: '/', key: 'nav.dashboard', icon: <LayoutDashboard />, end: true },
    { to: '/anatomy', key: 'nav.anatomy', icon: <Bone /> },
    { to: '/simulations', key: 'nav.simulations', icon: <FlaskConical /> },
    { to: '/patients', key: 'nav.patients', icon: <Stethoscope /> },
    { to: '/courses', key: 'nav.courses', icon: <BookOpen /> },
    { to: '/assessments', key: 'nav.assessments', icon: <ClipboardCheck /> },
    { to: '/progress', key: 'nav.progress', icon: <GraduationCap /> },
    { to: '/certificates', key: 'nav.certificates', icon: <Award /> },
    { to: '/career', key: 'nav.career', icon: <Briefcase /> },
  ];
  const sections: { title: I18nKey; items: Item[] }[] = [{ title: 'nav.learning', items: learn }];
  const teach: Item[] = [];
  if (can(u, 'course.author')) teach.push({ to: '/teach/builder', key: 'nav.builder', icon: <PenSquare /> });
  if (can(u, 'class.manage')) teach.push({ to: '/teach/classes', key: 'nav.classes', icon: <Users /> });
  if (teach.length) sections.push({ title: 'nav.teach', items: teach });
  const admin: Item[] = [];
  if (can(u, 'org.manage')) admin.push({ to: '/org', key: 'nav.org', icon: <Building2 /> });
  if (can(u, 'platform.admin')) admin.push({ to: '/admin', key: 'nav.admin', icon: <ShieldCheck />, end: true });
  if (can(u, 'course.review')) admin.push({ to: '/admin/review', key: 'nav.review', icon: <ClipboardCheck /> });
  if (admin.length) sections.push({ title: 'nav.admin', items: admin });
  // Learners buy a course directly; plans and pilots are for organizations.
  const settings: Item[] = [{ to: '/settings', key: 'nav.settings', icon: <Settings /> }];
  if (u && u.role !== 'student') settings.unshift({ to: '/pricing', key: 'nav.pricing', icon: <Tag /> });
  sections.push({ title: 'nav.settings', items: settings });
  return sections;
}

function Sidebar({ collapsed, onToggle, mobileOpen, onClose }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onClose: () => void }) {
  const { t } = useT();
  const sections = useNav();
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-navy text-white transition-[width,transform] duration-200',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[256px]',
          'w-[264px]', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/" onClick={onClose}><Logo collapsed={collapsed} /></Link>
          <button className="rounded-lg p-1 text-navy-300 hover:text-white lg:hidden" onClick={onClose} aria-label={t('common.close')}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin" aria-label="main">
          {sections.map((s) => (
            <div key={s.title} className="mt-4 first:mt-1">
              {!collapsed && <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-300/80">{t(s.title)}</div>}
              {s.items.map((it) => (
                <NavLink
                  key={it.to} to={it.to} end={it.end} onClick={onClose} title={collapsed ? t(it.key) : undefined}
                  className={({ isActive }) => cn(
                    'group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0',
                    isActive ? 'bg-white/10 text-white' : 'text-navy-300 hover:bg-white/5 hover:text-white',
                    collapsed && 'lg:justify-center lg:px-0',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn(isActive && 'text-cyan')}>{it.icon}</span>
                      <span className={cn(collapsed && 'lg:hidden')}>{t(it.key)}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button onClick={onToggle} className="hidden h-12 items-center justify-center gap-2 border-t border-white/10 text-[13px] text-navy-300 hover:text-white lg:flex">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> {t('nav.collapse')}</>}
        </button>
      </aside>
    </>
  );
}

function GlobalSearch() {
  const { t } = useT();
  const u = useMe();
  const courses = useDb((s) => s.courses);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2 || !u) return [];
    const r: { label: string; kind: I18nKey; to: string }[] = [];
    courses.filter((c) => canSeeCourse(u, c) && c.title.toLowerCase().includes(s)).forEach((c) => r.push({ label: c.title, kind: 'nav.courses', to: `/courses/${c.id}` }));
    STRUCTURES.filter((x) => x.name.toLowerCase().includes(s) || x.latin.toLowerCase().includes(s)).forEach((x) => r.push({ label: `${x.name} · ${x.latin}`, kind: 'nav.anatomy', to: `/anatomy?s=${x.id}` }));
    SIMULATIONS.filter((x) => x.title.toLowerCase().includes(s)).forEach((x) => r.push({ label: x.title, kind: 'nav.simulations', to: `/simulations/${x.id}` }));
    PATIENTS.filter((x) => x.title.toLowerCase().includes(s)).forEach((x) => r.push({ label: x.title, kind: 'nav.patients', to: `/patients/${x.id}` }));
    return r.slice(0, 10);
  }, [q, u, courses]);
  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
      <input
        value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder={t('nav.search')} aria-label={t('common.search')}
        className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm placeholder:text-navy-300 focus:border-teal focus:bg-white focus:outline-none"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-lift)]">
          {results.length === 0 && <div className="px-4 py-3 text-sm text-navy-500">{t('nav.searchEmpty')}</div>}
          {results.map((r) => (
            <button key={r.to} onClick={() => { nav(r.to); setOpen(false); setQ(''); }} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-bg">
              <span className="truncate text-navy">{r.label}</span>
              <span className="shrink-0 text-[11px] text-navy-500">{t(r.kind)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { t, locale } = useT();
  const u = useMe();
  const all = useDb((s) => s.notifications);
  const items = useMemo(() => all.filter((n) => n.userId === u?.id).slice(0, 12), [all, u]);
  const unread = items.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative grid h-10 w-10 place-items-center rounded-xl text-navy-500 hover:bg-bg" aria-label={t('nav.notifications')}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-30 w-[340px] overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold">{t('nav.notifications')}</span>
              {unread > 0 && <button className="text-[12px] font-semibold text-teal" onClick={markNotificationsRead}>{t('nav.markRead')}</button>}
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {items.length === 0 && <div className="px-4 py-6 text-center text-sm text-navy-500">{t('nav.noNotifications')}</div>}
              {items.map((n) => (
                <button key={n.id} onClick={() => { setOpen(false); if (n.link) nav(n.link); }} className={cn('block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-bg', !n.read && 'bg-teal-50/50')}>
                  <div className="text-[13px] text-navy">{n.text}</div>
                  <div className="mt-0.5 text-[11px] text-navy-500">{fmtDateTime(n.at, locale)}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useT();
  const u = useMe();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { locale, setLocale } = useLocale();
  if (!u) return null;
  const initials = u.fullName.split(/\s+/).filter((p) => /^\p{L}/u.test(p)).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-bg" aria-label="profile">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-[13px] font-bold text-white">{initials}</span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[180px] truncate text-[13px] font-semibold text-navy">{u.fullName}</span>
          <span className="block text-[11px] text-navy-500">{t(`role.${u.role}` as I18nKey)}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-30 w-60 rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-lift)]">
            <div className="px-3 py-2 text-[12px] text-navy-500">{u.email}</div>
            <div className="flex gap-1 px-2 pb-2">
              {LOCALES.map((l) => (
                <button key={l.id} onClick={() => setLocale(l.id)} className={cn('flex-1 rounded-lg px-2 py-1 text-[12px] font-semibold', locale === l.id ? 'bg-navy text-white' : 'bg-bg text-navy-500')}>{l.id.toUpperCase()}</button>
              ))}
            </div>
            <button onClick={() => { setOpen(false); nav('/settings'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-bg"><Settings className="h-4 w-4" /> {t('nav.settings')}</button>
            <button onClick={() => { logout(); nav('/login'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-bg"><LogOut className="h-4 w-4" /> {t('nav.logout')}</button>
          </div>
        </>
      )}
    </div>
  );
}

export function DemoBanner() {
  const { t } = useT();
  return (
    <div className="flex items-center justify-center gap-2 bg-[#FFF4D6] px-4 py-1.5 text-center text-[12px] font-medium text-[#7A5410]">
      <Badge tone="warning" className="py-0">{t('demo.label')}</Badge> {t('demo.banner')}
    </div>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('ra-sidebar') === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { try { localStorage.setItem('ra-sidebar', collapsed ? '1' : '0'); } catch { /* storage unavailable */ } }, [collapsed]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className="min-h-full">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[256px]')}>
        <DemoBanner />
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-xl text-navy-500 hover:bg-bg lg:hidden" onClick={() => setMobileOpen(true)} aria-label="menu"><Menu className="h-5 w-5" /></button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1"><Notifications /><UserMenu /></div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
