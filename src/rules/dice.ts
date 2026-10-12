export type DiceTerm = { sign: 1 | -1; count: number; sides: number } | { sign: 1 | -1; value: number };

export type ParseResult = { ok: true; terms: DiceTerm[] } | { ok: false; error: string };

const MAX_COUNT = 100;
const MAX_SIDES = 1000;

export function parseDice(expr: string): ParseResult {
  const s = expr.replace(/\s+/g, '').toLowerCase().replace(/d%/g, 'd100');
  if (!s) return { ok: false, error: 'empty' };
  const re = /([+-]?)(?:(\d*)d(\d+)|(\d+))/y;
  const terms: DiceTerm[] = [];
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m || (pos > 0 && !m[1])) return { ok: false, error: 'syntax' };
    const sign = m[1] === '-' ? -1 : 1;
    if (m[3] !== undefined) {
      const count = m[2] === '' ? 1 : Number(m[2]);
      const sides = Number(m[3]);
      if (count < 1 || count > MAX_COUNT || sides < 1 || sides > MAX_SIDES) return { ok: false, error: 'range' };
      terms.push({ sign, count, sides });
    } else {
      terms.push({ sign, value: Number(m[4]) });
    }
    pos = re.lastIndex;
  }
  return { ok: true, terms };
}

export interface RollPart {
  term: string;
  sign: 1 | -1;
  rolls: number[];
  kept: number[];
}

export type RollResult =
  | { ok: true; expr: string; total: number; parts: RollPart[]; modifier: number; natural?: number }
  | { ok: false; expr: string; error: string };

export interface RollOptions {
  adv?: boolean;
  dis?: boolean;
  /** Returns a face in [1, sides]. Injectable for tests. */
  die?: (sides: number) => number;
}

const randomDie = (sides: number) => Math.floor(Math.random() * sides) + 1;

export function roll(expr: string, opts: RollOptions = {}): RollResult {
  const parsed = parseDice(expr);
  if (!parsed.ok) return { ok: false, expr, error: parsed.error };
  const die = opts.die ?? randomDie;
  const mode = opts.adv && !opts.dis ? 'adv' : opts.dis && !opts.adv ? 'dis' : 'normal';
  const d20Terms = parsed.terms.filter((t) => 'sides' in t && t.sides === 20 && t.count === 1);

  let total = 0;
  let modifier = 0;
  const parts: RollPart[] = [];
  for (const t of parsed.terms) {
    if ('value' in t) {
      modifier += t.sign * t.value;
      continue;
    }
    const isAdvTerm = mode !== 'normal' && d20Terms.length === 1 && t === d20Terms[0];
    const rolls = Array.from({ length: isAdvTerm ? 2 : t.count }, () => die(t.sides));
    const kept = isAdvTerm ? [mode === 'adv' ? Math.max(...rolls) : Math.min(...rolls)] : rolls;
    total += t.sign * kept.reduce((a, b) => a + b, 0);
    parts.push({ term: `${t.count}d${t.sides}`, sign: t.sign, rolls, kept });
  }
  total += modifier;
  const natural = d20Terms.length === 1 ? parts.find((p) => p.term === '1d20')?.kept[0] : undefined;
  return { ok: true, expr, total, parts, modifier, natural };
}

export interface RolledDie {
  sides: number;
  value: number;
  /** Rolled but not counted (the other d20 with advantage/disadvantage). */
  dropped: boolean;
}

/** Every physical die of a roll, in order, for drawing them. */
export function rolledDice(r: RollResult): RolledDie[] {
  if (!r.ok) return [];
  return r.parts.flatMap((p) => {
    const sides = Number(/d(\d+)/i.exec(p.term)?.[1]);
    if (!sides) return [];
    const kept = [...p.kept];
    return p.rolls.map((value) => {
      const i = kept.indexOf(value);
      if (i >= 0) kept.splice(i, 1);
      return { sides, value, dropped: i < 0 };
    });
  });
}
