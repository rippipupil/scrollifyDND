import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character } from '../rules/types';
import { migrateCharacter } from './migrations';
import { appStorage } from './storage';

export const BACKUP_KEY = 'scrollify.characters.backup';

/** Migrates stored entries, separating the ones that cannot be read. */
function splitStored(stored: Record<string, unknown>) {
  const characters: Record<string, Character> = {};
  const failed: Record<string, unknown> = {};
  for (const [id, raw] of Object.entries(stored)) {
    try {
      characters[id] = migrateCharacter(raw);
    } catch {
      failed[id] = raw;
    }
  }
  return { characters, failed };
}

/** Saves unreadable entries under BACKUP_KEY (merged with earlier backups) so they are never lost. */
async function backupUnreadable(failed: Record<string, unknown>) {
  if (!Object.keys(failed).length) return;
  try {
    const prev = JSON.parse((await AsyncStorage.getItem(BACKUP_KEY)) ?? '{}');
    await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify({ ...prev, ...failed }));
  } catch {
    // Best effort; the readable characters still load.
  }
}

export async function loadStoredCharacters(stored: Record<string, unknown>): Promise<Record<string, Character>> {
  const { characters, failed } = splitStored(stored);
  await backupUnreadable(failed);
  return characters;
}

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
        const { characters, failed } = splitStored(stored);
        void backupUnreadable(failed);
        return { ...current, characters };
      },
    },
  ),
);
