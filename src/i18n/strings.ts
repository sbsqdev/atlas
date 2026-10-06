import type { Lang } from '../types';

type Tri = { ru: string; en: string; tr: string };

/** UI label dictionary (RU / EN / TR). */
const dict = {
  appName: { ru: 'Human Atlas', en: 'Human Atlas', tr: 'Human Atlas' },
  tagline: {
    ru: 'Курсы тренеров и 3D-карта мышц',
    en: 'Coach-led courses and a 3D muscle map',
    tr: 'Antrenör kursları ve 3D kas haritası',
  },

  // auth
  signIn: { ru: 'Вход', en: 'Sign in', tr: 'Giriş' },
  signUp: { ru: 'Регистрация', en: 'Sign up', tr: 'Kayıt ol' },
  logout: { ru: 'Выйти', en: 'Log out', tr: 'Çıkış' },
  name: { ru: 'Имя', en: 'Name', tr: 'İsim' },
  username: { ru: 'Имя пользователя (логин)', en: 'Username (login)', tr: 'Kullanıcı adı' },
  loginField: { ru: 'Логин или e-mail', en: 'Login or email', tr: 'Giriş veya e-posta' },
  emailOptional: { ru: 'E-mail (необязательно)', en: 'Email (optional)', tr: 'E-posta (isteğe bağlı)' },
  email: { ru: 'E-mail', en: 'Email', tr: 'E-posta' },
  consentText: {
    ru: 'Я принимаю Публичную оферту и даю согласие на сбор и обработку персональных данных',
    en: 'I accept the Public offer and consent to the processing of my personal data',
    tr: 'Kamu teklifini kabul ediyorum ve kişisel verilerimin işlenmesine onay veriyorum',
  },
  consentRequired: {
    ru: 'Чтобы продолжить, примите оферту и дайте согласие на обработку данных.',
    en: 'To continue, accept the offer and consent to data processing.',
    tr: 'Devam etmek için teklifi kabul edin ve veri işlemeye onay verin.',
  },
  usernameTaken: { ru: 'Это имя пользователя занято.', en: 'This username is taken.', tr: 'Bu kullanıcı adı alınmış.' },
  dataNote: {
    ru: 'Мы храним только ваш логин и прогресс обучения.',
    en: 'We store only your username and your learning progress.',
    tr: 'Yalnızca kullanıcı adınızı ve ilerlemenizi saklarız.',
  },
  offerDoc: { ru: 'Публичная оферта', en: 'Public offer', tr: 'Kamu teklifi' },
  privacyDoc: { ru: 'Политика конфиденциальности', en: 'Privacy policy', tr: 'Gizlilik politikası' },
  contactsDoc: { ru: 'Контакты', en: 'Contacts', tr: 'İletişim' },
  password: { ru: 'Пароль', en: 'Password', tr: 'Şifre' },
  role: { ru: 'Роль', en: 'Role', tr: 'Rol' },
  student: { ru: 'Ученик', en: 'Student', tr: 'Öğrenci' },
  trainer: { ru: 'Тренер', en: 'Coach', tr: 'Antrenör' },
  createAccount: { ru: 'Создать аккаунт', en: 'Create account', tr: 'Hesap oluştur' },
  haveAccount: { ru: 'Уже есть аккаунт? Войти', en: 'Already have an account? Sign in', tr: 'Zaten hesabın var mı? Giriş yap' },
  noAccount: { ru: 'Нет аккаунта? Регистрация', en: "No account? Sign up", tr: 'Hesabın yok mu? Kayıt ol' },
  inviteCode: { ru: 'Код приглашения', en: 'Invite code', tr: 'Davet kodu' },
  inviteCodeHint: {
    ru: 'Код выдаёт ваш тренер. Без него курс не откроется.',
    en: 'Your coach gives you this code. You need it to open the course.',
    tr: 'Bu kodu antrenörünüz verir. Kursu açmak için gereklidir.',
  },
  joinByCode: { ru: 'Присоединиться по коду', en: 'Join with a code', tr: 'Kodla katıl' },
  join: { ru: 'Присоединиться', en: 'Join', tr: 'Katıl' },
  codeInvalid: { ru: 'Код не найден. Проверьте и попробуйте снова.', en: 'Code not found. Check it and try again.', tr: 'Kod bulunamadı. Kontrol edip tekrar deneyin.' },
  alreadyEnrolled: { ru: 'Вы уже записаны на этот курс.', en: 'You are already enrolled in this course.', tr: 'Bu kursa zaten kayıtlısınız.' },
  enrolledOk: { ru: 'Готово! Курс добавлен.', en: 'Done! Course added.', tr: 'Tamam! Kurs eklendi.' },
  emailTaken: { ru: 'Этот e-mail уже зарегистрирован.', en: 'This email is already registered.', tr: 'Bu e-posta zaten kayıtlı.' },
  wrongCredentials: { ru: 'Неверный e-mail или пароль.', en: 'Wrong email or password.', tr: 'Hatalı e-posta veya şifre.' },
  fillFields: { ru: 'Заполните все поля.', en: 'Please fill in all fields.', tr: 'Lütfen tüm alanları doldurun.' },
  demoHint: {
    ru: 'Демо: аккаунты хранятся локально в браузере. Это не настоящая защита.',
    en: 'Demo: accounts are stored locally in your browser. Not real security.',
    tr: 'Demo: hesaplar tarayıcınızda yerel olarak saklanır. Gerçek güvenlik değildir.',
  },
  demoCoach: { ru: 'Демо-тренер', en: 'Demo coach', tr: 'Demo antrenör' },
  demoStudent: { ru: 'Демо-ученик', en: 'Demo student', tr: 'Demo öğrenci' },

  // nav
  dashboard: { ru: 'Кабинет тренера', en: 'Coach dashboard', tr: 'Antrenör paneli' },
  myCourses: { ru: 'Мои курсы', en: 'My courses', tr: 'Kurslarım' },
  calculators: { ru: 'Калькуляторы', en: 'Calculators', tr: 'Hesaplayıcılar' },

  // catalogue / course
  level: { ru: 'Уровень', en: 'Level', tr: 'Seviye' },
  workouts: { ru: 'тренировок', en: 'workouts', tr: 'antrenman' },
  openCourse: { ru: 'Открыть курс', en: 'Open course', tr: 'Kursu aç' },
  workout: { ru: 'Тренировка', en: 'Workout', tr: 'Antrenman' },
  workoutsTitle: { ru: 'Тренировки', en: 'Workouts', tr: 'Antrenmanlar' },
  exercises: { ru: 'упражнений', en: 'exercises', tr: 'egzersiz' },
  by: { ru: 'Тренер', en: 'Coach', tr: 'Antrenör' },

  // student home / progress
  noEnrollments: {
    ru: 'У вас пока нет курсов. Введите код от тренера, чтобы открыть курс.',
    en: 'You have no courses yet. Enter the code from your coach to open a course.',
    tr: 'Henüz kursunuz yok. Kursu açmak için antrenörünüzün kodunu girin.',
  },
  progress: { ru: 'Прогресс', en: 'Progress', tr: 'İlerleme' },
  completed: { ru: 'выполнено', en: 'completed', tr: 'tamamlandı' },
  markDone: { ru: 'Отметить выполненной', en: 'Mark done', tr: 'Tamamlandı işaretle' },
  markUndone: { ru: 'Снять отметку', en: 'Mark not done', tr: 'İşareti kaldır' },
  done: { ru: 'Выполнено', en: 'Done', tr: 'Tamam' },

  // exercise / muscle
  primaryMuscles: { ru: 'Основные мышцы', en: 'Primary muscles', tr: 'Birincil kaslar' },
  secondaryMuscles: { ru: 'Вспомогательные мышцы', en: 'Synergists / stabilisers', tr: 'Yardımcı kaslar' },
  prescription: { ru: 'Подходы и повторы', en: 'Sets & reps', tr: 'Set ve tekrar' },
  coachNote: { ru: 'Заметка тренера', en: 'Coach note', tr: 'Antrenör notu' },
  watchVideo: { ru: 'Смотреть видео', en: 'Watch video', tr: 'Videoyu izle' },
  description: { ru: 'Описание', en: 'Description', tr: 'Açıklama' },
  workoutMuscleMap: { ru: 'Карта мышц всей тренировки', en: 'Muscle map for the whole workout', tr: 'Tüm antrenmanın kas haritası' },

  // editor
  newCourse: { ru: 'Новый курс', en: 'New course', tr: 'Yeni kurs' },
  editCourse: { ru: 'Редактировать курс', en: 'Edit course', tr: 'Kursu düzenle' },
  addWorkout: { ru: 'Добавить тренировку', en: 'Add workout', tr: 'Antrenman ekle' },
  addExercise: { ru: 'Добавить упражнение', en: 'Add exercise', tr: 'Egzersiz ekle' },
  save: { ru: 'Сохранить', en: 'Save', tr: 'Kaydet' },
  cancel: { ru: 'Отмена', en: 'Cancel', tr: 'İptal' },
  delete: { ru: 'Удалить', en: 'Delete', tr: 'Sil' },
  edit: { ru: 'Изменить', en: 'Edit', tr: 'Düzenle' },
  title: { ru: 'Название', en: 'Title', tr: 'Başlık' },
  summary: { ru: 'Краткое описание', en: 'Summary', tr: 'Özet' },
  fieldRu: { ru: 'по-русски', en: 'in Russian', tr: 'Rusça' },
  fieldEn: { ru: 'по-английски', en: 'in English', tr: 'İngilizce' },
  targetMuscles: { ru: 'Целевые мышцы (нажмите, чтобы выбрать)', en: 'Target muscles (tap to toggle)', tr: 'Hedef kaslar (seçmek için dokunun)' },
  muscleNoteLabel: { ru: 'Какие мышцы работают — своими словами (любой язык)', en: 'Which muscles work — in your own words (any language)', tr: 'Hangi kaslar çalışır — kendi kelimelerinizle (her dil)' },
  autoDetect: { ru: '✨ Авто-определить мышцы', en: '✨ Auto-detect muscles', tr: '✨ Kasları otomatik algıla' },
  detecting: { ru: 'Определяю…', en: 'Detecting…', tr: 'Algılanıyor…' },
  byAI: { ru: 'определено ИИ (DeepSeek)', en: 'detected by AI (DeepSeek)', tr: 'yapay zeka ile algılandı (DeepSeek)' },
  byKeywords: { ru: 'определено по ключевым словам', en: 'detected by keywords', tr: 'anahtar kelimelerle algılandı' },
  noneDetected: { ru: 'Не удалось определить — выберите вручную.', en: 'Nothing detected — pick manually.', tr: 'Algılanamadı — elle seçin.' },
  searchStructures: { ru: 'Поиск структур по названию (напр. gluteus, soleus)', en: 'Search structures by name (e.g. gluteus, soleus)', tr: 'Yapıları ada göre ara (ör. gluteus, soleus)' },
  namedStructures: { ru: 'Выбранные структуры (по названию)', en: 'Selected structures (by name)', tr: 'Seçili yapılar (ada göre)' },
  markPrimary: { ru: 'осн.', en: 'primary', tr: 'birincil' },
  videoUrl: { ru: 'Ссылка на видео', en: 'Video URL', tr: 'Video bağlantısı' },
  noCoursesYet: { ru: 'У вас пока нет курсов. Создайте первый!', en: 'You have no courses yet. Create your first one!', tr: 'Henüz kursunuz yok. İlkini oluşturun!' },
  emptyWorkout: { ru: 'В этой тренировке пока нет упражнений.', en: 'No exercises in this workout yet.', tr: 'Bu antrenmanda henüz egzersiz yok.' },
  resetDemo: { ru: 'Сбросить демо-данные', en: 'Reset demo data', tr: 'Demo verisini sıfırla' },
  confirmReset: { ru: 'Сбросить все локальные данные к начальным?', en: 'Reset all local data to the seed?', tr: 'Tüm yerel verileri başlangıç durumuna sıfırla?' },

  // coach branding / invite
  inviteCodeLabel: { ru: 'Код приглашения', en: 'Invite code', tr: 'Davet kodu' },
  copyCode: { ru: 'Копировать', en: 'Copy', tr: 'Kopyala' },
  copied: { ru: 'Скопировано', en: 'Copied', tr: 'Kopyalandı' },
  shareCodeHint: {
    ru: 'Поделитесь этим кодом с учениками — по нему они откроют курс.',
    en: 'Share this code with your students — they use it to open the course.',
    tr: 'Bu kodu öğrencilerinizle paylaşın — kursu açmak için kullanırlar.',
  },
  regenCode: { ru: 'Новый код', en: 'New code', tr: 'Yeni kod' },
  brandName: { ru: 'Название бренда', en: 'Brand name', tr: 'Marka adı' },
  brandColor: { ru: 'Цвет бренда', en: 'Brand color', tr: 'Marka rengi' },
  coachProfile: { ru: 'Профиль тренера', en: 'Coach profile', tr: 'Antrenör profili' },
  bioLabel: { ru: 'О себе (био)', en: 'About you (bio)', tr: 'Hakkınızda (bio)' },
  saveProfile: { ru: 'Сохранить профиль', en: 'Save profile', tr: 'Profili kaydet' },

  // access by email
  accessByEmail: { ru: 'Доступ по e-mail', en: 'Access by email', tr: 'E-posta ile erişim' },
  accessByEmailHint: {
    ru: 'Выдайте доступ ученику по e-mail (например, после покупки). Курс откроется автоматически, когда он войдёт.',
    en: 'Grant a student access by email (e.g. after purchase). The course unlocks automatically when they log in.',
    tr: 'Öğrenciye e-posta ile erişim verin (ör. satın alma sonrası). Giriş yaptığında kurs otomatik açılır.',
  },
  studentEmail: { ru: 'E-mail ученика', en: 'Student email', tr: 'Öğrenci e-postası' },
  grant: { ru: 'Выдать доступ', en: 'Grant access', tr: 'Erişim ver' },
  grantedStudents: { ru: 'Ученики с доступом', en: 'Students with access', tr: 'Erişimi olan öğrenciler' },
  noGranted: { ru: 'Пока никому не выдан доступ.', en: 'No access granted yet.', tr: 'Henüz erişim verilmedi.' },
  accessActive: { ru: 'активен', en: 'active', tr: 'aktif' },
  accessPending: { ru: 'ещё не зарегистрирован', en: 'not registered yet', tr: 'henüz kayıtlı değil' },
  revoke: { ru: 'Отозвать', en: 'Revoke', tr: 'Kaldır' },
  studentsProgress: { ru: 'Ученики и прогресс', en: 'Students & progress', tr: 'Öğrenciler ve ilerleme' },
  noStudents: { ru: 'Пока нет учеников, открывших курс.', en: 'No students have opened the course yet.', tr: 'Henüz kursu açan öğrenci yok.' },
  watchedLabel: { ru: 'просмотрено', en: 'watched', tr: 'izlendi' },
  videosWord: { ru: 'видео', en: 'videos', tr: 'video' },
  crossDeviceNote: {
    ru: 'Прогресс хранится в браузере ученика (демо). Для синхронизации между устройствами нужен бэкенд.',
    en: 'Progress is stored in the student\'s browser (demo). Cross-device sync needs a backend.',
    tr: 'İlerleme öğrencinin tarayıcısında saklanır (demo). Cihazlar arası senkron için backend gerekir.',
  },

  // discussion (telegram-style)
  discussion: { ru: 'Обсуждение', en: 'Discussion', tr: 'Tartışma' },
  writeMessage: { ru: 'Написать сообщение…', en: 'Write a message…', tr: 'Mesaj yaz…' },
  send: { ru: 'Отправить', en: 'Send', tr: 'Gönder' },
  reply: { ru: 'Ответить', en: 'Reply', tr: 'Yanıtla' },
  noComments: { ru: 'Пока нет сообщений. Начните обсуждение!', en: 'No messages yet — start the discussion!', tr: 'Henüz mesaj yok — tartışmayı başlatın!' },
  justNow: { ru: 'только что', en: 'now', tr: 'şimdi' },

  // gamification
  achievements: { ru: 'Достижения', en: 'Achievements', tr: 'Başarılar' },
  streak: { ru: 'Серия', en: 'Streak', tr: 'Seri' },
  days: { ru: 'дн.', en: 'days', tr: 'gün' },
  xpToNext: { ru: 'XP до следующего уровня', en: 'XP to next level', tr: 'Sonraki seviyeye XP' },
  dontBreakChain: { ru: 'Не разрывай цепочку', en: "Don't break the chain", tr: 'Zinciri kırma' },
  rewards: { ru: 'Награды', en: 'Rewards', tr: 'Ödüller' },
  workoutsDone: { ru: 'тренировок выполнено', en: 'workouts done', tr: 'antrenman tamam' },
  videosWatched: { ru: 'видео просмотрено', en: 'videos watched', tr: 'video izlendi' },
  identityLine: {
    ru: 'Каждая тренировка — голос за того, кем ты становишься. 1% лучше каждый день.',
    en: 'Every workout is a vote for who you are becoming. 1% better every day.',
    tr: 'Her antrenman, olmak istediğin kişiye verilen bir oydur. Her gün %1 daha iyi.',
  },

  // video
  videoDrive: { ru: 'Видео', en: 'Video', tr: 'Video' },
  openInDrive: { ru: 'Открыть в Google Drive', en: 'Open in Google Drive', tr: "Google Drive'da aç" },
  videoShareHint: {
    ru: 'Видео открывается прямо здесь для учеников с доступом (через Google Drive).',
    en: 'The video plays here for students with access (via Google Drive).',
    tr: 'Video, erişimi olan öğrenciler için burada oynatılır (Google Drive üzerinden).',
  },

  // calculators
  macroCalc: { ru: 'КБЖУ (калории и макросы)', en: 'Calories & macros (TDEE)', tr: 'Kalori ve makrolar' },
  macroDesc: {
    ru: 'Оценка суточной нормы калорий и БЖУ по формуле Миффлина–Сан Жеора.',
    en: 'Estimate daily calories and macros with the Mifflin–St Jeor formula.',
    tr: 'Mifflin–St Jeor formülüyle günlük kalori ve makroları tahmin edin.',
  },
  sex: { ru: 'Пол', en: 'Sex', tr: 'Cinsiyet' },
  male: { ru: 'Муж.', en: 'Male', tr: 'Erkek' },
  female: { ru: 'Жен.', en: 'Female', tr: 'Kadın' },
  age: { ru: 'Возраст', en: 'Age', tr: 'Yaş' },
  weightKg: { ru: 'Вес, кг', en: 'Weight, kg', tr: 'Kilo, kg' },
  heightCm: { ru: 'Рост, см', en: 'Height, cm', tr: 'Boy, cm' },
  activity: { ru: 'Активность', en: 'Activity', tr: 'Aktivite' },
  actSedentary: { ru: 'Малоподвижный', en: 'Sedentary', tr: 'Hareketsiz' },
  actLight: { ru: 'Лёгкая (1–3/нед)', en: 'Light (1–3/wk)', tr: 'Hafif (1–3/hf)' },
  actModerate: { ru: 'Средняя (3–5/нед)', en: 'Moderate (3–5/wk)', tr: 'Orta (3–5/hf)' },
  actActive: { ru: 'Высокая (6–7/нед)', en: 'Active (6–7/wk)', tr: 'Aktif (6–7/hf)' },
  actVery: { ru: 'Очень высокая', en: 'Very active', tr: 'Çok aktif' },
  goal: { ru: 'Цель', en: 'Goal', tr: 'Hedef' },
  goalLose: { ru: 'Снижение веса', en: 'Lose weight', tr: 'Kilo ver' },
  goalMaintain: { ru: 'Поддержание', en: 'Maintain', tr: 'Koru' },
  goalGain: { ru: 'Набор массы', en: 'Gain muscle', tr: 'Kas kazan' },
  calculate: { ru: 'Рассчитать', en: 'Calculate', tr: 'Hesapla' },
  calories: { ru: 'Калории', en: 'Calories', tr: 'Kalori' },
  protein: { ru: 'Белки', en: 'Protein', tr: 'Protein' },
  fats: { ru: 'Жиры', en: 'Fats', tr: 'Yağ' },
  carbs: { ru: 'Углеводы', en: 'Carbs', tr: 'Karbonhidrat' },
  perDay: { ru: 'в день', en: 'per day', tr: 'günlük' },
  oneRM: { ru: 'Расчёт 1ПМ (разовый максимум)', en: '1RM (one-rep max)', tr: '1TM (tek tekrar maks.)' },
  oneRMDesc: {
    ru: 'Оценка максимального веса на 1 повторение (формула Эпли).',
    en: 'Estimate your one-rep max (Epley formula).',
    tr: 'Tek tekrar maksimumunuzu tahmin edin (Epley formülü).',
  },
  liftedWeight: { ru: 'Вес, кг', en: 'Weight, kg', tr: 'Ağırlık, kg' },
  reps: { ru: 'Повторы', en: 'Reps', tr: 'Tekrar' },
  estimated1RM: { ru: 'Расчётный 1ПМ', en: 'Estimated 1RM', tr: 'Tahmini 1TM' },
  bmiCalc: { ru: 'Индекс массы тела (ИМТ)', en: 'Body mass index (BMI)', tr: 'Vücut kitle indeksi (VKİ)' },
  bmiResult: { ru: 'Ваш ИМТ', en: 'Your BMI', tr: 'VKİ değeriniz' },
} as const;

export type StringKey = keyof typeof dict;

export function t(key: StringKey, lang: Lang): string {
  const entry = dict[key] as Tri;
  return entry[lang] ?? entry.en;
}

export default dict;
