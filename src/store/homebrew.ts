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
        const byId = new Map(get().entries.map((e) => [e.id, e]));
        for (const e of list) byId.set(e.id, { ...e, source: 'homebrew' });
        set({ entries: [...byId.values()] });
        return list.length;
      },
    }),
    { name: 'scrollify.homebrew', storage: appStorage },
  ),
);
