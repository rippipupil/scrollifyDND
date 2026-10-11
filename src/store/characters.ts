import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character } from '../rules/types';
import { migrateCharacter } from './migrations';
import { appStorage } from './storage';

interface CharactersState {
  characters: Record<string, Character>;
  add: (c: Character) => void;
  update: (id: string, fn: (c: Character) => Character) => void;
  remove: (id: string) => void;
}

export const useCharacters = create<CharactersState>()(
  persist(
    (set) => ({
      characters: {},
      add: (c) => set((s) => ({ characters: { ...s.characters, [c.id]: c } })),
      update: (id, fn) =>
        set((s) => {
          const cur = s.characters[id];
          if (!cur) return s;
          return { characters: { ...s.characters, [id]: { ...fn(cur), updatedAt: Date.now() } } };
        }),
      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.characters;
          return { characters: rest };
        }),
    }),
    {
      name: 'scrollify.characters',
      storage: appStorage,
      version: 1,
      partialize: (s) => ({ characters: s.characters }),
      merge: (persisted, current) => {
        const stored = (persisted as Partial<CharactersState> | undefined)?.characters ?? {};
        const characters: Record<string, Character> = {};
        for (const [id, raw] of Object.entries(stored)) {
          try {
            characters[id] = migrateCharacter(raw);
          } catch {
            // Keep unreadable entries out of the UI rather than crashing the app.
          }
        }
        return { ...current, characters };
      },
    },
  ),
);
