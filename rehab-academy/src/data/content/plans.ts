import type { Plan } from '../types';

/* Indicative prices (KZT) for the demo pricing page. Not a public offer —
   final prices are set by the business before launch. */
export const PLANS: Plan[] = [
  {
    id: 'student', name: 'Студент', priceKzt: 4990, perSeat: false, audience: 'Студенты медицинских и спортивных вузов',
    features: ['Базовые курсы', '3D-анатомия', 'Тесты и сертификаты'],
    entitlements: ['courses.basic'],
  },
  {
    id: 'professional', name: 'Специалист', priceKzt: 9990, perSeat: false, audience: 'Тренеры, реабилитологи, инструкторы ЛФК',
    features: ['Все курсы', 'Симуляции', 'Виртуальные пациенты', 'Дополнительные тесты'],
    entitlements: ['courses.basic', 'courses.advanced', 'simulations', 'virtual_patients', 'assessments.extra'],
  },
  {
    id: 'university', name: 'Университет', priceKzt: 2990, perSeat: true, audience: 'Кафедры и факультеты',
    features: ['Учебные группы и задания', 'Аналитика по потокам', 'Все курсы и симуляции', 'Экспорт результатов'],
    entitlements: ['courses.basic', 'courses.advanced', 'simulations', 'virtual_patients', 'assessments.extra', 'classes', 'org.analytics'],
  },
  {
    id: 'clinic', name: 'Клиника', priceKzt: 3990, perSeat: true, audience: 'Реабилитационные центры и клиники',
    features: ['Обучение сотрудников', 'Назначение курсов', 'Аналитика команды'],
    entitlements: ['courses.basic', 'courses.advanced', 'simulations', 'virtual_patients', 'org.employees', 'org.analytics'],
  },
  {
    id: 'enterprise', name: 'Enterprise', priceKzt: null, perSeat: false, audience: 'Сети клиник, крупные вузы',
    features: ['Собственная библиотека контента', 'Интеграции (SSO, LMS)', 'Всё из тарифов «Университет» и «Клиника»'],
    entitlements: ['courses.basic', 'courses.advanced', 'simulations', 'virtual_patients', 'assessments.extra', 'classes', 'org.analytics', 'org.employees', 'custom.library', 'integrations'],
  },
];
export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<Plan['id'], Plan>;
