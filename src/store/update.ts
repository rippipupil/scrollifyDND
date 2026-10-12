import { create } from 'zustand';
import { currentBuild, fetchManifest } from '../update/updater';
import { isNewer, type UpdateManifest } from '../update/version';

interface UpdateState {
  available: UpdateManifest | null;
  /** Version the user postponed during this session; asked again on the next launch. */
  postponed: number | null;
  checking: boolean;
  lastResult: 'none' | 'upToDate' | 'available' | 'offline';
  check: () => Promise<void>;
  postpone: () => void;
}

export const useUpdate = create<UpdateState>()((set, get) => ({
  available: null,
  postponed: null,
  checking: false,
  lastResult: 'none',
  check: async () => {
    if (get().checking) return;
    set({ checking: true });
    const m = await fetchManifest();
    set({
      checking: false,
      available: isNewer(currentBuild(), m) ? m : null,
      lastResult: m === null ? 'offline' : isNewer(currentBuild(), m) ? 'available' : 'upToDate',
      postponed: null,
    });
  },
  postpone: () => set((s) => ({ postponed: s.available?.versionCode ?? null })),
}));
