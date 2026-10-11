import type { Loc } from '../rules/types';
import { en } from './en';
import { es } from './es';
import type { Dict, Lang } from './types';

export type { Lang };

const dicts: Record<Lang, Dict> = { es, en };

function lookup(d: Dict, key: string): string | undefined {
  let cur: string | Dict | undefined = d;
  for (const part of key.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(dicts[lang], key) ?? lookup(dicts.en, key) ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : raw;
}

export function loc(l: Loc | undefined, lang: Lang): string {
  if (!l) return '';
  return (lang === 'es' && l.es) || l.en;
}

/** True when Spanish was requested but only English text exists. */
export function isFallback(l: Loc | undefined, lang: Lang): boolean {
  return !!l && lang === 'es' && !l.es && !!l.en;
}
