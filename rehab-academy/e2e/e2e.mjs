// End-to-end smoke test for the demo build.
// Usage: BASE_URL=http://localhost:4173 SHOTS=./shots node e2e/e2e.mjs
// Requires Playwright (set PW_MODULE to its index.js if not installed locally).
import { mkdirSync } from 'node:fs';

const mod = await import(process.env.PW_MODULE ?? 'playwright');
const pw = mod.chromium ? mod : mod.default;
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: 'ru-RU' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

let step = 0;
async function check(name, fn) {
  step++;
  try {
    await fn();
    console.log(`✓ ${step}. ${name}`);
  } catch (e) {
    console.log(`✗ ${step}. ${name}\n   ${e.message.split('\n')[0]}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/FAIL-${step}.png` });
    process.exitCode = 1;
  }
}
const shot = async (n) => SHOTS && page.screenshot({ path: `${SHOTS}/${n}.png` });
const text = (s) => page.getByText(s, { exact: false }).first();
async function login(role) {
  await page.goto(`${BASE}/login`);
  await page.getByTestId(`demo-${role}`).click();
  await page.waitForURL(`${BASE}/`);
}
async function logout() {
  await page.evaluate(() => localStorage.removeItem('ra-session'));
}

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());

await check('login page renders with demo accounts', async () => {
  await page.goto(`${BASE}/login`);
  await text('Анатомия, симуляции и курсы').waitFor();
  await page.getByTestId('demo-student').waitFor();
  await shot('01-login');
});

await check('wrong password is rejected', async () => {
  await page.fill('input[name=email]', 'student@demo.example');
  await page.fill('input[name=password]', 'wrong-password');
  await page.getByRole('button', { name: 'Войти' }).click();
  await text('Неверный email или пароль').waitFor();
});

await check('student signs in with email + password', async () => {
  await page.fill('input[name=password]', 'demo1234');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(`${BASE}/`);
  await text('Добро пожаловать').waitFor();
  await text('Ближайшие задания').waitFor();
  await shot('02-student-dashboard');
});

await check('RBAC: student cannot open platform admin', async () => {
  await page.goto(`${BASE}/admin`);
  await text('Недостаточно прав').waitFor();
});

await check('course catalog shows only published courses', async () => {
  await page.goto(`${BASE}/courses`);
  await page.getByTestId('course-c-knee').waitFor();
  await page.getByTestId('course-c-move').waitFor();
  if (await page.getByTestId('course-c-acl').count()) throw new Error('draft course visible in catalog');
  await shot('03-catalog');
});

await check('lesson player: mark lesson done updates progress (autosaved)', async () => {
  await page.goto(`${BASE}/courses/c-knee`);
  await page.getByTestId('course-continue').click();
  await page.waitForURL(/lessons\/l-k4/);
  await page.locator('[data-testid=knee-viewer] canvas').waitFor();
  await page.waitForTimeout(1500);
  await shot('04-lesson-anatomy');
  await page.getByTestId('lesson-done').click();
  await page.waitForURL(/lessons\/l-k5/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ra-db')).state.progress.filter((p) => p.userId === 'u-student').length);
  if (stored !== 4) throw new Error(`expected 4 completed lessons, got ${stored}`);
});

await check('3D anatomy lab: select structure, info panel, quiz', async () => {
  await page.goto(`${BASE}/anatomy`);
  await page.locator('[data-testid=knee-viewer] canvas').waitFor();
  await page.waitForFunction(() => !document.body.innerText.includes('Загрузка…'), null, { timeout: 15000 });
  await page.getByTestId('struct-patella').click();
  await page.getByTestId('structure-info').getByText('Сесамовидная кость').waitFor();
  await page.getByTestId('struct-acl').click();
  await page.getByTestId('structure-info').getByText('Нет лицензированной 3D-модели').waitFor();
  await page.getByTestId('struct-rectus_femoris').click();
  await page.waitForTimeout(800);
  await shot('05-anatomy-lab');
  await page.getByRole('button', { name: 'Изолировать' }).click();
  await page.getByRole('button', { name: 'Показать всё' }).click();
  await page.getByRole('button', { name: 'Анатомический квиз' }).click();
  await page.getByTestId('anat-quiz').getByText('Найдите на модели').waitFor();
  // Click the centre of the viewport: whichever structure is hit is graded.
  const box = await page.locator('[data-testid=knee-viewer] canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByTestId('anat-quiz').getByText(/Верно|Неверно/).waitFor({ timeout: 5000 });
  await shot('06-anatomy-quiz');
});

await check('simulation: full 6-step knee scenario is scored and saved', async () => {
  await page.goto(`${BASE}/simulations/sim-knee`);
  await page.getByTestId('sim-start').click();
  // Explore: click the canvas until something is picked, then reveal the rest.
  await page.locator('[data-testid=knee-viewer] canvas').waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Показать ответ' }).click();
  await page.getByTestId('sim-next').click();
  const answers = [['a'], ['a'], ['a'], ['a', 'b', 'c', 'd'], ['a'], ['a']];
  for (const ids of answers) {
    for (const id of ids) await page.getByTestId(`opt-${id}`).click();
    if (ids.length === 4) await shot('07-sim-multi');
    await page.getByTestId('sim-answer').click();
    await page.getByTestId('sim-feedback').getByText('Верное решение').waitFor();
    await page.getByTestId('sim-next').click();
  }
  await page.getByTestId('sim-evaluation').waitFor();
  const score = await page.getByTestId('sim-score').innerText();
  if (score !== '86%') throw new Error(`expected 86% (6/7, explore revealed), got ${score}`);
  await shot('08-sim-evaluation');
});

await check('virtual patient: history → exam → analysis → debrief', async () => {
  await page.goto(`${BASE}/patients/vp-knee`);
  for (const h of ['h1', 'h2', 'h3', 'h4', 'h5']) await page.getByTestId(`ask-${h}`).click();
  await page.getByTestId('vp-next').click();
  for (const e of ['e1', 'e2', 'e3', 'e4']) await page.getByTestId(`req-${e}`).click();
  await page.getByTestId('vp-next').click();
  for (const q of ['p1', 'p2', 'p3', 'p4']) await page.locator(`input[name=${q}]`).first().check();
  await page.getByTestId('vp-finish').click();
  await page.getByTestId('vp-debrief').getByText('6/6').waitFor();
  await shot('09-patient-debrief');
});

await check('assessment: all question types, timer, pass → certificate issued', async () => {
  await page.goto(`${BASE}/assessments/as-knee`);
  await page.getByTestId('test-start').click();
  await page.getByTestId('timer').waitFor();
  const MATCH = {
    'Передняя крестообразная связка': 'Ограничивает переднее смещение голени относительно бедра',
    'Задняя крестообразная связка': 'Ограничивает заднее смещение голени относительно бедра',
    'Большеберцовая коллатеральная связка': 'Противостоит вальгусной нагрузке',
    'Малоберцовая коллатеральная связка': 'Противостоит варусной нагрузке',
  };
  const SEQ = ['Четырёхглавая мышца бедра', 'Сухожилие четырёхглавой мышцы', 'Надколенник', 'Связка надколенника', 'Бугристость большеберцовой кости'];
  for (let i = 0; i < 8; i++) {
    const q = page.locator('[data-testid^=question-]');
    const id = (await q.getAttribute('data-testid')).replace('question-', '');
    if (id === 'q-k2') for (const o of ['a', 'b', 'c']) await page.getByTestId(`ans-${o}`).click();
    else if (id === 'q-k3') for (const [l, r] of Object.entries(MATCH)) await page.getByTestId(`match-${l}`).selectOption(r);
    else if (id === 'q-k4') {
      for (let target = 0; target < SEQ.length; target++) {
        const items = await q.locator('ol li span.flex-1').allInnerTexts();
        let at = items.indexOf(SEQ[target]);
        while (at > target) { await q.locator('ol li').nth(at).getByRole('button', { name: 'Выше' }).click(); at--; }
      }
    } else {
      if (id === 'q-k5') await shot('10-test-identify');
      await page.getByTestId('ans-a').click();
    }
    if (i < 7) await page.getByTestId('q-next').click();
  }
  await page.getByTestId('test-submit').click();
  await page.getByTestId('test-result').waitFor();
  const score = await page.getByTestId('test-score').innerText();
  if (score !== '100%') throw new Error(`expected 100%, got ${score}`);
  await shot('11-test-result');
});

await check('completing remaining lessons issues a certificate', async () => {
  for (const l of ['l-k5', 'l-k6', 'l-k8']) {
    await page.goto(`${BASE}/courses/c-knee/lessons/${l}`);
    await page.getByTestId('lesson-done').click();
    await page.waitForTimeout(150);
  }
  await page.goto(`${BASE}/courses/c-knee/lessons/l-k7`); // simulation lesson auto-completes
  await page.goto(`${BASE}/courses/c-knee/lessons/l-k9`); // quiz lesson auto-completes
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/certificates`);
  await page.getByTestId('certificate').waitFor();
  await shot('12-certificates');
});

await check('progress page separates theory / practical / clinical competence', async () => {
  await page.goto(`${BASE}/progress`);
  await text('Профиль компетенций').waitFor();
  await text('Не оценивается онлайн').waitFor();
  await shot('13-progress');
});

await check('career preview: visibility is opt-in (off by default)', async () => {
  await page.goto(`${BASE}/career`);
  if (await page.getByTestId('career-visible').isChecked()) throw new Error('career visible by default');
  await page.getByTestId('career-visible').check();
});

await check('language switch to English', async () => {
  await page.goto(`${BASE}/settings`);
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('navigation').getByText('Simulation Lab').waitFor();
  await page.getByRole('button', { name: 'Русский' }).click();
});

await logout();
await check('instructor: dashboard, create course → module → lesson → test → submit for review', async () => {
  await login('instructor');
  await text('Панель преподавателя').waitFor();
  await shot('14-instructor-dashboard');
  await page.goto(`${BASE}/teach/builder`);
  await page.getByTestId('new-course').click();
  await page.fill('input[name=title]', 'E2E: Плечевой сустав — основы');
  await page.getByTestId('create-course').click();
  await page.waitForURL(/teach\/builder\/c-/);
  await page.fill('input[name=moduleTitle]', 'Модуль 1');
  await page.getByTestId('add-module').click();
  await page.getByTestId('add-lesson').click();
  await page.fill('input[name=lessonTitle]', 'Введение');
  await page.fill('textarea[name=lessonBody]', '## Плечо\n- Лопатка\n- **Плечевая кость**');
  await page.getByTestId('save-lesson').click();
  await page.getByRole('button', { name: 'Тестирование' }).click();
  await page.fill('input[name=testTitle]', 'E2E тест');
  await page.getByTestId('create-test').click();
  await page.getByTestId('add-question').click();
  await page.fill('input[name=prompt]', 'Сколько костей образует плечевой пояс?');
  await page.fill('input[name=option-0]', 'Две');
  await page.fill('input[name=option-1]', 'Пять');
  await page.getByTestId('save-question').click();
  await shot('15-course-editor');
  await page.getByTestId('move-medical_review').click();
  await page.getByTestId('confirm-move').click();
  await text('Курс на проверке').waitFor();
});

await check('instructor classroom: assign simulation, CSV export', async () => {
  await page.goto(`${BASE}/teach/classes/cls-1`);
  await text('Результаты группы').waitFor();
  await page.getByTestId('new-assignment').click();
  await page.locator('select[name=kind]').selectOption('assessment');
  await page.locator('select[name=refId]').selectOption('as-move');
  await page.getByTestId('save-assignment').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-csv').click()]);
  if (!dl.suggestedFilename().endsWith('.csv')) throw new Error(`no csv: ${dl.suggestedFilename()}`);
  await shot('16-class');
});

await logout();
await check('super admin: approve + publish the submitted course; activate clinic pilot', async () => {
  await login('super_admin');
  await page.goto(`${BASE}/admin/review`);
  const card = page.locator('[data-testid^=review-c-]').filter({ hasText: 'E2E: Плечевой сустав' });
  await card.getByTestId('review-move-approved').click();
  await card.getByTestId('review-move-published').click();
  await page.goto(`${BASE}/admin`);
  await page.getByTestId('pilot-org-org-clinic').click();
  await page.getByTestId('confirm-pilot').click();
  await page.getByRole('button', { name: 'Журнал аудита' }).click();
  await text('subscription.pilot_activated').waitFor();
  await shot('17-admin-audit');
});

await logout();
await check('clinic admin: license now active, create employee with temp password', async () => {
  await login('clinic_admin');
  await page.goto(`${BASE}/org`);
  await page.getByTestId('add-org-user').click();
  await page.fill('input[name=fullName]', 'Новый сотрудник');
  await page.fill('input[name=email]', 'new.staff@demo.example');
  await page.getByTestId('save-org-user').click();
  await page.getByTestId('temp-password').waitFor();
  await shot('18-org-admin');
});

await logout();
await check('self-registration: new student has no simulation entitlement; can request pilot', async () => {
  await page.goto(`${BASE}/register`);
  await page.fill('input[name=fullName]', 'Тестовый Пользователь');
  await page.fill('input[name=email]', 'e2e.user@demo.example');
  await page.fill('input[name=password]', 'secret123');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await text('Необходимо согласие').waitFor();
  await page.check('input[name=consent]');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/simulations`);
  await text('не входит в ваш тариф').waitFor();
  await page.goto(`${BASE}/courses`);
  await page.getByTestId('course-c-knee').waitFor();
  // Org isolation: the course the university instructor published stays inside that university.
  if (await page.getByText('E2E: Плечевой сустав').count()) throw new Error('org course leaked to an outside user');
  await page.goto(`${BASE}/pricing`);
  await page.getByTestId('pilot-professional').click();
  await text('Заявка на пилот отправлена').waitFor();
  await shot('19-pricing');
});

await logout();
await check('org-scoped course is visible to a student of the same university', async () => {
  await login('student');
  await page.goto(`${BASE}/courses`);
  await text('E2E: Плечевой сустав').waitFor();
});

await check('mobile layout renders (390px)', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`);
  await text('Добро пожаловать').waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error('horizontal overflow on mobile');
  await shot('20-mobile');
});

// ERR_CERT_*: the sandbox proxy blocks Google Fonts; not an app error.
const relevant = errors.filter((e) => !/favicon|fonts\.g|ERR_CERT_AUTHORITY_INVALID/.test(e));
await check('no runtime errors in console', async () => {
  if (relevant.length) throw new Error(relevant.slice(0, 5).join(' | '));
});
await browser.close();
