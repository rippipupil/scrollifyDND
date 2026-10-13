import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../i18n';
import type { UnitPref } from '../i18n/units';
import { appStorage } from './storage';

export type ThemePref = 'system' | 'light' | 'dark';

interface SettingsState {
  lang: Lang;
  theme: ThemePref;
  /** Distances: metres, feet, or whatever the language uses. */
  units: UnitPref;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemePref) => void;
  setUnits: (u: UnitPref) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'es',
      theme: 'system',
      units: 'auto',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setUnits: (units) => set({ units }),
    }),
    { name: 'scrollify.settings', storage: appStorage },
  ),
);
