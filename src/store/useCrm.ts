import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEMO_TRAINER_ID } from '../data/seed';
import type { Client, ClientStage } from '../types';

/** Order of the sales funnel (lost is a side state, not in the flow). */
export const FUNNEL: ClientStage[] = ['lead', 'contacted', 'trial', 'sold', 'active'];

const t = DEMO_TRAINER_ID;
const day = 86400000;
// Demo clients so the funnel is populated under the Demo Coach account.
const SEED_CLIENTS: Client[] = [
  { id: 'cl-demo-1', trainerId: t, name: 'Айгерим', contact: '@aigerim', stage: 'lead', nextAction: 'Написать завтра утром', createdAt: Date.now() - day * 1, updatedAt: Date.now() - day * 1 },
  { id: 'cl-demo-2', trainerId: t, name: 'Сабина', contact: '+7 701 000-00-00', stage: 'contacted', note: 'Интересует пилатес вживую', nextAction: 'Позвать на пробное', createdAt: Date.now() - day * 3, updatedAt: Date.now() - day * 1 },
  { id: 'cl-demo-3', trainerId: t, name: 'Дана', contact: '@dana_fit', stage: 'trial', nextAction: 'Собрать отзыв после пробного', createdAt: Date.now() - day * 5, updatedAt: Date.now() - day * 1 },
  { id: 'cl-demo-4', trainerId: t, name: 'Мадина', contact: '@madina', stage: 'sold', value: 20000, note: 'Оплатила месяц', createdAt: Date.now() - day * 8, updatedAt: Date.now() - day * 2 },
  { id: 'cl-demo-5', trainerId: t, name: 'Алия', contact: '@aliya', stage: 'active', value: 25000, note: 'Ходит 2-й месяц, прогресс отличный', createdAt: Date.now() - day * 40, updatedAt: Date.now() - day * 1 },
  { id: 'cl-demo-6', trainerId: t, name: 'Жанна', contact: '@zhanna', stage: 'lost', note: 'Передумала, нет времени', createdAt: Date.now() - day * 10, updatedAt: Date.now() - day * 4 },
];

/** Trainer CRM: manage clients from first lead to a paying, coached client.
 *  LOCAL per device for now — becomes shared with the backend. */
interface CrmState {
  clients: Client[];
  add: (trainerId: string, name: string, contact?: string) => void;
  update: (id: string, patch: Partial<Client>) => void;
  setStage: (id: string, stage: ClientStage) => void;
  moveBy: (id: string, dir: 1 | -1) => void;
  remove: (id: string) => void;
  forTrainer: (trainerId: string) => Client[];
}

export const useCrm = create<CrmState>()(
  persist(
    (set, get) => ({
      clients: SEED_CLIENTS,
      add: (trainerId, name, contact) => {
        const n = name.trim();
        if (!n) return;
        const now = Date.now();
        const client: Client = {
          id: `cl-${now.toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          trainerId, name: n, contact: contact?.trim() || undefined, stage: 'lead', createdAt: now, updatedAt: now,
        };
        set((s) => ({ clients: [...s.clients, client] }));
      },
      update: (id, patch) => set((s) => ({
        clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
      })),
      setStage: (id, stage) => get().update(id, { stage }),
      moveBy: (id, dir) => {
        const c = get().clients.find((x) => x.id === id);
        if (!c) return;
        if (c.stage === 'lost') { if (dir > 0) get().update(id, { stage: 'lead' }); return; }
        const i = FUNNEL.indexOf(c.stage);
        const ni = Math.max(0, Math.min(FUNNEL.length - 1, i + dir));
        get().update(id, { stage: FUNNEL[ni] });
      },
      remove: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
      forTrainer: (trainerId) => get().clients.filter((c) => c.trainerId === trainerId),
    }),
    {
      name: 'human-atlas-crm',
      version: 2,
      // Inject demo clients that aren't present yet; keep real ones.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as { clients?: Client[] };
        const existing = p.clients ?? [];
        const ids = new Set(existing.map((c) => c.id));
        return { clients: [...existing, ...SEED_CLIENTS.filter((c) => !ids.has(c.id))] };
      },
    },
  ),
);
