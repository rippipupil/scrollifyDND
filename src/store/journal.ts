import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { renameEntry, sanitizeEntry, type JournalEntry } from '../journal/journal';
import { uid } from '../rules/core';
import { appStorage } from './storage';

interface JournalState {
  entries: Record<string, JournalEntry>;
  save: (e: JournalEntry) => void;
  /** Renames a page and fixes the links that pointed to it. */
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  /** Adds pages from a backup; an id already in use gets a new one. Returns how many were added. */
  importMany: (list: unknown[]) => number;
}

export const useJournal = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: {},
      save: (e) => set((s) => ({ entries: { ...s.entries, [e.id]: { ...e, updatedAt: Date.now() } } })),
      rename: (id, title) => set((s) => ({ entries: renameEntry(s.entries, id, title) })),
      remove: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.entries;
          return { entries: rest };
        }),
      importMany: (list) => {
        const entries = { ...get().entries };
        let n = 0;
        for (const raw of list) {
          try {
            const e = sanitizeEntry(raw);
            const id = entries[e.id] ? uid('jrnl') : e.id;
            entries[id] = { ...e, id };
            n++;
          } catch {
            // Not a page: skip it.
          }
        }
        set({ entries });
        return n;
      },
    }),
    {
      name: 'scrollify.journal',
      storage: appStorage,
      version: 1,
      partialize: (s) => ({ entries: s.entries }),
      merge: (persisted, current) => {
        const entries: Record<string, JournalEntry> = {};
        for (const raw of Object.values((persisted as Partial<JournalState> | undefined)?.entries ?? {})) {
          try {
            const e = sanitizeEntry(raw);
            entries[e.id] = e;
          } catch {
            // Unreadable page: dropped.
          }
        }
        return { ...current, entries };
      },
    },
  ),
);
