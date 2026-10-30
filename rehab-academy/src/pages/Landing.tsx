import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Bone, CheckCircle2, ChevronDown, Footprints, GraduationCap, HeartPulse, MessageCircle, PlayCircle,
  Bike, Rotate3d, ShieldCheck, Smartphone, Stethoscope, Timer, Trophy, Users, Waves,
} from 'lucide-react';
import { enroll, login } from '@/data/api';
import { DEMO_ATHLETE, DEMO_PASSWORD } from '@/data/seed';
import { RUN_LESSONS, RUN_MODULES, RUN_OFFER } from '@/data/content/runners';
import { TRI_LESSONS, TRI_MODULES, TRI_OFFER } from '@/data/content/triathlon';
import { useT } from '@/i18n';
import { fmtKzt } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button, buttonVariants } from '@/components/ui';
import { LESSON_ICON } from '@/features/courses/CourseDetail';

/* Public page of the runners course: what it covers, who teaches, the
   format and the price. Sign-up goes through WhatsApp; the demo button
   opens the course as the demo student. */

const img = (name: string) => `${import.meta.env.BASE_URL}landing/${name}`;
const wa = (text: string) => `https://wa.me/${RUN_OFFER.whatsapp}?text=${encodeURIComponent(text)}`;
const WHATSAPP = wa('Здравствуйте! Хочу записаться на курс «Колени, стопы и восстановление» для бегунов.');
const waTri = (tier: string) => wa(`Здравствуйте! Хочу записаться на курс «Триатлон без травм», тариф «${tier}».`);
const VIDEOS = RUN_LESSONS.filter((l) => l.type === 'video').length;
const HOURS = Math.round(RUN_LESSONS.reduce((s, l) => s + l.durationMin, 0) / 6) / 10;

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24', className)}>
      <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-teal">{eyebrow}</div>
      <h2 className="mt-3 max-w-3xl text-[30px] font-bold leading-tight tracking-tight text-navy md:text-[40px]">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default function Landing() {
  const { t } = useT();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = 'Курс для бегунов: колени, стопы и восстановление · Rehab Academy'; }, []);

  async function openDemo(courseId: string = RUN_OFFER.courseId) {
    setBusy(true);
    try {
      await login(DEMO_ATHLETE, DEMO_PASSWORD);
      try { enroll(courseId); } catch { /* already enrolled or not entitled: the course page explains */ }
      nav(`/courses/${courseId}`);
    } finally {
      setBusy(false);
    }
  }

  const SignUp = ({ className, dark }: { className?: string; dark?: boolean }) => (
    <a href={WHATSAPP} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: dark ? 'dark' : 'primary', className })} data-testid="landing-signup">
      <MessageCircle className="h-5 w-5" /> Записаться на курс
    </a>
  );
  const Demo = ({ className, light }: { className?: string; light?: boolean }) => (
    <Button size="lg" variant={light ? 'secondary' : 'outline'} onClick={() => openDemo()} loading={busy} className={cn(!light && 'border-white/40 text-white hover:bg-white/10', className)} data-testid="landing-demo">
      <PlayCircle className="h-5 w-5" /> Смотреть демо
    </Button>
  );

  return (
    <div className="min-h-screen bg-white text-navy" data-testid="landing">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 md:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan"><Activity className="h-5 w-5" strokeWidth={2.4} /></span>
            <span className="leading-tight"><b className="block text-[15px]">Rehab Academy</b><span className="block text-[11px] text-navy-300">by FABS3D AI</span></span>
          </a>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-navy-300 md:flex">
            <a href="#program" className="hover:text-white">Программа</a>
            <a href="#atlas" className="hover:text-white">3D-атлас</a>
            <a href="#experts" className="hover:text-white">Эксперты</a>
            <a href="#price" className="hover:text-white">Стоимость</a>
            <a href="#triathlon" className="hover:text-white">Триатлон</a>
          </nav>
          <Link to="/login" className="ml-auto text-sm font-semibold text-white/90 hover:text-white md:ml-0">Войти</Link>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-teal/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:pb-24 md:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-semibold text-cyan">
              <Footprints className="h-4 w-4" /> Онлайн-курс для бегунов и марафонцев
            </div>
            <h1 className="mt-5 text-[38px] font-extrabold leading-[1.05] tracking-tight md:text-[60px]">
              Колени, стопы <span className="text-cyan">и восстановление</span> после забегов
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy-300">
              Практическая программа от реабилитолога: как беречь колени, правильно восстанавливаться после стартов и укрепить стопы. С 3D-атласом тела и закрытым чатом.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SignUp />
              <Demo />
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
              {[[`${RUN_MODULES.length}`, 'модулей'], [`${RUN_LESSONS.length}`, 'уроков'], [`${VIDEOS}`, 'видео'], [`~${HOURS} ч`, 'материала']].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="text-xl font-bold">{n}</div>
                  <div className="text-navy-300">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-[420px] w-full max-w-sm md:h-[560px]">
            <img src={img('body.webp')} alt="3D-модель мышц тела" className="h-full w-full object-contain drop-shadow-[0_30px_60px_rgba(8,127,140,0.45)]" />
            {[['Колени', 'top-[46%] -left-2', Bone], ['Стопы', 'bottom-[6%] right-0', Footprints], ['Восстановление', 'top-[12%] right-0', HeartPulse]].map(([label, pos, Icon]) => {
              const I = Icon as typeof Bone;
              return (
                <div key={label as string} className={cn('absolute flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-lift)]', pos as string)}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal"><I className="h-4 w-4" /></span>{label as string}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audience */}
      <Section eyebrow="Для кого" title="Для тех, кто бегает регулярно и хочет бегать долго">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Timer, 'Бегуны-любители', 'Тренируетесь 2–5 раз в неделю и хотите бегать без боли.'],
            [Trophy, 'Марафонцы и полумарафонцы', 'Готовитесь к старту и думаете, как восстановиться после.'],
            [Activity, 'Триатлон и трейл', 'Высокий объём, перепады высот и нагрузка на стопы.'],
            [Stethoscope, 'Тренеры и спортивные врачи', 'Нужна понятная доказательная база для работы с бегунами.'],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Timer;
            return (
              <div key={title as string} className="rounded-3xl border border-line bg-bg p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-teal shadow-sm"><I className="h-5 w-5" /></span>
                <h3 className="mt-4 text-[17px] font-bold">{title as string}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-navy-500">{text as string}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Outcomes */}
      <section className="bg-bg">
        <Section eyebrow="Чему вы научитесь" title="Три темы, которые чаще всего мешают бегунам">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { img: 'knee.webp', title: 'Колени', points: ['Почему болит колено и что с этим делать', 'Программа укрепления бедра и ягодиц', 'Каденс и объём: как снизить нагрузку'] },
              { img: null, title: 'Восстановление', points: ['Что делать в первые 24 часа после финиша', 'Неделя после марафона: возвращение к бегу', 'Что реально работает: сон, питание, массаж'] },
              { img: 'foot.webp', title: 'Стопы и голень', points: ['Кор стопы и упражнение «короткая стопа»', 'Ахиллово сухожилие и подошвенная фасция', 'Силовая для голени: икроножная и камбаловидная'] },
            ].map((c) => (
              <div key={c.title} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
                <div className="relative grid h-56 place-items-center bg-gradient-to-br from-navy to-teal-600">
                  {c.img ? <img src={img(c.img)} alt={`3D-модель: ${c.title.toLowerCase()}`} className="h-52 object-contain" loading="lazy" /> : <HeartPulse className="h-24 w-24 text-white/80" strokeWidth={1.2} />}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">{c.title}</h3>
                  <ul className="mt-3 space-y-2.5">
                    {c.points.map((p) => <li key={p} className="flex gap-2.5 text-[14.5px] text-navy-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{p}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* Program */}
      <Section id="program" eyebrow="Программа" title={`${RUN_MODULES.length} модулей, ${RUN_LESSONS.length} уроков`}>
        <div className="space-y-3">
          {RUN_MODULES.map((m, i) => {
            const lessons = RUN_LESSONS.filter((l) => l.moduleId === m.id).sort((a, b) => a.order - b.order);
            return (
              <details key={m.id} className="group rounded-2xl border border-line bg-white open:shadow-[var(--shadow-card)]" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-[15px] font-bold text-white">{i + 1}</span>
                  <span className="flex-1">
                    <span className="block text-[17px] font-bold">{m.title}</span>
                    <span className="block text-[13px] text-navy-500">{lessons.length} уроков · {lessons.reduce((s, l) => s + l.durationMin, 0)} мин</span>
                  </span>
                  <ChevronDown className="h-5 w-5 text-navy-300 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="border-t border-line px-5 py-3">
                  {lessons.map((l) => {
                    const Icon = LESSON_ICON[l.type];
                    return (
                      <li key={l.id} className="flex items-center gap-3 py-2 text-[14.5px]">
                        <Icon className="h-4 w-4 shrink-0 text-teal" />
                        <span className="flex-1">{l.title}</span>
                        <span className="text-[12px] text-navy-500">{l.durationMin} мин</span>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      </Section>

      {/* 3D atlas */}
      <section id="atlas" className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-8 md:py-24">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-cyan">3D-атлас тела</div>
            <h2 className="mt-3 text-[30px] font-bold leading-tight tracking-tight md:text-[40px]">Посмотрите, что именно вы тренируете</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-navy-300">Интерактивные 3D-модели колена, стопы и голеностопа на основе научного анатомического атласа. Каждую мышцу можно повернуть, выделить и прочитать, где она начинается, куда крепится и зачем нужна бегуну.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Колено: надколенник, квадрицепс, ИТ-тракт, задняя поверхность бедра', 'Стопа: своды, ахиллово сухожилие, мышцы голени и подошвы', 'Квиз «найди на модели», чтобы закрепить'].map((p) => (
                <li key={p} className="flex gap-2.5"><Rotate3d className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />{p}</li>
              ))}
            </ul>
          </div>
          <img src={img('atlas.webp')} alt="Скриншот 3D-лаборатории анатомии" className="w-full rounded-3xl border border-white/10 shadow-2xl" loading="lazy" />
        </div>
      </section>

      {/* Experts */}
      <Section id="experts" eyebrow="Эксперты" title="Кто ведёт курс">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            [Stethoscope, 'Реабилитолог', 'Автор видео-уроков. Показывает технику упражнений и проверяет программу курса.'],
            [GraduationCap, 'Врач, магистр общественного здравоохранения (MPH, Йельский университет)', 'Доказательный подход: профилактика травм, нагрузка, сон и восстановление.'],
          ].map(([Icon, title, text]) => {
            const I = Icon as typeof Stethoscope;
            return (
              <div key={title as string} className="flex gap-5 rounded-3xl border border-line p-6">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal to-cyan text-white"><I className="h-8 w-8" /></span>
                <div>
                  <h3 className="text-[18px] font-bold leading-snug">{title as string}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-navy-500">{text as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Format */}
      <section className="bg-bg">
        <Section eyebrow="Формат" title="Учитесь в своём темпе, с телефона или компьютера">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [PlayCircle, `${VIDEOS} видео от реабилитолога`, 'Техника упражнений и восстановительная рутина.'],
              [Rotate3d, '3D-атлас тела', 'Колено, стопа и голеностоп — каждую структуру можно рассмотреть.'],
              [MessageCircle, 'Закрытый чат в Telegram', 'Вопросы реабилитологу и общение с другими бегунами.'],
              [ShieldCheck, 'Уроки с источниками', 'Каждая рекомендация опирается на научные исследования.'],
              [Trophy, 'Тест и сертификат', 'Итоговый тест и сертификат о прохождении курса.'],
              [Smartphone, 'Доступ с любого устройства', 'Курс открывается в браузере — ничего не нужно устанавливать.'],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof PlayCircle;
              return (
                <div key={title as string} className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <I className="h-6 w-6 text-teal" />
                  <h3 className="mt-3 text-[16px] font-bold">{title as string}</h3>
                  <p className="mt-1 text-[14px] text-navy-500">{text as string}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </section>

      {/* Price */}
      <Section id="price" eyebrow="Стоимость" title="Курс и закрытый чат">
        <div className="grid items-stretch gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/40 blur-3xl" />
            <div className="relative">
              <div className="text-[15px] text-navy-300">Колени, стопы и восстановление</div>
              <div className="mt-2 text-[48px] font-extrabold tracking-tight md:text-[56px]" data-testid="landing-price">{fmtKzt(RUN_OFFER.priceKzt)}</div>
              <div className="text-[15px] text-cyan">курс + закрытый чат в Telegram</div>
              <ul className="mt-6 space-y-2.5 text-[15px]">
                {[`${RUN_LESSONS.length} уроков и ${VIDEOS} видео от реабилитолога`, '3D-атлас колена, стопы и голеностопа', 'Программы упражнений для коленей, стоп и голени', 'Закрытый чат с реабилитологом и участниками', 'Итоговый тест и сертификат'].map((p) => (
                  <li key={p} className="flex gap-2.5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />{p}</li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <SignUp />
                <Demo />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-3xl border border-line p-8">
            <Users className="h-8 w-8 text-teal" />
            <h3 className="text-[20px] font-bold">Сначала посмотрите курс изнутри</h3>
            <p className="text-[15px] leading-relaxed text-navy-500">Откройте демо-доступ: уроки, 3D-атлас и тест доступны сразу, без регистрации.</p>
            <Demo light className="self-start" />
          </div>
        </div>
      </Section>

      {/* Second course: triathlon */}
      <section id="triathlon" className="scroll-mt-20 bg-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-cyan">Новый курс · для триатлонистов</div>
          <h2 className="mt-3 max-w-3xl text-[28px] font-bold leading-tight md:text-[38px]">Триатлон без травм: плавание, велосипед, бег и восстановление</h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-navy-300">Три вида спорта — одно тело. Курс о том, как не потерять сезон из-за плеча, колена или ахилла, и как восстанавливаться от спринта до Ironman.</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Waves, 'Плечо пловца', 'Почему болит и 4 упражнения для вращательной манжеты и лопатки.'],
              [Bike, 'Посадка на велосипеде', 'Высота седла, колени, поясница и шея в аэропозиции.'],
              [Footprints, 'Бег после велосипеда', 'Брик-тренировки, «ватные ноги», ахилл и голень.'],
              [HeartPulse, 'Топливо и восстановление', 'Углеводы на длинном старте, вода и соль, сон, REDs.'],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Waves;
              return (
                <div key={title as string} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <I className="h-6 w-6 text-cyan" />
                  <h3 className="mt-4 text-[17px] font-bold">{title as string}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-navy-300">{text as string}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TRI_OFFER.tiers.map((tier, i) => (
              <div key={tier.id} className={cn('flex flex-col rounded-3xl p-7 md:p-8', i === 0 ? 'border border-white/15 bg-white/5' : 'bg-white text-navy')} data-testid={`landing-tri-tier-${tier.id}`}>
                <div className={cn('text-[15px]', i === 0 ? 'text-navy-300' : 'text-navy-500')}>{tier.title}</div>
                <div className="mt-1 text-[40px] font-extrabold tracking-tight md:text-[46px]" data-testid="landing-tri-price">{fmtKzt(tier.priceKzt)}</div>
                <ul className="mt-5 flex-1 space-y-2.5 text-[15px]">
                  {tier.points.map((p) => (
                    <li key={p} className="flex gap-2.5"><CheckCircle2 className={cn('mt-0.5 h-5 w-5 shrink-0', i === 0 ? 'text-cyan' : 'text-teal')} />{p}</li>
                  ))}
                </ul>
                <a href={waTri(tier.title)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: i === 0 ? 'primary' : 'dark', className: 'mt-7 self-start' })} data-testid="landing-tri-signup">
                  <MessageCircle className="h-5 w-5" /> Записаться
                </a>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="outline" onClick={() => openDemo(TRI_OFFER.courseId)} loading={busy} className="border-white/40 text-white hover:bg-white/10" data-testid="landing-tri-demo">
              <PlayCircle className="h-5 w-5" /> Смотреть демо
            </Button>
            <span className="text-[14px] text-navy-300">{TRI_MODULES.length} модулей · {TRI_LESSONS.length} уроков · видео, 3D-атлас и чат</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg">
        <Section eyebrow="Вопросы" title="Частые вопросы">
          <div className="space-y-3">
            {[
              ['У меня сейчас болит колено. Курс поможет?', 'Курс образовательный: он объясняет причины и даёт программы профилактики и укрепления. Если есть отёк, блокада сустава, боль в покое или после травмы — сначала обратитесь к врачу.'],
              ['Подойдёт ли курс начинающему бегуну?', 'Да. Упражнения даны с вариантами для разного уровня, а правила роста нагрузки особенно полезны тем, кто только начинает.'],
              ['Как проходит обучение?', 'Видео, текстовые уроки с источниками, 3D-атлас и итоговый тест. Вопросы задаёте в закрытом чате в Telegram.'],
              ['Будет ли сертификат?', 'Да, после всех уроков и итогового теста вы получите сертификат о прохождении курса.'],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">{q}<ChevronDown className="h-5 w-5 shrink-0 text-navy-300 transition-transform group-open:rotate-180" /></summary>
                <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{a}</p>
              </details>
            ))}
          </div>
        </Section>
      </section>

      {/* Specialists come next */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-navy-500">Скоро · для специалистов</div>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-navy-700">Академия для реабилитологов, тренеров и спортивных врачей: профессиональные курсы, 3D-лаборатория анатомии, симуляции и возможность публиковать собственные программы.</p>
          </div>
          <Link to="/login" className={buttonVariants({ variant: 'secondary' })}>Вход для специалистов</Link>
        </div>
      </section>

      {/* Final CTA + footer */}
      <section className="bg-gradient-to-br from-teal to-teal-600 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h2 className="text-[28px] font-bold leading-tight md:text-[34px]">Бегайте дольше и без боли</h2>
            <p className="mt-2 text-white/85">Запишитесь на курс или сначала посмотрите демо.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SignUp dark />
            <Demo />
          </div>
        </div>
      </section>
      <footer className="bg-navy text-navy-300">
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-10 text-[13px] md:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-semibold text-white">Rehab Academy · FABS3D AI</span>
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp: +{RUN_OFFER.whatsapp.replace(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5')}</a>
            <Link to="/login" className="hover:text-white">Вход для участников</Link>
            <a href="#top" className="inline-flex items-center gap-1 hover:text-white">Наверх <ArrowRight className="h-3.5 w-3.5 -rotate-90" /></a>
          </div>
          <p>{t('app.eduOnly')}</p>
          <p>3D-модели: BodyParts3D © The Database Center for Life Science, CC BY 4.0.</p>
        </div>
      </footer>
    </div>
  );
}
