# Human Atlas — тренировки и 3D-карта мышц · training platform with a 3D muscle map

A bilingual (Russian / English) web app where **trainers publish course sets of
exercises** and **students follow them**, with an **interactive 3D model that
highlights which muscles each exercise activates**.

> Двуязычная (RU/EN) платформа: тренеры публикуют курсы с упражнениями,
> ученики их проходят, а интерактивная 3D-модель показывает, какие мышцы
> работают в каждом упражнении.

## Features / Возможности

- **Languages / Языки** — RU · EN · **TR** (Turkish). One-click toggle; content
  falls back to English where a coach hasn't added a translation.
- **Accounts / Аккаунты** — real **sign up / sign in** for **coaches** and
  **students** (client-side, light-hashed passwords — demo-grade, see the
  security note). Demo logins are on the sign-in screen.
- **Invite-code access / Доступ по коду** — students do **not** browse or
  discover courses or coaches. A student joins **one coach's course via an
  invite code** the coach shares. Coaches (who may be competitors) never appear
  in a public directory.
- **Coach branding / Брендинг тренера** — each coach sets a brand name and
  accent colour; students see that branding inside the course.
- **Progress / Прогресс** — students mark workouts done and see a completion bar
  per course (edtech-style performance tracking).
- **Calculators / Калькуляторы** — **КБЖУ / macros** (Mifflin–St Jeor TDEE +
  protein/fat/carb split), **1RM** (Epley) and **BMI**.
- **Courses → Workouts → Exercises** — seeded with Rauana Kuangaliyeva's real
  glutes-&-legs strength program (exercises, set/rep schemes, progression notes
  and demo video links). Demo course invite code: **`RAUANA`**.
- **Real 3D anatomy atlas** — the viewer is the **BodyParts3D 4.0** adult-male
  reference: **2,234 selectable meshes across 15 systems**, ported from
  [Ashe Magalhaes's Human Atlas](https://github.com/ashemag/human-atlas). For
  each exercise it lights up the muscles worked — **orange = primary**,
  **amber = synergists / stabilisers** — and you can switch systems
  (Muscles / Muscles+bones / Skeleton / All), change view (¾ / front / back /
  side), **explode** the body into a spaced inventory, isolate the target
  muscles, auto-rotate, and tap any structure to inspect it. Each workout also
  has an aggregate "muscles of the whole session" view.
- **Bilingual everything / Всё на двух языках** — one-click RU ⇄ EN toggle; all
  course content carries both languages.
- **Trainer dashboard / Кабинет тренера** — create, edit and delete courses,
  workouts and exercises, with a tri-state muscle picker (off → primary →
  synergist) to drive the 3D highlighting.

## Tech stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [three.js](https://threejs.org/) — the batched-geometry anatomy viewer
  (`src/anatomy/`) is ported from Ashe Magalhaes's Human Atlas (MIT); it merges
  all meshes into per-system batches and drives per-structure visibility,
  translation and selection through GPU textures so orbit stays responsive.
- [zustand](https://github.com/pmndrs/zustand) for state, persisted to
  `localStorage`
- `react-router-dom` (HashRouter, so it works on static hosts / GitHub Pages)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

Demo logins on the sign-in screen (password `demo1234` for both):

- **Demo student** (`student@demo.app`) → already enrolled in the seeded
  course; see progress and the 3D muscle map. Join more via code.
- **Demo coach** (`rauana@demo.app`) → dashboard with invite codes, branding
  and the course editor.

To test the invite flow: sign up a new **student**, then enter code **`RAUANA`**
(or any code a coach shows on their dashboard) to unlock that course.

## Data model

- All content lives in `src/data/seed.ts` (trainers, the exercise library with
  muscle mappings, and the seeded course).
- Muscle regions and their bilingual names are in `src/data/muscles.ts`.
- `src/data/muscleParts.generated.ts` maps each muscle region to the
  BodyParts3D part IDs it highlights. Regenerate it from the atlas with
  `node scripts/gen-muscle-parts.mjs`. (BodyParts3D 4.0 omits a few superficial
  muscles — e.g. rectus abdominis and latissimus dorsi — so the core and "lats"
  regions fall back to the nearest available structures; see the script.)
- The 3D viewer and its geometry are in `src/anatomy/` and
  `public/models/` (`atlas.json` + gzipped mesh batches `body-*.bin.gz`).
- User edits are stored in `localStorage` (`human-atlas-data`). Reset to the
  seed any time from the trainer dashboard → **Сбросить демо-данные / Reset
  demo data**.

## Attribution

- **3D viewer & geometry pipeline** adapted from
  [ashemag/human-atlas](https://github.com/ashemag/human-atlas) by Ashe
  Magalhaes — **MIT** (see `public/UPSTREAM-LICENSE`).
- **Anatomy data**: BodyParts3D 4.0 (adult male reference), © The Database
  Center for Life Science — **CC BY 4.0**. Full credits and source links are in
  [`public/ATTRIBUTION.md`](public/ATTRIBUTION.md).
- Educational explorer only — not a diagnostic or surgical tool.

## Notes & next steps

- Auth is **client-side only** for the MVP — there is no server, so accounts,
  passwords (lightly hashed, **not** real security) and invite codes live in
  the browser's `localStorage` and are not shared between devices. The
  invite-code model is a UX gate, not enforced access control. Swapping
  `src/store/*` for a real backend (e.g. Supabase / Firebase) with server-side
  auth and invite validation is the natural next step.
- Video links point to the trainer's originals (Google Drive / YouTube) and
  open in a new tab.
- The anatomy viewer downloads ~33 MB of gzipped geometry on first load
  (decompressed in the browser via `DecompressionStream`). It is cached by the
  browser afterwards.
