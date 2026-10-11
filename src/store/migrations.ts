import { newCharacter, SCHEMA_VERSION } from '../rules/core';
import type { Character } from '../rules/types';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Fills missing keys of `value` from `defaults`, recursively for plain objects. */
function fillDefaults<T>(defaults: T, value: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(value)) return (value === undefined ? defaults : value) as T;
  const out: Record<string, unknown> = { ...value };
  for (const [k, d] of Object.entries(defaults)) {
    out[k] = k in value ? fillDefaults(d, value[k]) : d;
  }
  return out as T;
}

/** Upgrades any stored/imported character JSON to the current schema. Throws on invalid input. */
export function migrateCharacter(raw: unknown): Character {
  if (!isPlainObject(raw)) throw new Error('Character must be an object');
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) throw new Error('Character was saved by a newer app version');
  const base = newCharacter();
  const c = fillDefaults(base, raw);
  if (typeof c.id !== 'string' || !c.id) c.id = base.id;
  const used = Array.isArray(c.spellcasting.slotsUsed) ? c.spellcasting.slotsUsed : [];
  c.spellcasting.slotsUsed = Array.from({ length: 9 }, (_, i) => Number(used[i]) || 0);
  for (const key of ['classes', 'inventory', 'conditions', 'resources', 'features', 'notes'] as const) {
    if (!Array.isArray(c[key])) (c as any)[key] = [];
  }
  c.schemaVersion = SCHEMA_VERSION;
  return c;
}
