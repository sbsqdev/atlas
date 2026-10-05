import type { Lang } from '../types';

/** UI label dictionary. Keep keys flat and descriptive. */
const dict = {
  appName: { ru: 'Human Atlas', en: 'Human Atlas' },
  tagline: {
    ru: 'Тренировки от разных тренеров и 3D-карта мышц',
    en: 'Courses from many trainers and a 3D muscle map',
  },

  // auth
  login: { ru: 'Войти', en: 'Log in' },
  logout: { ru: 'Выйти', en: 'Log out' },
  signIn: { ru: 'Вход в систему', en: 'Sign in' },
  name: { ru: 'Имя', en: 'Name' },
  email: { ru: 'E-mail', en: 'Email' },
  role: { ru: 'Роль', en: 'Role' },
  student: { ru: 'Ученик', en: 'Student' },
  trainer: { ru: 'Тренер', en: 'Trainer' },
  continueAs: { ru: 'Продолжить как', en: 'Continue as' },
  demoHint: {
    ru: 'Демо-вход: данные хранятся локально в браузере. Пароль не требуется.',
    en: 'Demo login: data is stored locally in your browser. No password required.',
  },
  quickStudent: { ru: 'Быстрый вход — ученик', en: 'Quick login — student' },
  quickTrainer: { ru: 'Быстрый вход — тренер', en: 'Quick login — trainer' },

  // nav
  trainers: { ru: 'Тренеры', en: 'Trainers' },
  courses: { ru: 'Курсы', en: 'Courses' },
  dashboard: { ru: 'Кабинет тренера', en: 'Trainer dashboard' },

  // catalogue
  chooseTrainer: { ru: 'Выберите тренера', en: 'Choose a trainer' },
  coursesBy: { ru: 'Курсы тренера', en: 'Courses by' },
  level: { ru: 'Уровень', en: 'Level' },
  workouts: { ru: 'тренировок', en: 'workouts' },
  openCourse: { ru: 'Открыть курс', en: 'Open course' },
  workout: { ru: 'Тренировка', en: 'Workout' },
  workoutsTitle: { ru: 'Тренировки', en: 'Workouts' },
  exercises: { ru: 'упражнений', en: 'exercises' },

  // exercise / muscle
  musclesWorked: { ru: 'Какие мышцы работают', en: 'Muscles worked' },
  primaryMuscles: { ru: 'Основные мышцы', en: 'Primary muscles' },
  secondaryMuscles: { ru: 'Вспомогательные мышцы', en: 'Synergists / stabilisers' },
  prescription: { ru: 'Подходы и повторы', en: 'Sets & reps' },
  coachNote: { ru: 'Заметка тренера', en: 'Coach note' },
  watchVideo: { ru: 'Смотреть видео', en: 'Watch video' },
  description: { ru: 'Описание', en: 'Description' },
  front: { ru: 'Спереди', en: 'Front' },
  back: { ru: 'Сзади', en: 'Back' },
  rotateHint: {
    ru: 'Тяните, чтобы повернуть · колесо — приблизить',
    en: 'Drag to rotate · scroll to zoom',
  },
  workoutMuscleMap: {
    ru: 'Карта мышц всей тренировки',
    en: 'Muscle map for the whole workout',
  },
  selectExercise: {
    ru: 'Выберите упражнение, чтобы увидеть целевые мышцы',
    en: 'Select an exercise to see its target muscles',
  },

  // editor
  myCourses: { ru: 'Мои курсы', en: 'My courses' },
  newCourse: { ru: 'Новый курс', en: 'New course' },
  editCourse: { ru: 'Редактировать курс', en: 'Edit course' },
  addWorkout: { ru: 'Добавить тренировку', en: 'Add workout' },
  addExercise: { ru: 'Добавить упражнение', en: 'Add exercise' },
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  edit: { ru: 'Изменить', en: 'Edit' },
  title: { ru: 'Название', en: 'Title' },
  summary: { ru: 'Краткое описание', en: 'Summary' },
  fieldRu: { ru: 'по-русски', en: 'in Russian' },
  fieldEn: { ru: 'по-английски', en: 'in English' },
  targetMuscles: { ru: 'Целевые мышцы (нажмите, чтобы выбрать)', en: 'Target muscles (tap to toggle)' },
  markPrimary: { ru: 'осн.', en: 'primary' },
  videoUrl: { ru: 'Ссылка на видео', en: 'Video URL' },
  noCoursesYet: {
    ru: 'У вас пока нет курсов. Создайте первый!',
    en: 'You have no courses yet. Create your first one!',
  },
  emptyWorkout: { ru: 'В этой тренировке пока нет упражнений.', en: 'No exercises in this workout yet.' },
  resetDemo: { ru: 'Сбросить демо-данные', en: 'Reset demo data' },
  confirmReset: {
    ru: 'Сбросить все локальные данные к начальным? Ваши изменения будут потеряны.',
    en: 'Reset all local data to the seed? Your changes will be lost.',
  },
} as const;

export type StringKey = keyof typeof dict;

/** Translate a key into the active language. */
export function t(key: StringKey, lang: Lang): string {
  return dict[key][lang];
}

export default dict;
