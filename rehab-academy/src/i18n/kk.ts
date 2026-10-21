import type { I18nKey } from './ru';

/** Қазақша — partial (core navigation). Requires native-speaker review;
 *  missing keys fall back to Russian. */
const kk: Partial<Record<I18nKey, string>> = {
  'nav.dashboard': 'Басқару тақтасы', 'nav.anatomy': '3D анатомия', 'nav.simulations': 'Симуляциялар',
  'nav.patients': 'Виртуалды пациенттер', 'nav.courses': 'Курстар', 'nav.assessments': 'Тестілеу',
  'nav.progress': 'Менің прогресім', 'nav.certificates': 'Сертификаттар', 'nav.career': 'Мансап',
  'nav.settings': 'Баптаулар', 'nav.logout': 'Шығу', 'nav.pricing': 'Тарифтер',
  'auth.signIn': 'Кіру', 'auth.signUp': 'Тіркелу', 'auth.password': 'Құпиясөз', 'auth.submitIn': 'Кіру',
  'role.student': 'Студент', 'role.instructor': 'Оқытушы',
  'common.save': 'Сақтау', 'common.cancel': 'Болдырмау', 'common.start': 'Бастау', 'common.continue': 'Жалғастыру',
  'common.next': 'Келесі', 'common.back': 'Артқа',
  'set.language': 'Интерфейс тілі',
};
export default kk;
