import type { ContentEntry } from '../content/types';

/** One number of a class that grows with level, with the levels where it changes. */
export interface ScalingRow {
  key: string;
  /** 'distance' values are feet, shown in the reader's units. */
  kind: 'plain' | 'distance';
  steps: { level: number; value: string | number }[];
}

function format(key: string, v: any): string | number | undefined {
  if (v === undefined || v === null) return undefined;
  if (key === 'sneak_attack') return v.dice_count ? `${v.dice_count}d${v.dice_value}` : undefined;
  if (typeof v === 'object') return undefined;
  if (!v) return undefined;
  if (key.endsWith('_die')) return `d${v}`;
  if (key === 'rage_damage_bonus') return `+${v}`;
  return v;
}

function steps(levels: any[], pick: (l: any) => string | number | undefined) {
  const out: ScalingRow['steps'] = [];
  for (const l of levels) {
    const v = pick(l);
    if (v === undefined) continue;
    if (!out.length || out[out.length - 1].value !== v) out.push({ level: l.level, value: v });
  }
  return out;
}

/** Highest spell level a class can cast at each class level (0 = none). */
const maxSpellLevel = (l: any) => {
  const slots: number[] = l.slots ?? [];
  for (let i = slots.length - 1; i >= 0; i--) if (slots[i] > 0) return i + 1;
  return undefined;
};

/** How the class's numbers grow: its own columns (Rage, Sneak Attack…), proficiency bonus and spellcasting. */
export function classScaling(levels: any[]): ScalingRow[] {
  const keys = [...new Set(levels.flatMap((l) => Object.keys(l.classSpecific ?? {})))];
  const rows: ScalingRow[] = keys
    .map((key) => ({ key, kind: (key === 'unarmored_movement_bonus' ? 'distance' : 'plain') as ScalingRow['kind'], steps: steps(levels, (l) => format(key, l.classSpecific?.[key])) }))
    .filter((r) => r.steps.length);
  const extra: ScalingRow[] = [
    { key: 'maxSpellLevel', kind: 'plain', steps: steps(levels, maxSpellLevel) },
    { key: 'cantrips', kind: 'plain', steps: steps(levels, (l) => l.cantrips || undefined) },
    { key: 'prepared', kind: 'plain', steps: steps(levels, (l) => l.prepared || undefined) },
    { key: 'prof', kind: 'plain', steps: steps(levels, (l) => (l.prof ? `+${l.prof}` : undefined)) },
  ];
  return [...rows, ...extra.filter((r) => r.steps.length)];
}

/** Levels where a class's subclass gives features (from its SRD subclass, e.g. 3, 6, 10, 14). */
export function subclassLevels(subclasses: ContentEntry[]): number[] {
  const srd = subclasses.find((s) => s.source === 'srd' && Array.isArray(s.data?.features));
  return srd ? [...new Set<number>(srd.data.features.map((f: any) => f.level))].sort((a, b) => a - b) : [];
}

/** All subclasses of a class (SRD, homebrew and indexed), 2024 options first, then by name. */
export function subclassesOf(classId: string, all: ContentEntry[], name: (e: ContentEntry) => string): ContentEntry[] {
  const id = classId.replace(/^ext-class-/, '');
  const era = (e: ContentEntry) => (e.data?.era === '2014' ? 1 : 0);
  return all.filter((s) => s.category === 'subclass' && s.data?.classId === id).sort((a, b) => era(a) - era(b) || name(a).localeCompare(name(b)));
}
