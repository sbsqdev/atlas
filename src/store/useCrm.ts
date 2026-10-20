import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, ClientStage } from '../types';

/** Order of the sales funnel (lost is a side state, not in the flow). */
export const FUNNEL: ClientStage[] = ['lead', 'contacted', 'trial', 'sold', 'active'];

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
      clients: [],
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
    { name: 'human-atlas-crm', version: 1 },
  ),
);
