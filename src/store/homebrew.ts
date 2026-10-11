import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentEntry } from '../content/types';
import { appStorage } from './storage';

interface HomebrewState {
  entries: ContentEntry[];
  upsert: (e: ContentEntry) => void;
  remove: (id: string) => void;
  importMany: (list: ContentEntry[]) => number;
}

export const useHomebrew = create<HomebrewState>()(
  persist(
    (set, get) => ({
      entries: [],
      upsert: (e) => set((s) => ({ entries: [...s.entries.filter((x) => x.id !== e.id), { ...e, source: 'homebrew' }] })),
      remove: (id) => set((s) => ({ entries: s.entries.filter((x) => x.id !== id) })),
      importMany: (list) => {
        const entries = [...get().entries];
        const same = (a: ContentEntry, b: ContentEntry) => JSON.stringify({ ...a, source: 'homebrew' }) === JSON.stringify({ ...b, source: 'homebrew' });
        let added = 0;
        for (const e of list) {
          const clash = entries.find((x) => x.id === e.id);
          if (clash && same(clash, e)) continue;
          if (!clash) {
            entries.push({ ...e, source: 'homebrew' });
          } else {
            // Never overwrite local edits: import the pack's version as a numbered copy.
            let n = 2;
            while (entries.some((x) => x.id === `${e.id}-${n}`)) n++;
            const suffix = ` (${n})`;
            const name = { ...e.name, en: e.name.en + suffix, ...(e.name.es ? { es: e.name.es + suffix } : {}) };
            entries.push({ ...e, id: `${e.id}-${n}`, name, source: 'homebrew' });
          }
          added++;
        }
        set({ entries });
        return added;
      },
    }),
    { name: 'scrollify.homebrew', storage: appStorage },
  ),
);
