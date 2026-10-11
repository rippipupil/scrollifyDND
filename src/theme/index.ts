import { useColorScheme } from 'react-native';
import { useSettings } from '../store/settings';

export interface Palette {
  mode: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  warning: string;
  hp: string;
  temp: string;
  chip: string;
  overlay: string;
}

/** Light: parchment & ink. */
export const parchment: Palette = {
  mode: 'light',
  bg: '#efe4cc',
  surface: '#f8f0dc',
  surfaceAlt: '#e6d6b4',
  border: '#b89b6e',
  text: '#2b1d10',
  textMuted: '#6e5a42',
  accent: '#8c1c13',
  accentText: '#fff8ec',
  danger: '#a3241a',
  success: '#2f6b2f',
  warning: '#9a6a00',
  hp: '#a3241a',
  temp: '#2a5d8f',
  chip: '#e9dcc0',
  overlay: 'rgba(43,29,16,0.45)',
};

/** Dark: modern slate with crimson accent. */
export const modern: Palette = {
  mode: 'dark',
  bg: '#111317',
  surface: '#1b1e24',
  surfaceAlt: '#252932',
  border: '#343a46',
  text: '#eceff4',
  textMuted: '#9aa3b2',
  accent: '#e0464e',
  accentText: '#ffffff',
  danger: '#ff5c5c',
  success: '#4cc38a',
  warning: '#f0b429',
  hp: '#ff5c5c',
  temp: '#5aa9ff',
  chip: '#2a2f39',
  overlay: 'rgba(0,0,0,0.6)',
};

export function useTheme(): Palette {
  const pref = useSettings((s) => s.theme);
  const system = useColorScheme();
  const mode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return mode === 'dark' ? modern : parchment;
}

export const fonts = {
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15 },
  small: { fontSize: 12 },
};
