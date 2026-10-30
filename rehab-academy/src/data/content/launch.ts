/* Launch settings for fab3d-scan.com: contacts, payment, prices, legal
   details, reviews and the regions of Kazakhstan. Edit here and redeploy. */

export const CONTACTS = {
  /** WhatsApp, international format, digits only. */
  whatsapp: '77073737767',
  /** Telegram username without @. */
  telegram: 'ecosystem_tech',
  /** Telegram channel link, e.g. https://t.me/your_channel. Empty — the button is hidden. */
  telegramChannel: '',
  /** Where every site form arrives (through FormSubmit). */
  formsEmail: 'sbsqbiz@gmail.com',
};

/** Kaspi payment link. */
export const KASPI_URL = 'https://pay.kaspi.kz/pay/jk9m2wsj';

export const PRICING = {
  monthlyKzt: 10_000,
  /** Launch offer: the first stream's first month. */
  launch: { firstMonthKzt: 20_000, seats: 500 },
  personalKzt: 200_000,
};

/** Seller details for the public offer. Fill in the БИН/ИИН and address before taking payments. */
export const LEGAL = {
  seller: 'SB dev',
  idNumber: '',
  address: '',
  email: 'sbsqbiz@gmail.com',
  effectiveDate: '30.10.2026',
};

/** Real reviews only: { name, city, sport, text }. Empty — the page shows the review form. */
export const REVIEWS: { name: string; city: string; sport: string; text: string }[] = [];

export type ZoneId = 'north' | 'centerEast' | 'almaty' | 'south' | 'west';

export interface Region { id: string; ru: string; kk: string; zone: ZoneId; chat?: string }

/** Cities of republican significance and regional centres. `chat` — Telegram link of the city chat. */
export const REGIONS: Region[] = [
  { id: 'astana', ru: 'Астана', kk: 'Астана', zone: 'north' },
  { id: 'almaty', ru: 'Алматы', kk: 'Алматы', zone: 'almaty' },
  { id: 'shymkent', ru: 'Шымкент', kk: 'Шымкент', zone: 'south' },
  { id: 'karaganda', ru: 'Караганда', kk: 'Қарағанды', zone: 'centerEast' },
  { id: 'aktobe', ru: 'Актобе', kk: 'Ақтөбе', zone: 'west' },
  { id: 'atyrau', ru: 'Атырау', kk: 'Атырау', zone: 'west' },
  { id: 'aktau', ru: 'Актау', kk: 'Ақтау', zone: 'west' },
  { id: 'uralsk', ru: 'Уральск', kk: 'Орал', zone: 'west' },
  { id: 'ust-kamenogorsk', ru: 'Усть-Каменогорск', kk: 'Өскемен', zone: 'centerEast' },
  { id: 'semey', ru: 'Семей', kk: 'Семей', zone: 'centerEast' },
  { id: 'pavlodar', ru: 'Павлодар', kk: 'Павлодар', zone: 'north' },
  { id: 'kostanay', ru: 'Костанай', kk: 'Қостанай', zone: 'north' },
  { id: 'kokshetau', ru: 'Кокшетау', kk: 'Көкшетау', zone: 'north' },
  { id: 'petropavl', ru: 'Петропавловск', kk: 'Петропавл', zone: 'north' },
  { id: 'taraz', ru: 'Тараз', kk: 'Тараз', zone: 'south' },
  { id: 'kyzylorda', ru: 'Кызылорда', kk: 'Қызылорда', zone: 'south' },
  { id: 'turkestan', ru: 'Туркестан', kk: 'Түркістан', zone: 'south' },
  { id: 'taldykorgan', ru: 'Талдыкорган', kk: 'Талдықорған', zone: 'almaty' },
  { id: 'konaev', ru: 'Конаев', kk: 'Қонаев', zone: 'almaty' },
  { id: 'zhezkazgan', ru: 'Жезказган', kk: 'Жезқазған', zone: 'centerEast' },
];

/** What matters for runners in each climate zone; `lesson` — the matching lesson of the Kazakhstan course. */
export const ZONES: Record<ZoneId, { ru: { title: string; text: string }; kk: { title: string; text: string }; lesson: string }> = {
  north: {
    ru: { title: 'Север и столица', text: 'Морозы до −30 °C, ветер и гололёд. Главное — тёплые слои, ледоступы, манеж и дорожка зимой.' },
    kk: { title: 'Солтүстік және елорда', text: '−30 °C-қа дейін аяз, жел және көктайғақ. Ең бастысы — жылы қабаттар, мұзға арналған шипалар, қыста манеж бен жүгіру жолы.' },
    lesson: 'l-z2',
  },
  centerEast: {
    ru: { title: 'Центр и Восток', text: 'Ветер и холодная зима, горы Алтая на востоке, зимний смог в промышленных городах.' },
    kk: { title: 'Орталық және Шығыс', text: 'Жел мен суық қыс, шығыста Алтай таулары, өнеркәсіпті қалаларда қысқы түтін.' },
    lesson: 'l-z7',
  },
  almaty: {
    ru: { title: 'Алматы и Жетысу', text: 'Горы и высота, трейлы с перепадами, зимний смог в Алматы. Учимся бегать в горах и следить за качеством воздуха.' },
    kk: { title: 'Алматы және Жетісу', text: 'Таулар мен биіктік, биіктік айырмасы бар трейлдер, Алматыдағы қысқы түтін. Тауда жүгіруді және ауа сапасын бақылауды үйренеміз.' },
    lesson: 'l-z6',
  },
  south: {
    ru: { title: 'Юг', text: 'Летом до +40 °C. Акклиматизация к жаре, ранние тренировки, вода и соль, признаки теплового удара.' },
    kk: { title: 'Оңтүстік', text: 'Жазда +40 °C-қа дейін. Ыстыққа бейімделу, ерте жаттығу, су мен тұз, ыстық өту белгілері.' },
    lesson: 'l-z4',
  },
  west: {
    ru: { title: 'Запад и Каспий', text: 'Жаркое лето, сильный ветер, влажность у моря и холодная ветреная зима.' },
    kk: { title: 'Батыс және Каспий', text: 'Ыстық жаз, қатты жел, теңіз жағасындағы ылғалдылық және суық желді қыс.' },
    lesson: 'l-z4',
  },
};
