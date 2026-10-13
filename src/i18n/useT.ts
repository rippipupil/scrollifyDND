import { useCallback } from 'react';
import { useSettings } from '../store/settings';
import { loc as locFn, t as tFn } from '.';
import { convertDistances, formatDistance, formatMiles, resolveUnit } from './units';
import type { Loc } from '../rules/types';

export function useT() {
  const lang = useSettings((s) => s.lang);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => tFn(lang, key, vars), [lang]);
  const loc = useCallback((l: Loc | undefined) => locFn(l, lang), [lang]);
  const unit = resolveUnit(useSettings((s) => s.units), lang);
  /** A distance in feet, in the reader's units. */
  const dist = useCallback((ft: number) => formatDistance(ft, lang, unit), [lang, unit]);
  const miles = useCallback((mi: number) => formatMiles(mi, lang, unit), [lang, unit]);
  /** Rewrites the distances inside a text into the reader's units. */
  const conv = useCallback((text: string) => convertDistances(text, lang, unit), [lang, unit]);
  return { t, loc, lang, unit, dist, miles, conv };
}
