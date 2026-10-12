import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emptyEncounter, sanitizeEncounter } from '../dm/encounter';
import { sanitizeEnemy } from '../dm/enemy';
import type { Encounter, Enemy } from '../dm/types';
import { uid } from '../rules/core';
import { appStorage } from './storage';

interface DmState {
  enemies: Record<string, Enemy>;
  encounter: Encounter;
  saveEnemy: (e: Enemy) => void;
  removeEnemy: (id: string) => void;
  /** Adds shared enemies; an id that already exists gets a new one. Returns how many were added. */
  importEnemies: (list: Enemy[]) => number;
  updateEncounter: (fn: (enc: Encounter) => Encounter) => void;
}

export const useDm = create<DmState>()(
  persist(
    (set, get) => ({
      enemies: {},
      encounter: emptyEncounter(),
      saveEnemy: (e) => set((s) => ({ enemies: { ...s.enemies, [e.id]: { ...e, updatedAt: Date.now() } } })),
      removeEnemy: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.enemies;
          return { enemies: rest };
        }),
      importEnemies: (list) => {
        const enemies = { ...get().enemies };
        for (const e of list) {
          const id = enemies[e.id] ? uid('enemy') : e.id;
          enemies[id] = { ...e, id };
        }
        set({ enemies });
        return list.length;
      },
      updateEncounter: (fn) => set((s) => ({ encounter: fn(s.encounter) })),
    }),
    {
      name: 'scrollify.dm',
      storage: appStorage,
      version: 1,
      partialize: (s) => ({ enemies: s.enemies, encounter: s.encounter }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DmState>;
        const enemies: Record<string, Enemy> = {};
        for (const raw of Object.values(p.enemies ?? {})) {
          try {
            const e = sanitizeEnemy(raw);
            enemies[e.id] = e;
          } catch {
            // Not an object: nothing worth keeping.
          }
        }
        return { ...current, enemies, encounter: sanitizeEncounter(p.encounter) };
      },
    },
  ),
);
