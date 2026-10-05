# Human Atlas — тренировки и 3D-карта мышц · training platform with a 3D muscle map

A bilingual (Russian / English) web app where **trainers publish course sets of
exercises** and **students follow them**, with an **interactive 3D model that
highlights which muscles each exercise activates**.

> Двуязычная (RU/EN) платформа: тренеры публикуют курсы с упражнениями,
> ученики их проходят, а интерактивная 3D-модель показывает, какие мышцы
> работают в каждом упражнении.

## Features / Возможности

- **Roles / Роли** — log in as a **trainer** (authors courses) or a **student**
  (follows them). Demo auth, no password, state kept in the browser.
- **Trainers → Courses → Workouts → Exercises** — a full catalogue. Seeded with
  Rauana Kuangaliyeva's real glutes-&-legs strength program (exercises, set/rep
  schemes, progression notes and demo video links).
- **3D muscle map** — a rotatable figure (`three.js` / react-three-fiber) that
  lights up the muscles worked: **orange = primary**, **amber = synergists /
  stabilisers**. Front/back toggle, drag to rotate, scroll to zoom. Each workout
  also has an aggregate "muscles of the whole session" view.
- **Bilingual everything / Всё на двух языках** — one-click RU ⇄ EN toggle; all
  course content carries both languages.
- **Trainer dashboard / Кабинет тренера** — create, edit and delete courses,
  workouts and exercises, with a tri-state muscle picker (off → primary →
  synergist) to drive the 3D highlighting.

## Tech stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [three.js](https://threejs.org/) via
  [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + `drei`
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

Use the **Quick login** buttons on the sign-in screen:

- **Быстрый вход — ученик / student** → browse trainers and the 3D muscle map.
- **Быстрый вход — тренер / trainer** → open the dashboard and edit courses.

## Data model

- All content lives in `src/data/seed.ts` (trainers, the exercise library with
  muscle mappings, and the seeded course).
- Muscle regions and their bilingual names are in `src/data/muscles.ts`; their
  3D placement on the figure is in `src/components/MuscleModel.tsx`.
- User edits are stored in `localStorage` (`human-atlas-data`). Reset to the
  seed any time from the trainer dashboard → **Сбросить демо-данные / Reset
  demo data**.

## Notes & next steps

- Auth is **client-side only** for the MVP — there is no server, so "accounts"
  are not shared between devices. Swapping `src/store/*` for a real backend
  (e.g. Supabase / Firebase) is the natural next step.
- Video links point to the trainer's originals (Google Drive / YouTube) and
  open in a new tab.
- The 3D figure is a **stylised anatomical map** built from primitives (so it
  loads instantly and needs no model asset). It can later be upgraded to a
  rigged anatomical GLTF model without changing the rest of the app.
