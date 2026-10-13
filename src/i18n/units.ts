import type { Lang } from '.';

/** Units for distances: metres (Spanish books: 5 ft = 1,5 m, 1 mile = 1,5 km) or feet. */
export type Unit = 'm' | 'ft';
/** The user's choice; 'auto' follows the language (metres in Spanish, feet in English). */
export type UnitPref = 'auto' | Unit;

export const resolveUnit = (pref: UnitPref | undefined, lang: Lang): Unit => (pref === 'm' || pref === 'ft' ? pref : lang === 'es' ? 'm' : 'ft');

const round1 = (n: number) => Math.round(n * 10) / 10;
/** A number in the reader's language: decimal comma in Spanish. */
const num = (n: number, lang: Lang) => (lang === 'es' ? String(n).replace('.', ',') : String(n));
const ftToM = (ft: number) => round1(ft * 0.3);
const mToFt = (m: number) => Math.round(m / 0.3);
const miToKm = (mi: number) => round1(mi * 1.5);
const kmToMi = (km: number) => round1(km / 1.5);

/** A distance given in feet, in the reader's units ("9 m", "30 pies", "30 ft"). */
export function formatDistance(ft: number, lang: Lang, unit: Unit): string {
  if (unit === 'm') return `${num(ftToM(ft), lang)} m`;
  return lang === 'es' ? `${ft} pies` : `${ft} ft`;
}

/** A distance given in miles ("1,5 km", "1 milla", "3 miles"). */
export function formatMiles(mi: number, lang: Lang, unit: Unit): string {
  if (unit === 'm') return `${num(miToKm(mi), lang)} km`;
  if (lang === 'es') return `${mi} ${mi === 1 ? 'milla' : 'millas'}`;
  return `${mi} ${mi === 1 ? 'mile' : 'miles'}`;
}

const parseEn = (s: string) => Number(s.replace(/,/g, ''));
const parseEs = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));
const LETTER = 'A-Za-zÀ-ÿ';

/**
 * Rewrites the distances inside a rules text into the reader's units, whatever language the text is in
 * (an English text shown as fallback in Spanish, or a Spanish text read in feet).
 */
export function convertDistances(text: string, lang: Lang, unit: Unit): string {
  if (!text) return text;
  const feetOut = (ft: number) => (lang === 'es' ? `${ft} pies` : `${ft} ft`);
  const milesOut = (mi: number) => formatMiles(mi, lang, 'ft');
  if (unit === 'm') {
    return (
      text
        // "80/320 ft." → "24/96 m."
        .replace(/(\d+)\/(\d+) ?(?:feet|ft)\b/g, (_, a, b) => `${num(ftToM(+a), lang)}/${num(ftToM(+b), lang)} m`)
        // "30-foot Cone" → "9-meter Cone" in English; "9 m" otherwise.
        .replace(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(-| | )?(feet|foot|ft)\b/g, (_, n, sep, word) => {
          const m = num(ftToM(parseEn(n)), lang);
          return sep === '-' && word === 'foot' && lang === 'en' ? `${m}-meter` : `${m} m`;
        })
        .replace(/(\d+(?:\.\d+)?)[ -]?(miles?)\b/g, (_, n) => `${num(miToKm(parseEn(n)), lang)} km`)
        .replace(new RegExp(`(\\d+(?:,\\d+)?) ?(pies|pie)(?![${LETTER}])`, 'g'), (_, n) => `${num(ftToM(parseEs(n)), lang)} m`)
        .replace(new RegExp(`(\\d+(?:,\\d+)?) ?(millas|milla)(?![${LETTER}])`, 'g'), (_, n) => `${num(miToKm(parseEs(n)), lang)} km`)
        // "30 ft., fly 60 ft." → "9 m, fly 18 m": the abbreviation's dot goes unless it ends the sentence.
        .replace(/(\d) m\.(?=[,;:)]| [a-z])/g, '$1 m')
    );
  }
  // Metres are written by the Spanish texts (decimal comma) and by the user (either comma or point).
  const dec = (n: string) => (n.includes(',') ? parseEs(n) : Number(n));
  return text
    .replace(/(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?) ?m(?![A-Za-zÀ-ÿ²³])/g, (_, a, b) => `${mToFt(dec(a))}/${mToFt(dec(b))} ${lang === 'es' ? 'pies' : 'ft'}`)
    .replace(new RegExp(`(\\d+(?:[.,]\\d+)?) ?(metros|metro|meters|meter|m)(?![${LETTER}²³])`, 'g'), (_, n) => feetOut(mToFt(dec(n))))
    .replace(new RegExp(`(\\d+(?:[.,]\\d+)?) ?(kilómetros|kilómetro|km)(?![${LETTER}])`, 'g'), (_, n) => milesOut(kmToMi(dec(n))));
}
