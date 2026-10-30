import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Award, Bike, CheckCircle2, ChevronDown, CreditCard, Footprints, GraduationCap, HeartPulse, KeyRound, MapPin, MessageCircle,
  PlayCircle, Quote, Rotate3d, Send, ShieldCheck, Smartphone, Snowflake, Sparkles, Stethoscope, Users,
} from 'lucide-react';
import { enroll, login } from '@/data/api';
import { DEMO_ATHLETE, DEMO_PASSWORD } from '@/data/seed';
import { RUN_COURSE, RUN_LESSONS, RUN_MODULES } from '@/data/content/runners';
import { TRI_COURSE, TRI_LESSONS, TRI_MODULES } from '@/data/content/triathlon';
import { KZ_COURSE, KZ_LESSONS, KZ_MODULES } from '@/data/content/kazakhstan';
import { CLINIC, CONTACTS, KASPI_URL, PRICING, REGIONS, REVIEWS, ZONES, type ZoneId } from '@/data/content/launch';
import { ConsultOffer } from '@/features/consult/Consult';
import { fmtKzt } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button, buttonVariants } from '@/components/ui';
import LangSwitch from '@/components/LangSwitch';
import SiteForm, { TELEGRAM_URL, WHATSAPP_URL, useLang } from '@/features/forms/SiteForm';

/* Public page of FAB3D Academy (fab3d-scan.com) in Russian and Kazakh:
   courses, regions, prices, how to join (form → Kaspi → code by email),
   reviews, FAQ and contacts. */

const img = (name: string) => `${import.meta.env.BASE_URL}landing/${name}`;
const kzt = fmtKzt;
const COURSES = [
  { course: RUN_COURSE, modules: RUN_MODULES.length, lessons: RUN_LESSONS.length, icon: Footprints, img: 'knee.webp' },
  { course: TRI_COURSE, modules: TRI_MODULES.length, lessons: TRI_LESSONS.length, icon: Bike, img: null },
  { course: KZ_COURSE, modules: KZ_MODULES.length, lessons: KZ_LESSONS.length, icon: Snowflake, img: 'foot.webp' },
];
const LESSONS_TOTAL = RUN_LESSONS.length + TRI_LESSONS.length + KZ_LESSONS.length;

const RU = {
  nav: { courses: 'Курсы', regions: 'Регионы', consult: 'Консультация', pricing: 'Тарифы', reviews: 'Отзывы', faq: 'Вопросы', login: 'Войти' },
  heroBadge: 'Платформа для бегунов, марафонцев и триатлонистов Казахстана',
  heroTitle: ['Бегайте дольше,', 'восстанавливайтесь быстрее'],
  heroText: 'Курсы реабилитолога о коленях, стопах, плече пловца, посадке на велосипеде и восстановлении. 3D-атлас тела, тренировки с учётом климата вашего региона и сообщество бегунов по городам.',
  apply: 'Оставить заявку', demo: 'Смотреть демо',
  launch: `Первый поток: ${kzt(PRICING.launch.firstMonthKzt)} за первый месяц — для первых ${PRICING.launch.seats} участников`,
  stats: [[`${COURSES.length}`, 'курса'], [`${LESSONS_TOTAL}`, 'уроков'], [`${REGIONS.length}`, 'городов'], ['3D', 'атлас тела']],
  bodyTags: ['Колени', 'Стопы', 'Восстановление'],
  coursesEyebrow: 'Курсы', coursesTitle: 'Три курса в одной подписке',
  courses: {
    'c-run': { title: RUN_COURSE.title, points: ['Почему болят колени и как их укрепить', 'Стопа, ахилл и подошвенная фасция', 'Восстановление после марафона'] },
    'c-tri': { title: TRI_COURSE.title, points: ['Плечо пловца и посадка на велосипеде', 'Бег после велосипеда и силовая', 'Питание на длинных стартах, вода и соль'] },
    'c-kz': { title: KZ_COURSE.title, points: ['Мороз и гололёд, манеж и дорожка', 'Жара на юге и западе, тепловой удар', 'Горы Алматы, смог, пост в Рамазан'] },
  } as Record<string, { title: string; points: string[] }>,
  modulesLessons: (m: number, l: number) => `${m} модулей · ${l} уроков`,
  insideEyebrow: 'Платформа', insideTitle: 'Что внутри',
  inside: [
    [PlayCircle, 'Видео от реабилитолога', 'Техника упражнений, разбор частых ошибок и восстановительная рутина.'],
    [Rotate3d, '3D-атлас и упражнения в 3D', 'Колено, стопа и голеностоп в 3D, а каждое упражнение показывает 3D-человечек: замедлите, поверните, посмотрите сбоку.'],
    [MapPin, 'Сообщество по городам', 'Чаты в Telegram: партнёры по пробежкам, маршруты, поездки на старты.'],
    [Users, 'Профиль и нетворкинг', 'Фото, рекорды, цели и соцсети. Карточка спортсмена и каталог участников — находите партнёров по тренировкам.'],
    [Sparkles, 'Сторис в один клик', 'Профиль, финиш или прогресс курса — готовая картинка для Instagram и Telegram.'],
    [Stethoscope, 'Консультация реабилитолога', `Онлайн или очно в центре ${CLINIC.name}, ${CLINIC.city}.`],
    [ShieldCheck, 'Доказательный подход', 'Каждый урок опирается на исследования и консенсусы, источники указаны.'],
    [Award, 'Тесты и сертификаты', 'Проверьте себя в конце курса и получите сертификат.'],
  ] as [typeof PlayCircle, string, string][],
  regionsEyebrow: 'Регионы', regionsTitle: 'Тренировки с учётом вашего климата',
  regionsText: 'Мороз в Астане, жара в Шымкенте, горы в Алматы, ветер на Каспии. Для каждого региона — свой урок и свой чат.',
  expertsEyebrow: 'Эксперты', expertsTitle: 'Кто ведёт курсы',
  experts: [
    [Stethoscope, 'Реабилитолог', 'Автор видеоуроков. Показывает технику упражнений и отвечает на вопросы в чате.'],
    [GraduationCap, 'Врач, магистр общественного здравоохранения (MPH, Йельский университет)', 'Доказательный подход: профилактика травм, нагрузка, сон и восстановление.'],
  ] as [typeof Stethoscope, string, string][],
  pricingEyebrow: 'Тарифы', pricingTitle: 'Подписка на платформу',
  plans: [
    { id: 'launch', name: 'Первый поток', price: kzt(PRICING.launch.firstMonthKzt), per: 'за первый месяц', note: `Первые ${PRICING.launch.seats} участников. Далее ${kzt(PRICING.monthlyKzt)} в месяц.`, points: ['Все курсы и видео', '3D-атлас тела', 'Чат потока с реабилитологом', 'Чат вашего города', 'Тесты и сертификаты'] },
    { id: 'month', name: 'Подписка', price: kzt(PRICING.monthlyKzt), per: 'в месяц', note: 'Со второго месяца. Без автосписаний — продлеваете сами.', points: ['Все курсы и новые материалы', '3D-атлас тела', 'Чаты сообщества', 'Тесты и сертификаты'] },
    { id: 'personal', name: 'Персональное сопровождение', price: kzt(PRICING.personalKzt), per: '', note: 'Состав согласуем с вами до оплаты.', points: ['Всё из подписки', 'Разбор вашей техники по видео', 'Онлайн-консультация реабилитолога', 'Персональный план профилактики на сезон'] },
  ],
  choose: 'Выбрать',
  joinEyebrow: 'Как начать', joinTitle: 'Три шага до доступа',
  steps: [['Оставьте заявку', 'Имя, email, город и тариф. Заявка придёт нам на почту.'], ['Оплатите через Kaspi', 'В комментарии к платежу укажите ваш email.'], ['Получите доступ', 'В течение 24 часов пришлём на email ссылку с кодом доступа.']],
  kaspi: 'Оплатить через Kaspi', haveCode: 'Уже оплатили? Активировать код',
  reviewsEyebrow: 'Отзывы', reviewsTitle: 'Отзывы участников',
  reviewsEmpty: 'Первый поток стартует сейчас — здесь появятся отзывы его участников. Уже прошли уроки? Расскажите, что было полезно.',
  leaveReview: 'Оставить отзыв',
  faqEyebrow: 'Вопросы', faqTitle: 'Частые вопросы',
  faq: [
    ['Как получить доступ?', 'Оставьте заявку, оплатите через Kaspi и укажите email в комментарии к платежу. В течение 24 часов мы пришлём на почту ссылку с кодом доступа.'],
    ['Что входит в подписку?', 'Все курсы платформы, видео реабилитолога, 3D-атлас, тесты и сертификаты, чаты сообщества по городам. Новые материалы добавляются по мере выхода.'],
    ['Подписка продлевается автоматически?', `Нет. Каждый следующий месяц (${kzt(PRICING.monthlyKzt)}) вы оплачиваете сами через Kaspi, и мы продлеваем доступ.`],
    ['Что такое «первый поток»?', `Первые ${PRICING.launch.seats} участников проходят программу вместе, в общем чате с реабилитологом. Первый месяц — ${kzt(PRICING.launch.firstMonthKzt)}, дальше — ${kzt(PRICING.monthlyKzt)} в месяц.`],
    ['У меня сейчас болит колено. Курс поможет?', 'Курсы образовательные: объясняют причины и дают программы профилактики и укрепления. Если есть отёк, блокада сустава, боль в покое или после травмы — сначала к врачу.'],
    ['На каком языке курсы?', 'Сайт и приложение — на русском и казахском. Уроки пока на русском, казахская версия готовится.'],
    ['Можно ли посмотреть до оплаты?', 'Да. Нажмите «Смотреть демо»: первый модуль каждого курса и 3D-атлас открыты бесплатно.'],
    ['Можно ли вернуть деньги?', 'Да, по условиям договора-оферты: полностью — до выдачи доступа, после — пропорционально неиспользованным дням.'],
  ],
  contactsEyebrow: 'Контакты', contactsTitle: 'Остались вопросы?', contactsText: 'Напишите нам в WhatsApp или Telegram, или задайте вопрос через форму — ответ придёт быстро.',
  channel: 'Telegram-канал',
  proEyebrow: 'Скоро · для специалистов', proText: 'Академия для реабилитологов, тренеров и спортивных врачей: профессиональные курсы, 3D-лаборатория анатомии и симуляции.', proLogin: 'Вход для специалистов',
  ctaTitle: 'Начните сезон без травм', ctaText: `Первый поток — ${kzt(PRICING.launch.firstMonthKzt)} за первый месяц, далее ${kzt(PRICING.monthlyKzt)} в месяц.`,
  footer: { offer: 'Договор-оферта', privacy: 'Политика конфиденциальности', activate: 'Активация доступа', login: 'Вход для участников' },
  edu: 'Только для образовательных целей. Материалы не являются медицинской консультацией и не заменяют осмотр врача.',
};

type Copy = typeof RU;

const KK: Copy = {
  nav: { courses: 'Курстар', regions: 'Өңірлер', consult: 'Кеңес', pricing: 'Тарифтер', reviews: 'Пікірлер', faq: 'Сұрақтар', login: 'Кіру' },
  heroBadge: 'Қазақстанның жүгірушілері, марафоншылары мен триатлоншыларына арналған платформа',
  heroTitle: ['Ұзағырақ жүгіріңіз,', 'тезірек қалпына келіңіз'],
  heroText: 'Тізе, табан, жүзушінің иығы, велосипедке дұрыс отыру және қалпына келу туралы оңалтушы курстары. Дененің 3D-атласы, өңіріңіздің климатына сай жаттығулар және қалалар бойынша жүгірушілер қауымдастығы.',
  apply: 'Өтінім қалдыру', demo: 'Демоны көру',
  launch: `Бірінші ағын: алғашқы ай ${kzt(PRICING.launch.firstMonthKzt)} — алғашқы ${PRICING.launch.seats} қатысушыға`,
  stats: [[`${COURSES.length}`, 'курс'], [`${LESSONS_TOTAL}`, 'сабақ'], [`${REGIONS.length}`, 'қала'], ['3D', 'дене атласы']],
  bodyTags: ['Тізе', 'Табан', 'Қалпына келу'],
  coursesEyebrow: 'Курстар', coursesTitle: 'Бір жазылымда үш курс',
  courses: {
    'c-run': { title: 'Тізе, табан және қалпына келу: жүгірушілерге арналған курс', points: ['Тізе неге ауырады және оны қалай нығайту керек', 'Табан, ахилл сіңірі және табан фасциясы', 'Марафоннан кейін қалпына келу'] },
    'c-tri': { title: 'Жарақатсыз триатлон: жүзу, велосипед, жүгіру және қалпына келу', points: ['Жүзушінің иығы және велосипедке отыру', 'Велосипедтен кейінгі жүгіру және күш жаттығулары', 'Ұзақ жарыстағы тамақтану, су және тұз'] },
    'c-kz': { title: 'Қазақстанда жүгіру: климат, өңірлер және маусым', points: ['Аяз бен көктайғақ, манеж және жүгіру жолы', 'Оңтүстік пен батыстағы ыстық, ыстық өту', 'Алматы таулары, түтін, Рамазандағы ораза'] },
  },
  modulesLessons: (m: number, l: number) => `${m} модуль · ${l} сабақ`,
  insideEyebrow: 'Платформа', insideTitle: 'Ішінде не бар',
  inside: [
    [PlayCircle, 'Оңалтушының бейнелері', 'Жаттығу техникасы, жиі кездесетін қателер және қалпына келу тәртібі.'],
    [Rotate3d, '3D-атлас және 3D-жаттығулар', 'Тізе, табан және тобық 3D-де, ал әр жаттығуды 3D-адам көрсетеді: баяулатыңыз, айналдырыңыз, бүйірден қараңыз.'],
    [MapPin, 'Қалалар бойынша қауымдастық', 'Telegram-дағы чаттар: бірге жүгіру, маршруттар, жарыстарға бару.'],
    [Users, 'Профиль және нетворкинг', 'Фото, рекордтар, мақсаттар және әлеуметтік желілер. Спортшы карточкасы мен қатысушылар каталогы — жаттығу серіктерін табыңыз.'],
    [Sparkles, 'Бір батырмамен сторис', 'Профиль, мәре немесе курс прогресі — Instagram мен Telegram үшін дайын сурет.'],
    [Stethoscope, 'Оңалтушы кеңесі', `Онлайн немесе ${CLINIC.name} орталығында, ${CLINIC.cityKk}.`],
    [ShieldCheck, 'Дәлелді тәсіл', 'Әр сабақ зерттеулер мен консенсустарға сүйенеді, дереккөздері көрсетілген.'],
    [Award, 'Тесттер мен сертификаттар', 'Курс соңында өзіңізді тексеріп, сертификат алыңыз.'],
  ],
  regionsEyebrow: 'Өңірлер', regionsTitle: 'Климатыңызға сай жаттығулар',
  regionsText: 'Астанадағы аяз, Шымкенттегі ыстық, Алматыдағы таулар, Каспийдегі жел. Әр өңірге — өз сабағы және өз чаты.',
  expertsEyebrow: 'Сарапшылар', expertsTitle: 'Курстарды кім жүргізеді',
  experts: [
    [Stethoscope, 'Оңалтушы', 'Бейнесабақтардың авторы. Жаттығу техникасын көрсетеді және чатта сұрақтарға жауап береді.'],
    [GraduationCap, 'Дәрігер, қоғамдық денсаулық сақтау магистрі (MPH, Йель университеті)', 'Дәлелді тәсіл: жарақаттың алдын алу, жүктеме, ұйқы және қалпына келу.'],
  ],
  pricingEyebrow: 'Тарифтер', pricingTitle: 'Платформаға жазылым',
  plans: [
    { id: 'launch', name: 'Бірінші ағын', price: kzt(PRICING.launch.firstMonthKzt), per: 'алғашқы ай', note: `Алғашқы ${PRICING.launch.seats} қатысушы. Кейін айына ${kzt(PRICING.monthlyKzt)}.`, points: ['Барлық курстар мен бейнелер', 'Дененің 3D-атласы', 'Оңалтушымен ағын чаты', 'Қалаңыздың чаты', 'Тесттер мен сертификаттар'] },
    { id: 'month', name: 'Жазылым', price: kzt(PRICING.monthlyKzt), per: 'айына', note: 'Екінші айдан бастап. Автоматты түрде шешілмейді — өзіңіз ұзартасыз.', points: ['Барлық курстар және жаңа материалдар', 'Дененің 3D-атласы', 'Қауымдастық чаттары', 'Тесттер мен сертификаттар'] },
    { id: 'personal', name: 'Жеке сүйемелдеу', price: kzt(PRICING.personalKzt), per: '', note: 'Құрамын төлемге дейін сізбен келісеміз.', points: ['Жазылымдағының бәрі', 'Техникаңызды бейне арқылы талдау', 'Оңалтушының онлайн-кеңесі', 'Маусымға жеке алдын алу жоспары'] },
  ],
  choose: 'Таңдау',
  joinEyebrow: 'Қалай бастау керек', joinTitle: 'Қолжетімділікке дейін үш қадам',
  steps: [['Өтінім қалдырыңыз', 'Аты, email, қала және тариф. Өтінім бізге поштаға келеді.'], ['Kaspi арқылы төлеңіз', 'Төлемге түсініктемеде email-іңізді көрсетіңіз.'], ['Қолжетімділік алыңыз', '24 сағат ішінде email-ге қолжетімділік коды бар сілтеме жібереміз.']],
  kaspi: 'Kaspi арқылы төлеу', haveCode: 'Төледіңіз бе? Кодты белсендіру',
  reviewsEyebrow: 'Пікірлер', reviewsTitle: 'Қатысушылардың пікірлері',
  reviewsEmpty: 'Бірінші ағын қазір басталады — мұнда оның қатысушыларының пікірлері шығады. Сабақтардан өттіңіз бе? Не пайдалы болғанын айтыңыз.',
  leaveReview: 'Пікір қалдыру',
  faqEyebrow: 'Сұрақтар', faqTitle: 'Жиі қойылатын сұрақтар',
  faq: [
    ['Қолжетімділікті қалай алуға болады?', 'Өтінім қалдырып, Kaspi арқылы төлеңіз және төлемге түсініктемеде email-іңізді көрсетіңіз. 24 сағат ішінде поштаға қолжетімділік коды бар сілтеме жібереміз.'],
    ['Жазылымға не кіреді?', 'Платформаның барлық курстары, оңалтушының бейнелері, 3D-атлас, тесттер мен сертификаттар, қалалар бойынша қауымдастық чаттары. Жаңа материалдар шыққан сайын қосылады.'],
    ['Жазылым автоматты түрде ұзартыла ма?', `Жоқ. Әр келесі айды (${kzt(PRICING.monthlyKzt)}) Kaspi арқылы өзіңіз төлейсіз, біз қолжетімділікті ұзартамыз.`],
    ['«Бірінші ағын» дегеніміз не?', `Алғашқы ${PRICING.launch.seats} қатысушы бағдарламадан бірге, оңалтушымен ортақ чатта өтеді. Алғашқы ай — ${kzt(PRICING.launch.firstMonthKzt)}, кейін айына ${kzt(PRICING.monthlyKzt)}.`],
    ['Қазір тізем ауырады. Курс көмектесе ме?', 'Курстар білім беруге арналған: себептерін түсіндіреді және алдын алу мен нығайту бағдарламаларын береді. Ісіну, буынның бітелуі, тыныштықтағы немесе жарақаттан кейінгі ауырсыну болса — алдымен дәрігерге.'],
    ['Курстар қай тілде?', 'Сайт пен қосымша — орыс және қазақ тілдерінде. Сабақтар әзірге орыс тілінде, қазақша нұсқасы дайындалуда.'],
    ['Төлемге дейін көруге бола ма?', 'Иә. «Демоны көру» батырмасын басыңыз: әр курстың бірінші модулі мен 3D-атлас тегін ашық.'],
    ['Ақшаны қайтаруға бола ма?', 'Иә, оферта шартына сәйкес: қолжетімділік берілгенге дейін — толық, кейін — пайдаланылмаған күндерге пропорционалды.'],
  ],
  contactsEyebrow: 'Байланыс', contactsTitle: 'Сұрақтарыңыз қалды ма?', contactsText: 'WhatsApp немесе Telegram-ға жазыңыз, не форма арқылы сұрақ қойыңыз — тез жауап береміз.',
  channel: 'Telegram-арна',
  proEyebrow: 'Жақында · мамандарға', proText: 'Оңалтушыларға, жаттықтырушыларға және спорт дәрігерлеріне арналған академия: кәсіби курстар, 3D анатомия зертханасы және симуляциялар.', proLogin: 'Мамандарға кіру',
  ctaTitle: 'Маусымды жарақатсыз бастаңыз', ctaText: `Бірінші ағын — алғашқы ай ${kzt(PRICING.launch.firstMonthKzt)}, кейін айына ${kzt(PRICING.monthlyKzt)}.`,
  footer: { offer: 'Оферта шарты', privacy: 'Құпиялылық саясаты', activate: 'Қолжетімділікті белсендіру', login: 'Қатысушыларға кіру' },
  edu: 'Тек білім беру мақсатында. Материалдар медициналық кеңес емес және дәрігердің тексеруін алмастырмайды.',
};

const ZONE_ORDER: ZoneId[] = ['north', 'almaty', 'south', 'west', 'centerEast'];

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-20', className)}>
      <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-teal">{eyebrow}</div>
      <h2 className="mt-3 max-w-3xl text-[30px] font-bold leading-tight tracking-tight md:text-[40px]">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default function Landing() {
  const lang = useLang();
  const c = lang === 'kk' ? KK : RU;
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState('launch');
  const [review, setReview] = useState(false);
  useEffect(() => { document.title = lang === 'kk' ? 'FAB3D Academy — жүгірушілер мен триатлоншыларға арналған платформа' : 'FAB3D Academy — платформа для бегунов и триатлонистов'; }, [lang]);

  async function openDemo(courseId: string = RUN_COURSE.id) {
    setBusy(true);
    try {
      await login(DEMO_ATHLETE, DEMO_PASSWORD);
      try { enroll(courseId); } catch { /* already enrolled: the course page explains */ }
      nav(`/courses/${courseId}`);
    } finally {
      setBusy(false);
    }
  }
  function choose(id: string) {
    setPlan(id);
    document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  }

  const Apply = ({ dark }: { dark?: boolean }) => (
    <a href="#join" className={buttonVariants({ size: 'lg', variant: dark ? 'dark' : 'primary' })} data-testid="landing-signup"><MessageCircle className="h-5 w-5" /> {c.apply}</a>
  );
  const Demo = ({ courseId, light }: { courseId?: string; light?: boolean }) => (
    <Button size="lg" variant={light ? 'secondary' : 'outline'} onClick={() => openDemo(courseId)} loading={busy} className={cn(!light && 'border-white/40 text-white hover:bg-white/10')} data-testid={courseId ? `landing-demo-${courseId}` : 'landing-demo'}>
      <PlayCircle className="h-5 w-5" /> {c.demo}
    </Button>
  );

  return (
    <div className="min-h-screen bg-white text-navy" data-testid="landing" lang={lang}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:gap-6 md:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal to-cyan"><Activity className="h-5 w-5" strokeWidth={2.4} /></span>
            <span className="leading-tight"><b className="block text-[15px]">FAB3D Academy</b><span className="hidden text-[11px] text-navy-300 sm:block">fab3d-scan.com</span></span>
          </a>
          <nav className="ml-auto hidden items-center gap-5 text-sm text-navy-300 lg:flex">
            <a href="#courses" className="hover:text-white">{c.nav.courses}</a>
            <a href="#regions" className="hover:text-white">{c.nav.regions}</a>
            <a href="#consult" className="hover:text-white">{c.nav.consult}</a>
            <a href="#pricing" className="hover:text-white">{c.nav.pricing}</a>
            <a href="#reviews" className="hover:text-white">{c.nav.reviews}</a>
            <a href="#faq" className="hover:text-white">{c.nav.faq}</a>
          </nav>
          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <LangSwitch dark />
            <Link to="/login" className="text-sm font-semibold text-white/90 hover:text-white">{c.nav.login}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-teal/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:pb-24 md:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-semibold text-cyan">
              <Footprints className="h-4 w-4 shrink-0" /> {c.heroBadge}
            </div>
            <h1 className="mt-5 text-[36px] font-extrabold leading-[1.05] tracking-tight md:text-[58px]">
              {c.heroTitle[0]} <span className="text-cyan">{c.heroTitle[1]}</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy-300">{c.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Apply />
              <Demo />
            </div>
            <a href="#pricing" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-white/15" data-testid="landing-launch">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan" /> {c.launch}
            </a>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
              {c.stats.map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="text-xl font-bold">{n}</div>
                  <div className="text-navy-300">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-[400px] w-full max-w-sm md:h-[560px]">
            <img src={img('body.webp')} alt="3D" className="h-full w-full object-contain drop-shadow-[0_30px_60px_rgba(8,127,140,0.45)]" />
            {c.bodyTags.map((label, i) => {
              const I = [Activity, Footprints, HeartPulse][i];
              return (
                <div key={label} className={cn('absolute flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[13px] font-semibold text-navy shadow-[var(--shadow-lift)]', ['top-[46%] -left-2', 'bottom-[6%] right-0', 'top-[12%] right-0'][i])}>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal"><I className="h-4 w-4" /></span>{label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Courses */}
      <Section id="courses" eyebrow={c.coursesEyebrow} title={c.coursesTitle}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {COURSES.map(({ course, modules, lessons, icon: Icon, img: pic }) => {
            const t = c.courses[course.id];
            return (
              <div key={course.id} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]" data-testid={`landing-course-${course.id}`}>
                <div className="relative grid h-44 place-items-center bg-gradient-to-br from-navy to-teal-600">
                  {pic ? <img src={img(pic)} alt="" className="h-40 object-contain" loading="lazy" /> : <Icon className="h-20 w-20 text-white/80" strokeWidth={1.2} />}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-[19px] font-bold leading-snug">{t.title}</h3>
                  <div className="mt-1 text-[13px] text-navy-500">{c.modulesLessons(modules, lessons)}</div>
                  <ul className="mt-4 flex-1 space-y-2.5">
                    {t.points.map((p) => <li key={p} className="flex gap-2.5 text-[14.5px] text-navy-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{p}</li>)}
                  </ul>
                  <div className="mt-5"><Demo courseId={course.id} light /></div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Inside the platform */}
      <section className="bg-bg">
        <Section eyebrow={c.insideEyebrow} title={c.insideTitle}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.inside.map(([I, title, text]) => (
              <div key={title} className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                <I className="h-6 w-6 text-teal" />
                <h3 className="mt-3 text-[16px] font-bold">{title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-navy-500">{text}</p>
              </div>
            ))}
          </div>
          <img src={img('atlas.webp')} alt="3D" className="mt-8 w-full rounded-3xl border border-line shadow-[var(--shadow-card)]" loading="lazy" />
        </Section>
      </section>

      {/* Regions */}
      <section id="regions" className="scroll-mt-16 bg-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
          <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-cyan">{c.regionsEyebrow}</div>
          <h2 className="mt-3 max-w-3xl text-[30px] font-bold leading-tight md:text-[40px]">{c.regionsTitle}</h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-navy-300">{c.regionsText}</p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ZONE_ORDER.map((z) => (
              <div key={z} className="rounded-3xl border border-white/10 bg-white/5 p-6" data-testid={`zone-${z}`}>
                <h3 className="text-[18px] font-bold">{ZONES[z][lang].title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-navy-300">{ZONES[z][lang].text}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {REGIONS.filter((r) => r.zone === z).map((r) => <span key={r.id} className="rounded-full bg-white/10 px-2.5 py-1 text-[12.5px]">{r[lang]}</span>)}
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-3xl bg-gradient-to-br from-teal to-teal-600 p-6">
              <MapPin className="h-7 w-7" />
              <p className="mt-3 text-[15px] font-semibold leading-relaxed">{lang === 'kk' ? 'Қалаңыздың чатына қосылыңыз — тіркелгеннен кейін «Қауымдастық» бөлімінде.' : 'Чат своего города — в разделе «Сообщество» после входа.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Experts */}
      <Section eyebrow={c.expertsEyebrow} title={c.expertsTitle}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {c.experts.map(([I, title, text]) => (
            <div key={title} className="flex gap-5 rounded-3xl border border-line p-6">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal to-cyan text-white"><I className="h-8 w-8" /></span>
              <div>
                <h3 className="text-[18px] font-bold leading-snug">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-navy-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Consultation */}
      <Section id="consult" eyebrow={c.nav.consult} title={lang === 'kk' ? 'Оңалтушының кеңесі: онлайн немесе орталықта' : 'Консультация реабилитолога: онлайн или очно'}>
          <p className="-mt-4 mb-6 max-w-2xl text-[16px] leading-relaxed text-navy-500">{lang === 'kk'
            ? `Тізе, табан немесе иық ауыра ма? Әлде жарыс алдында алдын алу жоспары керек пе? Курс оңалтушысына онлайн немесе ${CLINIC.name} орталығында (${CLINIC.cityKk}) жазылыңыз.`
            : `Болит колено, стопа или плечо? Нужен план профилактики перед стартом? Запишитесь к реабилитологу курса — онлайн или очно в центре ${CLINIC.name} (${CLINIC.city}).`}</p>
          <ConsultOffer className="max-w-3xl" />
      </Section>

      {/* Pricing */}
      <section className="bg-bg">
        <Section id="pricing" eyebrow={c.pricingEyebrow} title={c.pricingTitle}>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {c.plans.map((p, i) => (
              <div key={p.id} className={cn('flex flex-col rounded-3xl p-7', i === 0 ? 'bg-navy text-white shadow-[var(--shadow-lift)]' : 'border border-line bg-white')} data-testid={`plan-${p.id}`}>
                <div className={cn('text-[15px] font-semibold', i === 0 ? 'text-cyan' : 'text-teal')}>{p.name}</div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[40px] font-extrabold tracking-tight" data-testid="plan-price">{p.price}</span>
                  {p.per && <span className={cn('text-[14px]', i === 0 ? 'text-navy-300' : 'text-navy-500')}>{p.per}</span>}
                </div>
                <p className={cn('mt-1 text-[13.5px]', i === 0 ? 'text-navy-300' : 'text-navy-500')}>{p.note}</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-[14.5px]">
                  {p.points.map((x) => <li key={x} className="flex gap-2.5"><CheckCircle2 className={cn('mt-0.5 h-5 w-5 shrink-0', i === 0 ? 'text-cyan' : 'text-teal')} />{x}</li>)}
                </ul>
                <Button size="lg" variant={i === 0 ? 'primary' : 'secondary'} className="mt-6 self-start" onClick={() => choose(p.id)} data-testid={`choose-${p.id}`}>{c.choose}</Button>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* Join: form → Kaspi → code */}
      <Section id="join" eyebrow={c.joinEyebrow} title={c.joinTitle}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <ol className="space-y-5">
              {c.steps.map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-[15px] font-bold text-white">{i + 1}</span>
                  <div><div className="text-[17px] font-bold">{title}</div><p className="mt-1 text-[14.5px] text-navy-500">{text}</p></div>
                </li>
              ))}
            </ol>
            <div className="mt-7 flex flex-col items-start gap-3">
              <a href={KASPI_URL} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: 'dark' })} data-testid="landing-kaspi"><CreditCard className="h-5 w-5" /> {c.kaspi}</a>
              <Link to="/activate" className="inline-flex items-center gap-2 text-[14px] font-semibold text-teal"><KeyRound className="h-4 w-4" /> {c.haveCode}</Link>
            </div>
          </div>
          <SiteForm key={plan} kind="apply" defaults={{ plan }} />
        </div>
      </Section>

      {/* Reviews */}
      <section className="bg-bg">
        <Section id="reviews" eyebrow={c.reviewsEyebrow} title={c.reviewsTitle}>
          {REVIEWS.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {REVIEWS.map((r) => (
                <figure key={r.name + r.text.slice(0, 20)} className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <Quote className="h-6 w-6 text-teal" />
                  <blockquote className="mt-3 text-[15px] leading-relaxed text-navy-700">{r.text}</blockquote>
                  <figcaption className="mt-4 text-[13px] font-semibold">{r.name} · <span className="font-normal text-navy-500">{r.city}, {r.sport}</span></figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="max-w-2xl text-[15.5px] leading-relaxed text-navy-500" data-testid="reviews-empty">{c.reviewsEmpty}</p>
          )}
          <Button variant="secondary" className="mt-6" onClick={() => setReview((x) => !x)} data-testid="leave-review">{c.leaveReview}</Button>
          {review && <SiteForm kind="review" className="mt-5 max-w-2xl" />}
        </Section>
      </section>

      {/* FAQ */}
      <Section id="faq" eyebrow={c.faqEyebrow} title={c.faqTitle}>
        <div className="space-y-3">
          {c.faq.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-line bg-white px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">{q}<ChevronDown className="h-5 w-5 shrink-0 text-navy-300 transition-transform group-open:rotate-180" /></summary>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Contacts */}
      <section className="bg-bg">
        <Section id="contacts" eyebrow={c.contactsEyebrow} title={c.contactsTitle}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[15.5px] leading-relaxed text-navy-500">{c.contactsText}</p>
              <div className="mt-6 flex flex-col items-start gap-3">
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })} data-testid="landing-whatsapp"><MessageCircle className="h-5 w-5" /> WhatsApp +7 707 373 77 67</a>
                <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: 'secondary' })} data-testid="landing-telegram"><Send className="h-5 w-5" /> Telegram @{CONTACTS.telegram}</a>
                {CONTACTS.telegramChannel && <a href={CONTACTS.telegramChannel} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg', variant: 'secondary' })}><Send className="h-5 w-5" /> {c.channel}</a>}
              </div>
            </div>
            <SiteForm kind="question" />
          </div>
        </Section>
      </section>

      {/* Specialists come next */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.18em] text-navy-500">{c.proEyebrow}</div>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-navy-700">{c.proText}</p>
          </div>
          <Link to="/login" className={buttonVariants({ variant: 'secondary' })}>{c.proLogin}</Link>
        </div>
      </section>

      {/* Final CTA + footer */}
      <section className="bg-gradient-to-br from-teal to-teal-600 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h2 className="text-[28px] font-bold leading-tight md:text-[34px]">{c.ctaTitle}</h2>
            <p className="mt-2 text-white/85">{c.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Apply dark />
            <Demo />
          </div>
        </div>
      </section>
      <footer className="bg-navy text-navy-300">
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-10 text-[13px] md:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-semibold text-white">FAB3D Academy · SB dev</span>
            <Link to="/offer" className="hover:text-white" data-testid="footer-offer">{c.footer.offer}</Link>
            <Link to="/privacy" className="hover:text-white">{c.footer.privacy}</Link>
            <Link to="/activate" className="hover:text-white">{c.footer.activate}</Link>
            <Link to="/login" className="hover:text-white">{c.footer.login}</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a>
            <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-white">Telegram</a>
          </div>
          <p className="flex items-start gap-2"><Smartphone className="mt-0.5 h-4 w-4 shrink-0" /> {c.edu}</p>
          <p>3D-модели: BodyParts3D © The Database Center for Life Science, CC BY 4.0.</p>
        </div>
      </footer>
    </div>
  );
}
