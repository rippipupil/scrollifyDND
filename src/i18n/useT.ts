import { useCallback } from 'react';
import { useSettings } from '../store/settings';
import { loc as locFn, t as tFn } from '.';
import type { Loc } from '../rules/types';

export function useT() {
  const lang = useSettings((s) => s.lang);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => tFn(lang, key, vars), [lang]);
  const loc = useCallback((l: Loc | undefined) => locFn(l, lang), [lang]);
  return { t, loc, lang };
}
