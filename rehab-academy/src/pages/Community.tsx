import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, Send, Users } from 'lucide-react';
import { useMe } from '@/data/api';
import { CONTACTS, MEMBERS, REGIONS, ZONES, type ZoneId } from '@/data/content/launch';
import type { I18nKey } from '@/i18n';
import SocialLinks from '@/features/network/SocialLinks';
import { ConsultBanner } from '@/features/consult/Consult';
import { useT } from '@/i18n';
import { cn } from '@/lib/cn';
import { Badge, Button, Card, CardBody, CardHeader, PageHeader, buttonVariants } from '@/components/ui';
import SiteForm, { TELEGRAM_URL, WHATSAPP_URL, useLang } from '@/features/forms/SiteForm';

const ZONE_ORDER: ZoneId[] = ['north', 'almaty', 'south', 'west', 'centerEast'];

/* Regional communities: city chats in Telegram, what matters in each climate
   zone, contacts, reviews and questions. */
export default function Community() {
  const { t } = useT();
  const lang = useLang();
  const u = useMe()!;
  const mine = REGIONS.find((r) => r.id === u.city);
  const [join, setJoin] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [addMe, setAddMe] = useState(false);
  const members = MEMBERS.filter((m) => !cityFilter || m.city === cityFilter);
  const kazCourse = (lesson: string) => `/courses/c-kz/lessons/${lesson}`;

  const chatButton = (id: string, chat?: string) => chat
    ? <a href={chat} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'sm' })}><MessageCircle className="h-4 w-4" /> {t('comm.chat')}</a>
    : <Button size="sm" variant="secondary" onClick={() => setJoin(id)} data-testid={`join-${id}`}>{t('comm.join')}</Button>;

  return (
    <div className="animate-fade-up space-y-6" data-testid="community">
      <PageHeader title={t('comm.title')} subtitle={t('comm.sub')} />

      <Card>
        <CardHeader title={t('comm.myCity')} icon={<MapPin className="h-4 w-4" />} />
        <CardBody>
          {mine ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[22px] font-bold">{mine[lang]}</div>
                <div className="mt-1 text-[13px] font-semibold uppercase tracking-wider text-teal">{ZONES[mine.zone][lang].title}</div>
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-navy-500">{ZONES[mine.zone][lang].text}</p>
                <Link to={kazCourse(ZONES[mine.zone].lesson)} className="mt-2 inline-block text-[14px] font-semibold text-teal">{t('comm.toLesson')} →</Link>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                {chatButton(mine.id, mine.chat)}
                {!mine.chat && <span className="text-[12px] text-navy-500">{t('comm.soon')}</span>}
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-navy-500">{t('comm.setCity')} <Link to="/profile" className="font-semibold text-teal">{t('nav.profile')} →</Link></p>
          )}
          {join && <SiteForm kind="region" className="mt-5" defaults={{ city: join, name: u.demo ? '' : u.fullName, regionRole: 'member' }} />}
        </CardBody>
      </Card>

      <Card data-testid="members">
        <CardHeader title={t('net.title')} subtitle={t('net.sub')} icon={<Users className="h-4 w-4" />} />
        <CardBody>
          {MEMBERS.length > 0 && (
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="mb-4 h-10 rounded-xl border border-line px-3 text-sm">
              <option value="">{t('net.all')}</option>
              {REGIONS.filter((r) => MEMBERS.some((m) => m.city === r.id)).map((r) => <option key={r.id} value={r.id}>{r[lang]}</option>)}
            </select>
          )}
          {members.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {members.map((m) => (
                <div key={m.name + m.city} className="flex gap-4 rounded-2xl border border-line p-4">
                  {m.photo ? <img src={m.photo} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-navy text-lg font-bold text-white">{m.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2)}</span>}
                  <div className="min-w-0">
                    <div className="font-bold">{m.name}</div>
                    <div className="text-[13px] text-navy-500">{REGIONS.find((r) => r.id === m.city)?.[lang]} · {m.sports.map((s) => t(`sport.${s}` as I18nKey)).join(', ')}</div>
                    {m.pb && <div className="mt-1 text-[13px]">{m.pb}</div>}
                    {m.about && <p className="mt-1 text-[13px] text-navy-700">{m.about}</p>}
                    <div className="mt-2"><SocialLinks ig={m.instagram} tg={m.telegram} st={m.strava} /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-[14px] text-navy-500" data-testid="members-empty">{t('net.empty')}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAddMe((x) => !x)} data-testid="members-join">{t('net.join')}</Button>
            <Link to="/profile" className={buttonVariants({ variant: 'ghost' })}>{t('prof.card')} →</Link>
          </div>
          {addMe && <SiteForm kind="member" className="mt-4" defaults={{ name: u.demo ? '' : u.fullName, city: u.city ?? '' }} />}
        </CardBody>
      </Card>

      <ConsultBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ZONE_ORDER.map((z) => (
          <Card key={z}>
            <CardBody>
              <h3 className="text-[17px] font-bold">{ZONES[z][lang].title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-navy-500">{ZONES[z][lang].text}</p>
              <ul className="mt-3 divide-y divide-line">
                {REGIONS.filter((r) => r.zone === z).map((r) => (
                  <li key={r.id} className={cn('flex items-center justify-between gap-3 py-2 text-[14px]', r.id === u.city && 'font-semibold')}>
                    <span className="flex items-center gap-2">{r[lang]} {r.id === u.city && <Badge tone="teal">{t('comm.myCity')}</Badge>}</span>
                    {r.chat ? <a href={r.chat} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-teal">{t('comm.chat')}</a> : <button onClick={() => setJoin(r.id)} className="text-[13px] text-navy-500 hover:text-teal">{t('comm.join')}</button>}
                  </li>
                ))}
              </ul>
              <Link to={kazCourse(ZONES[z].lesson)} className="mt-3 inline-block text-[13px] font-semibold text-teal">{t('comm.toLesson')} →</Link>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title={t('comm.contacts')} icon={<Users className="h-4 w-4" />} />
        <CardBody className="flex flex-wrap gap-3">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}><Send className="h-4 w-4" /> Telegram @{CONTACTS.telegram}</a>
          {CONTACTS.telegramChannel && <a href={CONTACTS.telegramChannel} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}><Send className="h-4 w-4" /> {t('comm.channel')}</a>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[18px] font-bold">{t('comm.review')}</h2>
          <SiteForm kind="review" defaults={{ name: u.demo ? '' : u.fullName, city: u.city ?? '' }} />
        </div>
        <div>
          <h2 className="mb-3 text-[18px] font-bold">{lang === 'kk' ? 'Сұрақ қою' : 'Задать вопрос'}</h2>
          <SiteForm kind="question" defaults={{ name: u.demo ? '' : u.fullName, email: u.demo ? '' : u.email }} />
        </div>
      </div>
    </div>
  );
}
