import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../i18n';
import { appStorage } from './storage';

export type ThemePref = 'system' | 'light' | 'dark';

interface SettingsState {
  lang: Lang;
  theme: ThemePref;
  setLang: (l: Lang) => void;
  setTheme: (t: ThemePref) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: 'es',
      theme: 'system',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'scrollify.settings', storage: appStorage },
  ),
);
