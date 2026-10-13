import { t, type Lang } from '../i18n';
import { formatDistance, formatMiles, resolveUnit, type Unit } from '../i18n/units';

/** Distance in the reader's units (5 ft = 1,5 m; 1 mile = 1,5 km). */
function distance(amount: number, kind: string, lang: Lang, units: Unit): string {
  return kind === 'miles' ? formatMiles(amount, lang, units) : formatDistance(amount, lang, units);
}

const unit = (u: string, n: number, lang: Lang) => t(lang, `spellUnits.${u}${n === 1 ? '' : 's'}`);

/** Human-readable facts of an indexed (non-SRD) spell. */
export function spellFacts(d: any, lang: Lang, units: Unit = resolveUnit('auto', lang)): { castingTime: string; range: string; components: string; duration: string } {
  const ct = d?.castingTime;
  const castingTime = ct ? `${ct.n} ${unit(ct.unit, ct.n, lang)}` : '';

  const r = d?.range;
  let range = '';
  if (r?.kind === 'feet' || r?.kind === 'miles') range = distance(r.amount, r.kind, lang, units);
  else if (r?.kind === 'self' && r.area) range = `${t(lang, 'spellUnits.self')} (${t(lang, 'spellUnits.areaOf', { shape: t(lang, `spellUnits.shape.${r.area.shape}`), size: distance(r.area.size, r.area.unit, lang, units) })})`;
  else if (r?.kind) range = t(lang, `spellUnits.${r.kind}`);

  const c = d?.components;
  let components = '';
  if (c) {
    components = [c.v && 'V', c.s && 'S', c.m && 'M'].filter(Boolean).join(', ');
    if (c.costGp) components += ` (${c.costGp} ${t(lang, 'spellUnits.gp')}${c.consumed ? `, ${t(lang, 'spellUnits.consumed')}` : ''})`;
  }

  const du = d?.duration;
  let duration = '';
  if (du?.kind === 'timed') {
    const span = `${du.amount} ${unit(du.unit, du.amount, lang)}`;
    duration = du.concentration ? t(lang, 'spellUnits.concentrationUpTo', { span }) : span;
  } else if (du?.kind) duration = t(lang, `spellUnits.${du.kind}`);

  return { castingTime, range, components, duration };
}
