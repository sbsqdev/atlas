/* Texts of the MedTech forum page (fab3d-scan.com/forum) in English, Russian
   and Uzbek (Latin script). Achievements listed here were provided by the team. */

export type ForumLang = 'en' | 'ru' | 'uz';
export const FORUM_LANGS: { id: ForumLang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'ru', label: 'RU' },
  { id: 'uz', label: 'UZ' },
];

type T = Record<ForumLang, string>;

export const COPY = {
  badge: { en: 'MedTech Forum · FAB3D AI', ru: 'MedTech-форум · FAB3D AI', uz: 'MedTech forumi · FAB3D AI' },
  title: {
    en: '3D anatomy, simulations and AI agents for medicine and rehabilitation',
    ru: '3D-анатомия, симуляции и ИИ-агенты для медицины и реабилитации',
    uz: 'Tibbiyot va reabilitatsiya uchun 3D anatomiya, simulyatsiyalar va sunʼiy intellekt agentlari',
  },
  sub: {
    en: 'Before/after simulations for orthognathic, dental and aesthetic surgeons, 3D face scanning, digital education and AI tools for clinics and universities in Central Asia. Try the demos below — no registration needed.',
    ru: 'Симуляции «до / после» для ортогнатических хирургов, стоматологов и эстетической медицины, 3D-скан лица, цифровое обучение и ИИ-инструменты для клиник и университетов Центральной Азии. Попробуйте демо ниже — без регистрации.',
    uz: 'Ortognatik jarrohlar, stomatologlar va estetik tibbiyot uchun «oldin / keyin» simulyatsiyalari, yuzning 3D skaneri, Markaziy Osiyodagi klinikalar va universitetlar uchun raqamli taʼlim va sunʼiy intellekt vositalari. Quyidagi demolarni sinab koʻring — roʻyxatdan oʻtish shart emas.',
  },
  ctaContact: { en: 'Leave your contact', ru: 'Оставить контакт', uz: 'Kontakt qoldirish' },
  ctaDemo: { en: 'Try the demo', ru: 'Смотреть демо', uz: 'Demoni koʻrish' },
  nav: {
    demo: { en: 'Demo', ru: 'Демо', uz: 'Demo' },
    surgery: { en: 'Surgery', ru: 'Хирургия', uz: 'Jarrohlik' },
    agents: { en: 'AI agents', ru: 'ИИ-агенты', uz: 'AI agentlar' },
    partners: { en: 'Partnership', ru: 'Партнёрство', uz: 'Hamkorlik' },
    contact: { en: 'Contact', ru: 'Контакты', uz: 'Aloqa' },
  },

  pilots: { en: '200+ simulation pilots', ru: '200+ пилотов в области симуляций', uz: 'Simulyatsiya sohasida 200+ pilot' },
  pilotsLabel: { en: 'simulation pilots', ru: 'пилотов в области симуляций', uz: 'simulyatsiya sohasidagi pilot' },
  surgTitle: { en: 'Before / after simulations for surgeons', ru: 'Симуляции «до / после» для хирургов', uz: 'Jarrohlar uchun «oldin / keyin» simulyatsiyalari' },
  surgSub: {
    en: 'We show the patient and the surgeon the expected result before treatment: orthognathic surgery, dentistry and aesthetic medicine — on CBCT data and a 3D scan of the face.',
    ru: 'Показываем пациенту и хирургу ожидаемый результат до лечения: ортогнатическая хирургия, стоматология и эстетическая медицина — на данных КЛКТ и 3D-скане лица.',
    uz: 'Davolashdan oldin bemor va jarrohga kutilayotgan natijani koʻrsatamiz: ortognatik jarrohlik, stomatologiya va estetik tibbiyot — KLKT maʼlumotlari va yuzning 3D skaneri asosida.',
  },
  surg: [
    {
      title: { en: 'Orthognathic surgery', ru: 'Ортогнатическая хирургия', uz: 'Ortognatik jarrohlik' },
      text: {
        en: '3D cephalometry from CBCT: ramus height, gonial angle and jaw asymmetry left vs right; planning of jaw movements and a before/after view of the profile.',
        ru: '3D-цефалометрия по КЛКТ: высота ветви, гониальный угол и асимметрия челюсти справа и слева; планирование перемещений челюстей и вид профиля «до / после».',
        uz: 'KLKT boʻyicha 3D sefalometriya: shox balandligi, gonial burchak va jagʻning oʻng-chap assimetriyasi; jagʻ siljishlarini rejalashtirish va profilning «oldin / keyin» koʻrinishi.',
      },
    },
    {
      title: { en: 'Dentistry and implantology', ru: 'Стоматология и имплантология', uz: 'Stomatologiya va implantologiya' },
      text: {
        en: 'Automatic CBCT segmentation of the jaws, teeth and mandibular nerve canals; a risk radar for implant planning: nerve safety buffer, thin cortical bone, soft bone, periapical lesions.',
        ru: 'Автоматическая сегментация КЛКТ: челюсти, зубы и каналы нижнечелюстного нерва; «радар рисков» для планирования имплантации: зона безопасности нерва, тонкий кортикал, мягкая кость, очаги у верхушек.',
        uz: 'KLKT ni avtomatik segmentatsiya qilish: jagʻlar, tishlar va pastki jagʻ nervi kanallari; implantatsiyani rejalashtirish uchun «xavf radari»: nerv xavfsizlik zonasi, yupqa kortikal qatlam, yumshoq suyak, ildiz uchidagi oʻchoqlar.',
      },
    },
    {
      title: { en: 'Aesthetic medicine', ru: 'Эстетическая медицина', uz: 'Estetik tibbiyot' },
      text: {
        en: 'Visualising the expected result on the patient’s own 3D face before the procedure — for an honest consultation and informed consent.',
        ru: 'Визуализация ожидаемого результата на 3D-модели лица самого пациента до процедуры — для честной консультации и осознанного согласия.',
        uz: 'Muolajadan oldin bemorning oʻz yuzining 3D modelida kutilayotgan natijani koʻrsatish — halol maslahat va ongli rozilik uchun.',
      },
    },
    {
      title: { en: '3D face scan', ru: '3D-скан лица', uz: 'Yuzning 3D skaneri' },
      text: {
        en: 'A 3D model of the face from a depth camera or a smartphone, aligned with CBCT: soft tissues and bone in one scene.',
        ru: '3D-модель лица с глубинной камеры или смартфона, совмещённая с КЛКТ: мягкие ткани и кость в одной сцене.',
        uz: 'Chuqurlik kamerasi yoki smartfon orqali olingan, KLKT bilan birlashtirilgan yuzning 3D modeli: yumshoq toʻqimalar va suyak bitta sahnada.',
      },
    },
  ],
  surgNote: {
    en: 'A simulation is a planning and consultation tool, not a guarantee of the result; the final decision is made by the surgeon.',
    ru: 'Симуляция — инструмент планирования и консультации, а не гарантия результата; окончательное решение принимает хирург.',
    uz: 'Simulyatsiya — rejalashtirish va maslahat vositasi, natija kafolati emas; yakuniy qarorni jarroh qabul qiladi.',
  },
  surgDemo: { en: 'Open the CBCT segmentation demo', ru: 'Открыть демо сегментации КЛКТ', uz: 'KLKT segmentatsiyasi demosini ochish' },
  whatTitle: { en: 'What we do', ru: 'Что мы делаем', uz: 'Nima qilamiz' },
  what: [
    {
      title: { en: '3D anatomy', ru: '3D-анатомия', uz: '3D anatomiya' },
      text: {
        en: 'Interactive 3D models of the knee, foot and ankle based on the BodyParts3D anatomical atlas: every muscle, bone and tendon can be rotated, isolated and studied.',
        ru: 'Интерактивные 3D-модели колена, стопы и голеностопа на основе анатомического атласа BodyParts3D: каждую мышцу, кость и сухожилие можно повернуть, выделить и изучить.',
        uz: 'BodyParts3D anatomik atlasi asosida tizza, oyoq panjasi va toʻpiqning interaktiv 3D modellari: har bir mushak, suyak va payni aylantirish, ajratish va oʻrganish mumkin.',
      },
    },
    {
      title: { en: 'Simulations', ru: 'Симуляции', uz: 'Simulyatsiyalar' },
      text: {
        en: 'Step-by-step clinical-reasoning simulations, virtual patients and 3D exercise demonstrations for students, specialists and patients.',
        ru: 'Пошаговые симуляции клинического мышления, виртуальные пациенты и 3D-демонстрации упражнений для студентов, специалистов и пациентов.',
        uz: 'Talabalar, mutaxassislar va bemorlar uchun klinik fikrlashning bosqichma-bosqich simulyatsiyalari, virtual bemorlar va mashqlarning 3D namoyishlari.',
      },
    },
    {
      title: { en: 'AI agents', ru: 'ИИ-агенты', uz: 'AI agentlar' },
      text: {
        en: 'Agents that guide patients and students through learning content, draft home-exercise programmes for specialist review and package an expert’s personal brand.',
        ru: 'Агенты, которые ведут пациентов и студентов по учебному контенту, готовят черновик домашней программы упражнений для проверки специалистом и упаковывают личный бренд эксперта.',
        uz: 'Bemor va talabalarni oʻquv kontenti boʻyicha yoʻnaltiradigan, mutaxassis tekshiruvi uchun uy mashqlari dasturi loyihasini tayyorlaydigan va ekspertning shaxsiy brendini shakllantiradigan agentlar.',
      },
    },
    {
      title: { en: '3D scan and motion analysis', ru: '3D-скан и анализ движения', uz: '3D skaner va harakat tahlili' },
      text: {
        en: 'Depth camera and LiDAR to measure joint angles and track progress. In development — we are looking for pilot clinics.',
        ru: 'Глубинная камера и LiDAR для измерения углов в суставах и отслеживания прогресса. В разработке — ищем клиники для пилота.',
        uz: 'Boʻgʻim burchaklarini oʻlchash va natijani kuzatish uchun chuqurlik kamerasi va LiDAR. Ishlab chiqilmoqda — pilot uchun klinikalarni izlayapmiz.',
      },
      soon: true,
    },
  ],

  anatomyTitle: { en: 'Demo 1 · 3D anatomy', ru: 'Демо 1 · 3D-анатомия', uz: '1-demo · 3D anatomiya' },
  anatomyHint: { en: 'Click a muscle, bone or tendon on the model or in the list. Drag to rotate.', ru: 'Нажмите на мышцу, кость или сухожилие на модели или в списке. Крутите мышкой или пальцем.', uz: 'Modelda yoki roʻyxatda mushak, suyak yoki payni bosing. Aylantirish uchun suring.' },
  knee: { en: 'Knee', ru: 'Колено', uz: 'Tizza' },
  foot: { en: 'Foot and ankle', ru: 'Стопа и голеностоп', uz: 'Oyoq panjasi va toʻpiq' },
  pick: { en: 'Select a structure', ru: 'Выберите структуру', uz: 'Tuzilmani tanlang' },
  groups: { bone: { en: 'Bone', ru: 'Кость', uz: 'Suyak' }, muscle: { en: 'Muscle', ru: 'Мышца', uz: 'Mushak' }, ligament: { en: 'Tendon / ligament', ru: 'Сухожилие / связка', uz: 'Pay / boylam' }, fascia: { en: 'Fascia', ru: 'Фасция', uz: 'Fassiya' } } as Record<string, T>,
  loading: { en: 'Loading the 3D model', ru: 'Загружаем 3D-модель', uz: '3D model yuklanmoqda' },
  loadError: { en: 'The 3D model could not be loaded on this device.', ru: 'Не удалось загрузить 3D-модель на этом устройстве.', uz: 'Bu qurilmada 3D modelni yuklab boʻlmadi.' },

  simTitle: { en: 'Demo 2 · Movement simulation', ru: 'Демо 2 · Симуляция движения', uz: '2-demo · Harakat simulyatsiyasi' },
  simHint: { en: 'A 3D figure performs rehabilitation exercises; the working muscles are highlighted. Pause, slow down, look from the side.', ru: '3D-фигура выполняет реабилитационные упражнения, работающие мышцы подсвечены. Пауза, замедление, вид сбоку.', uz: '3D figura reabilitatsiya mashqlarini bajaradi, ishlayotgan mushaklar ajratib koʻrsatilgan. Pauza, sekinlashtirish, yondan koʻrinish.' },

  agentsTitle: { en: 'Demo 3 · AI agents', ru: 'Демо 3 · ИИ-агенты', uz: '3-demo · AI agentlar' },
  agentsHint: {
    en: 'Choose a request and watch how the rehabilitation-navigator agent works. This is a demonstration on prepared scenarios, not a diagnosis: in the product the programme is always reviewed by a specialist.',
    ru: 'Выберите запрос и посмотрите, как работает агент-навигатор по реабилитации. Это демонстрация на подготовленных сценариях, а не диагноз: в продукте программу всегда проверяет специалист.',
    uz: 'Soʻrovni tanlang va reabilitatsiya navigator-agenti qanday ishlashini koʻring. Bu tayyorlangan ssenariylar asosidagi namoyish, tashxis emas: mahsulotda dasturni har doim mutaxassis tekshiradi.',
  },
  agentSteps: [
    { en: 'Understanding the request', ru: 'Понимает запрос', uz: 'Soʻrovni tushunmoqda' },
    { en: 'Finding the anatomy in 3D', ru: 'Находит анатомию в 3D', uz: '3D anatomiyani topmoqda' },
    { en: 'Selecting exercises', ru: 'Подбирает упражнения', uz: 'Mashqlarni tanlamoqda' },
    { en: 'Preparing a plan for specialist review', ru: 'Готовит план для проверки специалистом', uz: 'Mutaxassis tekshiruvi uchun reja tayyorlamoqda' },
  ],
  agentAnatomy: { en: 'Anatomy', ru: 'Анатомия', uz: 'Anatomiya' },
  agentExercises: { en: 'Exercises', ru: 'Упражнения', uz: 'Mashqlar' },
  agentPlan: { en: 'Plan', ru: 'План', uz: 'Reja' },
  showIn3d: { en: 'Show in 3D', ru: 'Показать в 3D', uz: '3D da koʻrsatish' },
  showSim: { en: 'Show the exercise', ru: 'Показать упражнение', uz: 'Mashqni koʻrsatish' },
  openBrand: { en: 'Open the brand agent demo', ru: 'Открыть демо агента бренда', uz: 'Brend agenti demosini ochish' },
  wantAgent: { en: 'Want an agent like this for your clinic?', ru: 'Хотите такого агента для своей клиники?', uz: 'Klinikangiz uchun shunday agent kerakmi?' },

  recTitle: { en: 'Recognition', ru: 'Признание', uz: 'Eʼtirof' },
  rec: [
    { en: 'Exhibitor at KIMES — Korea International Medical & Hospital Equipment Show, Seoul', ru: 'Участник выставки KIMES — Korea International Medical & Hospital Equipment Show, Сеул', uz: 'KIMES — Korea International Medical & Hospital Equipment Show koʻrgazmasi ishtirokchisi, Seul' },
    { en: 'Life Sciences acceleration programme', ru: 'Программа акселерации Life Sciences', uz: 'Life Sciences akseleratsiya dasturi' },
    { en: 'Memorandum with Asfendiyarov Kazakh National Medical University (KazNMU)', ru: 'Меморандум с Казахским национальным медицинским университетом им. С. Д. Асфендиярова (КазНМУ)', uz: 'S. D. Asfendiyarov nomidagi Qozogʻiston milliy tibbiyot universiteti (QazMTU) bilan memorandum' },
  ],

  partnersTitle: { en: 'Who we work with', ru: 'С кем работаем', uz: 'Kimlar bilan ishlaymiz' },
  partners: [
    { title: { en: 'Clinics and rehabilitation centres', ru: 'Клиники и реабилитационные центры', uz: 'Klinikalar va reabilitatsiya markazlari' }, text: { en: 'Patient education, home programmes in 3D, AI navigator on your website, your doctors’ personal brands.', ru: 'Обучение пациентов, домашние программы в 3D, ИИ-навигатор на вашем сайте, личные бренды ваших врачей.', uz: 'Bemorlarni oʻqitish, 3D uy dasturlari, saytingizda AI navigator, shifokorlaringizning shaxsiy brendlari.' } },
    { title: { en: 'Universities and colleges', ru: 'Университеты и колледжи', uz: 'Universitetlar va kollejlar' }, text: { en: '3D anatomy lab, simulations and virtual patients for students; group licences and analytics.', ru: '3D-лаборатория анатомии, симуляции и виртуальные пациенты для студентов; групповые лицензии и аналитика.', uz: 'Talabalar uchun 3D anatomiya laboratoriyasi, simulyatsiyalar va virtual bemorlar; guruh litsenziyalari va tahlil.' } },
    { title: { en: 'Investors and distributors', ru: 'Инвесторы и дистрибьюторы', uz: 'Investorlar va distribyutorlar' }, text: { en: 'Expansion across Kazakhstan, Uzbekistan and Central Asia: pilots, localisation, partnerships.', ru: 'Рост в Казахстане, Узбекистане и Центральной Азии: пилоты, локализация, партнёрства.', uz: 'Qozogʻiston, Oʻzbekiston va Markaziy Osiyoda oʻsish: pilotlar, lokalizatsiya, hamkorlik.' } },
  ],

  formTitle: { en: 'Let’s talk', ru: 'Давайте обсудим', uz: 'Keling, muhokama qilamiz' },
  formSub: { en: 'Leave your contact — we will send materials and arrange a call after the forum.', ru: 'Оставьте контакт — пришлём материалы и договоримся о звонке после форума.', uz: 'Kontaktingizni qoldiring — forumdan keyin materiallarni yuboramiz va qoʻngʻiroqni kelishamiz.' },
  f: {
    name: { en: 'Name', ru: 'Имя', uz: 'Ism' },
    contact: { en: 'Email or phone / WhatsApp', ru: 'Email или телефон / WhatsApp', uz: 'Email yoki telefon / WhatsApp' },
    org: { en: 'Organisation', ru: 'Организация', uz: 'Tashkilot' },
    role: { en: 'Position', ru: 'Должность', uz: 'Lavozim' },
    country: { en: 'Country, city', ru: 'Страна, город', uz: 'Mamlakat, shahar' },
    interest: { en: 'What are you interested in?', ru: 'Что вам интересно?', uz: 'Sizni nima qiziqtiradi?' },
    message: { en: 'Message', ru: 'Сообщение', uz: 'Xabar' },
    consent: { en: 'I agree that FAB3D AI may contact me and process these data for that purpose', ru: 'Согласен(на), что FAB3D AI свяжется со мной и обработает эти данные для этой цели', uz: 'FAB3D AI men bilan bogʻlanishi va shu maqsadda maʼlumotlarni qayta ishlashiga roziman' },
    submit: { en: 'Send', ru: 'Отправить', uz: 'Yuborish' },
    required: { en: 'Please fill in your name and contact and confirm consent.', ru: 'Заполните имя и контакт и подтвердите согласие.', uz: 'Ism va kontaktni kiriting hamda roziligingizni tasdiqlang.' },
    sentTitle: { en: 'Thank you! We will be in touch.', ru: 'Спасибо! Мы свяжемся с вами.', uz: 'Rahmat! Siz bilan bogʻlanamiz.' },
    sentText: { en: 'Want to talk sooner? Message us on WhatsApp or Telegram.', ru: 'Хотите быстрее? Напишите нам в WhatsApp или Telegram.', uz: 'Tezroq gaplashmoqchimisiz? WhatsApp yoki Telegram orqali yozing.' },
    error: { en: 'The form could not be sent. Send the same message on WhatsApp in one tap:', ru: 'Форма не отправилась. Отправьте то же сообщение в WhatsApp одной кнопкой:', uz: 'Shakl yuborilmadi. Xuddi shu xabarni WhatsApp orqali bir tugma bilan yuboring:' },
  },
  interests: [
    { id: 'pilot', en: 'Pilot in a clinic', ru: 'Пилот в клинике', uz: 'Klinikada pilot' },
    { id: 'university', en: 'University licence', ru: 'Лицензия для университета', uz: 'Universitet litsenziyasi' },
    { id: 'agent', en: 'AI agent for my organisation', ru: 'ИИ-агент для моей организации', uz: 'Tashkilotim uchun AI agent' },
    { id: 'surgery', en: 'Before / after simulation for surgery', ru: 'Симуляции «до / после» для хирургии', uz: 'Jarrohlik uchun «oldin / keyin» simulyatsiyasi' },
    { id: 'scan', en: '3D scan / motion analysis', ru: '3D-скан / анализ движения', uz: '3D skaner / harakat tahlili' },
    { id: 'partner', en: 'Partnership or distribution', ru: 'Партнёрство или дистрибуция', uz: 'Hamkorlik yoki distribyutsiya' },
    { id: 'invest', en: 'Investment', ru: 'Инвестиции', uz: 'Investitsiya' },
  ],
  footer: {
    edu: { en: 'Educational materials are not medical advice and do not replace an examination by a doctor.', ru: 'Учебные материалы не являются медицинской консультацией и не заменяют осмотр врача.', uz: 'Oʻquv materiallari tibbiy maslahat emas va shifokor koʻrigini almashtirmaydi.' },
    privacy: { en: 'Privacy policy', ru: 'Политика конфиденциальности', uz: 'Maxfiylik siyosati' },
  },
} as const;

export interface Scenario {
  id: string;
  ask: T;
  region: T;
  model?: 'knee' | 'foot';
  structures: string[];
  exercises: string[];
  plan: T;
  brand?: boolean;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'knee', model: 'knee', structures: ['patella', 'rectus_femoris', 'vastus_medialis', 'iliotibial_tract'], exercises: ['chair-squat', 'step-down', 'glute-bridge', 'side-plank'],
    ask: { en: 'Runner, 38: pain at the front of the knee on downhill runs', ru: 'Бегун, 38 лет: боль спереди колена на спусках', uz: 'Yuguruvchi, 38 yosh: pastga yugurganda tizzaning old qismida ogʻriq' },
    region: { en: 'Knee: patellofemoral load', ru: 'Колено: нагрузка на надколенник', uz: 'Tizza: tizza qopqogʻiga yuklama' },
    plan: { en: '4 weeks, 3 sessions a week: thigh and hip strength, gradual return to downhills. Reviewed by a rehabilitation specialist; red flags — see a doctor.', ru: '4 недели, 3 занятия в неделю: сила бедра и ягодиц, постепенное возвращение спусков. Проверяет реабилитолог; при «красных флагах» — к врачу.', uz: '4 hafta, haftasiga 3 mashgʻulot: son va dumba kuchi, pastga yugurishga bosqichma-bosqich qaytish. Reabilitolog tekshiradi; xavfli belgilar boʻlsa — shifokorga.' },
  },
  {
    id: 'achilles', model: 'foot', structures: ['calcaneal_tendon', 'soleus', 'calcaneus'], exercises: ['calf-raise', 'bent-knee-calf-raise', 'heel-drop'],
    ask: { en: 'Marathoner, 45: morning stiffness in the Achilles', ru: 'Марафонец, 45 лет: утренняя скованность в ахилле', uz: 'Marafonchi, 45 yosh: ertalab axill payida qotishlik' },
    region: { en: 'Lower leg: Achilles tendon and calf', ru: 'Голень: ахиллово сухожилие и икры', uz: 'Boldir: axill payi va boldir mushaklari' },
    plan: { en: 'Progressive calf loading 3 times a week, pain monitoring (up to 5/10, settles by the next morning). Reviewed by a rehabilitation specialist.', ru: 'Прогрессивная нагрузка икр 3 раза в неделю, контроль боли (до 5 из 10, проходит к утру). Проверяет реабилитолог.', uz: 'Haftasiga 3 marta boldirga bosqichma-bosqich yuklama, ogʻriq nazorati (10 dan 5 gacha, ertalabgacha oʻtadi). Reabilitolog tekshiradi.' },
  },
  {
    id: 'shoulder', structures: [], exercises: ['band-external-rotation', 'prone-y-t'],
    ask: { en: 'Triathlete, 29: shoulder pain after long swims', ru: 'Триатлонист, 29 лет: боль в плече после длинных заплывов', uz: 'Triatlonchi, 29 yosh: uzoq suzishdan keyin yelkada ogʻriq' },
    region: { en: 'Shoulder: rotator cuff, swim volume', ru: 'Плечо: вращательная манжета, объём плавания', uz: 'Yelka: rotator manjeti, suzish hajmi' },
    plan: { en: 'Reduce swim volume and paddles, rotator-cuff and shoulder-blade exercises 2–3 times a week. Reviewed by a rehabilitation specialist.', ru: 'Снизить объём плавания и работу с лопатками, упражнения для манжеты и лопатки 2–3 раза в неделю. Проверяет реабилитолог.', uz: 'Suzish hajmini va kurakchalar bilan ishlashni kamaytirish, haftasiga 2–3 marta manjet va kurak mashqlari. Reabilitolog tekshiradi.' },
  },
  {
    id: 'brand', brand: true, structures: [], exercises: [],
    ask: { en: 'Sports doctor wants to grow a personal brand', ru: 'Спортивный врач хочет развить личный бренд', uz: 'Sport shifokori shaxsiy brendini rivojlantirmoqchi' },
    region: { en: 'AI brand producer: positioning, offer, content plan, KPI', ru: 'ИИ-продюсер бренда: позиционирование, оффер, контент-план, KPI', uz: 'AI brend prodyuseri: pozitsiyalash, taklif, kontent-reja, KPI' },
    plan: { en: '9-step unpacking based on Gallup, Harvard Business Review and kaizen; the report is ready in about 40 minutes.', ru: 'Распаковка в 9 шагов по подходам Gallup, Harvard Business Review и кайдзен; отчёт готов примерно за 40 минут.', uz: 'Gallup, Harvard Business Review va kaizen yondashuvlari asosida 9 bosqichli tahlil; hisobot taxminan 40 daqiqada tayyor.' },
  },
];

/** Exercise names on the forum page (the library has Russian and Kazakh only). */
export const EXERCISE_NAMES: Record<string, T> = {
  'chair-squat': { en: 'Chair squat', ru: 'Присед к стулу', uz: 'Stulga oʻtirish' },
  'step-down': { en: 'Step-down', ru: 'Шаг вниз с платформы', uz: 'Platformadan pastga qadam' },
  'glute-bridge': { en: 'Glute bridge', ru: 'Ягодичный мост', uz: 'Dumba koʻprigi' },
  'side-plank': { en: 'Side plank', ru: 'Боковая планка', uz: 'Yon planka' },
  'calf-raise': { en: 'Calf raise', ru: 'Подъём на носки', uz: 'Oyoq uchiga koʻtarilish' },
  'bent-knee-calf-raise': { en: 'Bent-knee calf raise', ru: 'Подъём на носки с согнутыми коленями', uz: 'Bukilgan tizza bilan oyoq uchiga koʻtarilish' },
  'heel-drop': { en: 'Eccentric heel drop', ru: 'Медленное опускание пяток', uz: 'Tovonni sekin tushirish' },
  'band-external-rotation': { en: 'Band external rotation', ru: 'Наружная ротация с резиной', uz: 'Rezina bilan tashqi aylantirish' },
  'prone-y-t': { en: 'Prone Y and T', ru: '«Y» и «T» лёжа', uz: 'Qorin bilan yotib Y va T' },
};
export const SIM_EXERCISES = ['chair-squat', 'glute-bridge', 'side-plank', 'calf-raise', 'step-down', 'prone-y-t'];
export const ANATOMY_PICKS: Record<'knee' | 'foot', string[]> = {
  knee: ['patella', 'femur', 'tibia', 'rectus_femoris', 'vastus_medialis', 'vastus_lateralis', 'iliotibial_tract', 'biceps_femoris_long', 'gastrocnemius_medial'],
  foot: ['calcaneal_tendon', 'calcaneus', 'talus', 'soleus', 'tibialis_anterior', 'tibialis_posterior', 'fibularis_longus', 'abductor_hallucis', 'metatarsals'],
};
