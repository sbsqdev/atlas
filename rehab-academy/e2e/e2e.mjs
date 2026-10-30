// End-to-end smoke test for the demo build.
// Usage: BASE_URL=http://localhost:4173 SHOTS=./shots node e2e/e2e.mjs
// Requires Playwright (set PW_MODULE to its index.js if not installed locally).
import { mkdirSync } from 'node:fs';

const mod = await import(process.env.PW_MODULE ?? 'playwright');
const pw = mod.chromium ? mod : mod.default;
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS;
// Home is BASE or BASE/ (an app served under a sub-path drops the trailing slash).
const HOME = new RegExp(`^${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`);
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
  await page.waitForURL(HOME);
}
async function logout() {
  await page.evaluate(() => localStorage.removeItem('ra-session'));
}

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());

// Site forms go to FormSubmit; capture them instead of sending real email.
const forms = [];
let failNextForm = false;
await page.route('**/formsubmit.co/**', async (route) => {
  forms.push({ url: route.request().url(), body: JSON.parse(route.request().postData() ?? '{}') });
  const fail = failNextForm; failNextForm = false;
  await route.fulfill({ status: 200, contentType: 'application/json', body: fail ? '{"success":"false","message":"This form needs Activation"}' : '{"success":"true","message":"ok"}' });
});
const plain = (s) => s.replace(/ | /g, ' ');

await check('public page: three courses, prices, Kaspi, WhatsApp and Telegram', async () => {
  await page.goto(`${BASE}/`);
  await page.getByTestId('landing').waitFor();
  for (const id of ['c-run', 'c-tri', 'c-kz']) await page.getByTestId(`landing-course-${id}`).waitFor();
  const prices = (await page.getByTestId('plan-price').allInnerTexts()).map(plain);
  if (prices.join('|') !== '20 000 ₸|10 000 ₸|200 000 ₸') throw new Error(`prices ${prices}`);
  if (!plain(await page.getByTestId('landing-launch').innerText()).includes('первых 500')) throw new Error('launch offer');
  if ((await page.getByTestId('landing-kaspi').getAttribute('href')) !== 'https://pay.kaspi.kz/pay/jk9m2wsj') throw new Error('kaspi link');
  if (!(await page.getByTestId('landing-whatsapp').getAttribute('href')).startsWith('https://wa.me/77073737767')) throw new Error('whatsapp');
  if ((await page.getByTestId('landing-telegram').getAttribute('href')) !== 'https://t.me/ecosystem_tech') throw new Error('telegram');
  for (const z of ['north', 'almaty', 'south', 'west', 'centerEast']) await page.getByTestId(`zone-${z}`).waitFor();
  await page.getByTestId('reviews-empty').waitFor();
  await shot('00-landing');
});

await check('application form → email (FormSubmit) → Kaspi payment button', async () => {
  await page.getByTestId('choose-month').click();
  const f = page.getByTestId('form-apply');
  await f.getByTestId('form-apply-submit').click();
  await text('Заполните обязательные поля').waitFor();
  await f.locator('input[name=name]').fill('Айгерим');
  await f.locator('input[name=email]').fill('aigerim@test.example');
  await f.locator('input[name=contact]').fill('+7 700 000 00 00');
  await f.locator('select[name=city]').selectOption('astana');
  await f.locator('select[name=sport]').selectOption('marathon');
  await f.locator('input[name=consent]').check();
  await f.getByTestId('form-apply-submit').click();
  await page.getByTestId('form-apply-sent').waitFor();
  await page.getByTestId('kaspi-pay').waitFor();
  const sent = forms.at(-1);
  if (!sent.url.includes('formsubmit.co/ajax/sbsqbiz@gmail.com')) throw new Error(`endpoint ${sent.url}`);
  const b = sent.body;
  if (!b._subject.startsWith('Заявка на доступ') || b.Email !== 'aigerim@test.example' || b['Город'] !== 'Астана' || !plain(b['Тариф']).includes('10 000')) throw new Error(JSON.stringify(b));
});

await check('Kazakh: landing switches to Kazakh and back', async () => {
  await page.getByTestId('lang-switch').getByText('KZ').click();
  await text('Ұзағырақ жүгіріңіз').waitFor();
  await text('Бір жазылымда үш курс').waitFor();
  await shot('00-landing-kk');
  await page.getByTestId('lang-switch').getByText('RU').click();
  await text('Бегайте дольше').waitFor();
});

await check('offer and privacy pages', async () => {
  await page.goto(`${BASE}/offer`);
  await page.getByTestId('legal-offer').waitFor();
  const o = plain(await page.getByTestId('legal-offer').innerText());
  for (const s of ['SB dev', '20 000 ₸', '10 000 ₸', 'pay.kaspi.kz/pay/jk9m2wsj', 'в течение 24 часов', '+77073737767', '@ecosystem_tech']) if (!o.includes(s)) throw new Error(`offer lacks ${s}`);
  await page.goto(`${BASE}/privacy`);
  await text('FormSubmit').waitFor();
});

await check('demo: athlete menu, trial banner, courses for athletes only', async () => {
  await page.goto(`${BASE}/`);
  await page.getByTestId('landing-demo').first().click();
  await page.waitForURL(/courses\/c-run$/);
  await page.goto(`${BASE}/`);
  await page.getByTestId('athlete-home').waitFor();
  await text('Продолжить обучение').waitFor();
  if (!(await page.getByTestId('access-banner').innerText()).includes('Пробный доступ')) throw new Error('trial banner');
  const navText = await page.getByRole('navigation').innerText();
  for (const shown of ['Сообщество', 'Мой профиль']) if (!navText.includes(shown)) throw new Error(`no ${shown}`);
  for (const hidden of ['Симуляции', 'Виртуальные пациенты', 'Карьера', 'Тарифы']) if (navText.includes(hidden)) throw new Error(`athlete sees ${hidden}`);
  await page.goto(`${BASE}/courses`);
  for (const id of ['c-run', 'c-tri', 'c-kz']) await page.getByTestId(`course-${id}`).waitFor();
  if (await page.getByTestId('course-c-knee').count()) throw new Error('specialist course shown to athlete');
  await shot('00b-athlete-home');
});

await check('trial: first module open, later lessons and tests behind the paywall', async () => {
  await page.goto(`${BASE}/courses/c-run/lessons/l-r3`);
  await page.getByTestId('lesson-cta').waitFor();
  await page.goto(`${BASE}/courses/c-run`);
  await page.getByTestId('lesson-locked').first().waitFor();
  await page.goto(`${BASE}/courses/c-run/lessons/l-r5`);
  await page.getByTestId('paywall').waitFor();
  if (await page.locator('[data-testid=anatomy-viewer]').count()) throw new Error('locked 3D lesson rendered');
  await page.goto(`${BASE}/assessments/as-run`);
  await page.getByTestId('paywall').waitFor();
  await page.getByTestId('paywall-apply').click();
  await page.getByTestId('form-apply').waitFor();
  await shot('00c-paywall');
  await page.goto(`${BASE}/anatomy?m=foot`);
  await page.locator('[data-testid=anatomy-viewer][data-model=foot] canvas').waitFor();
  await page.getByTestId('struct-calcaneal_tendon').click();
  await page.getByTestId('structure-info').getByText('Пяточное (ахиллово) сухожилие').waitFor();
});

await check('3D exercises: animated figure, controls, trial lock', async () => {
  await page.goto(`${BASE}/exercises`);
  const player = page.locator('[data-testid=exercise-player][data-exercise=chair-squat]');
  await player.locator('canvas').waitFor();
  await page.getByTestId('exercise-view-side').click();
  await page.getByTestId('exercise-play').click();
  await page.getByTestId('exercise-play').getByText('Пуск').waitFor();
  await page.getByTestId('exercise-play').click();
  await shot('00h-exercises');
  await page.getByTestId('ex-group-hip').click();
  await page.getByTestId('exercise-glute-bridge').click();
  await page.locator('[data-testid=exercise-player][data-exercise=glute-bridge] canvas').waitFor();
  await page.getByTestId('exercise-side-plank').click();
  await page.waitForURL(/\/access$/);
  await page.getByTestId('paywall').waitFor();
});

await check('profile and community: city chat, zone tips, region form', async () => {
  await page.goto(`${BASE}/profile`);
  await page.locator('select[name=city]').selectOption('shymkent');
  await page.getByRole('button', { name: 'Триатлон' }).click();
  await page.locator('input[name=goal]').fill('Первый полумарафон');
  await page.getByTestId('profile-save').click();
  await text('Сохранено').waitFor();
  await page.goto(`${BASE}/community`);
  await page.getByTestId('community').waitFor();
  await text('Юг').waitFor();
  await page.getByTestId('join-shymkent').click();
  const f = page.getByTestId('form-region');
  await f.locator('input[name=name]').fill('Бегун');
  await f.locator('input[name=contact]').fill('@runner');
  await f.locator('input[name=consent]').check();
  await f.getByTestId('form-region-submit').click();
  await page.getByTestId('form-region-sent').waitFor();
  if (forms.at(-1).body['Город'] !== 'Шымкент') throw new Error('region form city');
  await shot('00d-community');
});
await check('profile photo, socials and public athlete card', async () => {
  await page.goto(`${BASE}/profile`);
  await page.getByTestId('photo-input').setInputFiles(new URL('../public/landing/knee.webp', import.meta.url).pathname);
  await page.getByTestId('profile-photo').waitFor();
  await page.locator('input[name=fullName]').fill('Айгерим Бегун');
  await page.locator('input[name=instagram]').fill('@aigerim.runs');
  await page.locator('input[name=strava]').fill('12345');
  await page.locator('input[name=pb-half]').fill('1:52:10');
  await page.locator('input[name=openToMeet]').check();
  await page.getByTestId('profile-save').click();
  const link = await page.getByTestId('card-link').inputValue();
  await page.goto(link);
  await page.getByTestId('athlete-card').getByText('Айгерим Бегун').waitFor();
  if ((await page.getByRole('link', { name: 'Instagram' }).getAttribute('href')) !== 'https://instagram.com/aigerim.runs') throw new Error('instagram link');
  await text('Шымкент').waitFor();
  await text('1:52:10').waitFor();
  await shot('00f-athlete-card');
});

await check('stories: profile, race and course templates; picture downloads', async () => {
  await page.goto(`${BASE}/stories`);
  await page.getByTestId('story-canvas').waitFor();
  const size = await page.getByTestId('story-canvas').evaluate((c) => [c.width, c.height].join('x'));
  if (size !== '1080x1920') throw new Error(size);
  await page.getByTestId('story-race').click();
  await page.locator('input[name=event]').fill('Алматы марафон');
  await page.locator('input[name=time]').fill('1:45:30');
  await page.getByTestId('story-course').click();
  await page.getByTestId('story-race').click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('story-save').click()]);
  if (dl.suggestedFilename() !== 'fab3d-story-race.png') throw new Error(dl.suggestedFilename());
  const painted = await page.getByTestId('story-canvas').evaluate((c) => c.toDataURL('image/png').length);
  if (painted < 50_000) throw new Error('empty story');
  await shot('00g-stories');
});

await check('consultation: MedLife offline request; failed send falls back to WhatsApp', async () => {
  await page.goto(`${BASE}/`);
  await page.getByTestId('consult-banner').waitFor();
  await page.goto(`${BASE}/consult`);
  await page.getByTestId('consult-offline').click();
  const f = page.getByTestId('form-consult');
  await f.locator('input[name=name]').fill('Айгерим');
  await f.locator('input[name=contact]').fill('+7 700 000 00 00');
  await f.locator('select[name=area]').selectOption('knee');
  await f.locator('input[name=consent]').check();
  failNextForm = true;
  await f.getByTestId('form-consult-submit').click();
  const wa = await page.getByTestId('form-consult-whatsapp').getAttribute('href');
  if (!wa.startsWith('https://wa.me/77073737767?text=') || !decodeURIComponent(wa).includes('MedLife')) throw new Error(`fallback ${wa}`);
  await f.getByTestId('form-consult-submit').click();
  await page.getByTestId('form-consult-sent').waitFor();
  const b = forms.at(-1).body;
  if (!b._subject.startsWith('Запись на консультацию') || !b['Формат'].includes('MedLife') || b['Что беспокоит'] !== 'Колено' || b['Город'] !== 'Шымкент') throw new Error(JSON.stringify(b));
  await page.goto(`${BASE}/courses/c-run/lessons/l-r2`);
  await page.getByTestId('consult-banner').waitFor();
  await page.goto(`${BASE}/community`);
  await page.getByTestId('members-empty').waitFor();
  await page.getByTestId('members-join').click();
  await page.getByTestId('form-member').waitFor();
});
await logout();

const KEY_FILE = process.env.ACCESS_KEY_FILE;
await check('owner issues a code on /issue; athlete activates it and gets full access', async () => {
  if (!KEY_FILE) { console.log('   (skipped: set ACCESS_KEY_FILE to the private key to run it)'); return; }
  await page.goto(`${BASE}/activate?email=x@test.example&code=abc.def`);
  await page.locator('input[name=consent]').check();
  await page.getByTestId('activate-submit').click();
  await page.getByTestId('activate-error').getByText('Код не подошёл').waitFor();

  await page.goto(`${BASE}/issue`);
  await page.getByTestId('issuer-key').setInputFiles(KEY_FILE);
  await page.locator('input[name=email]').fill('Triathlete@Test.example');
  await page.locator('input[name=name]').fill('Данияр');
  await page.getByTestId('issue-submit').click();
  const link = await page.getByTestId('issue-link').inputValue();
  if (!link.startsWith(`${BASE}/activate?email=triathlete%40test.example&code=`)) throw new Error(`link ${link}`);
  await shot('00e-issue');

  await page.goto(link.replace('triathlete%40test.example', 'other%40test.example'));
  await page.locator('input[name=consent]').check();
  await page.getByTestId('activate-submit').click();
  await page.getByTestId('activate-error').getByText('другой email').waitFor();

  await page.goto(link);
  await page.locator('input[name=name]').fill('Данияр');
  await page.locator('input[name=consent]').check();
  await page.getByTestId('activate-submit').click();
  await page.waitForURL(HOME);
  if (!(await page.getByTestId('access-banner').innerText()).includes('Доступ до')) throw new Error('no access');
  await page.goto(`${BASE}/courses/c-tri`);
  await page.getByTestId('course-enroll').click();
  await page.goto(`${BASE}/courses/c-tri/lessons/l-t10`);
  await page.locator('[data-testid=anatomy-viewer][data-model=knee] canvas').waitFor();
  if (await page.getByTestId('paywall').count()) throw new Error('paywall after activation');
  await page.goto(`${BASE}/assessments/as-tri`);
  await text('Итоговый тест: триатлон без травм').first().waitFor();
  await page.goto(`${BASE}/courses/c-kz/lessons/l-z8`);
  await text('Рамазан').first().waitFor();
  await page.goto(`${BASE}/courses/c-tri/lessons/l-t17`);
  await page.getByTestId('exercise-set').waitFor();
  await page.getByTestId('exercise-plank').click();
  await page.locator('[data-testid=exercise-player][data-exercise=plank] canvas').waitFor();
  await page.goto(`${BASE}/exercises`);
  await page.getByTestId('ex-group-hip').click();
  await page.getByTestId('exercise-side-plank').click();
  await page.locator('[data-testid=exercise-player][data-exercise=side-plank] canvas').waitFor();

  // The owner opens everything for herself from /issue (the key is already imported).
  await logout();
  await page.goto(`${BASE}/issue`);
  await page.getByTestId('owner-access').click();
  await page.waitForURL(HOME);
  if (!(await page.getByTestId('access-banner').innerText()).includes('Доступ до')) throw new Error('owner access');
  await page.goto(`${BASE}/courses/c-run/lessons/l-r5`);
  if (await page.getByTestId('paywall').count()) throw new Error('owner sees paywall');
});
await logout();

await check('login page renders with demo accounts', async () => {
  await page.goto(`${BASE}/login`);
  await text('Бегайте дольше и без боли').waitFor();
  await page.getByTestId('demo-athlete').waitFor();
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
  await page.waitForURL(HOME);
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
  await page.locator('[data-testid=anatomy-viewer] canvas').waitFor();
  await page.waitForTimeout(1500);
  await shot('04-lesson-anatomy');
  await page.getByTestId('lesson-done').click();
  await page.waitForURL(/lessons\/l-k5/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ra-db')).state.progress.filter((p) => p.userId === 'u-student').length);
  if (stored !== 4) throw new Error(`expected 4 completed lessons, got ${stored}`);
});

await check('3D anatomy lab: select structure, info panel, quiz', async () => {
  await page.goto(`${BASE}/anatomy`);
  await page.locator('[data-testid=anatomy-viewer] canvas').waitFor();
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
  const box = await page.locator('[data-testid=anatomy-viewer] canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByTestId('anat-quiz').getByText(/Верно|Неверно/).waitFor({ timeout: 5000 });
  await shot('06-anatomy-quiz');
});

await check('simulation: full 6-step knee scenario is scored and saved', async () => {
  await page.goto(`${BASE}/simulations/sim-knee`);
  await page.getByTestId('sim-start').click();
  // Explore: click the canvas until something is picked, then reveal the rest.
  await page.locator('[data-testid=anatomy-viewer] canvas').waitFor();
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
  await page.locator('select[name=role]').selectOption('student');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await page.waitForURL(HOME);
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
