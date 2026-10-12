import { t, type Lang } from '../i18n';

/** Distance in the reader's units: feet stay feet in English; Spanish uses metres (5 ft = 1,5 m) and km. */
function distance(amount: number, unit: string, lang: Lang): string {
  if (lang !== 'es') return `${amount} ${unit === 'miles' ? (amount === 1 ? 'mile' : 'miles') : 'feet'}`;
  const v = unit === 'miles' ? Math.round(amount * 15) / 10 : Math.round(amount * 3) / 10;
  return `${String(v).replace('.', ',')} ${unit === 'miles' ? 'km' : 'm'}`;
}

const unit = (u: string, n: number, lang: Lang) => t(lang, `spellUnits.${u}${n === 1 ? '' : 's'}`);

/** Human-readable facts of an indexed (non-SRD) spell. */
export function spellFacts(d: any, lang: Lang): { castingTime: string; range: string; components: string; duration: string } {
  const ct = d?.castingTime;
  const castingTime = ct ? `${ct.n} ${unit(ct.unit, ct.n, lang)}` : '';

  const r = d?.range;
  let range = '';
  if (r?.kind === 'feet' || r?.kind === 'miles') range = distance(r.amount, r.kind, lang);
  else if (r?.kind === 'self' && r.area) range = `${t(lang, 'spellUnits.self')} (${t(lang, 'spellUnits.areaOf', { shape: t(lang, `spellUnits.shape.${r.area.shape}`), size: distance(r.area.size, r.area.unit, lang) })})`;
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
