import { newCharacter, SCHEMA_VERSION, uid } from '../rules/core';
import type { Character, CharacterClass, Feature, InventoryItem, KnownSpell, Resource } from '../rules/types';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Fills missing or wrong-typed keys of `value` from `defaults`, recursively for plain objects.
 * Numbers are coerced when possible; keys unknown to `defaults` are kept as they are.
 */
function fillDefaults<T>(defaults: T, value: unknown): T {
  if (value === undefined) return defaults;
  if (defaults === null) return value as T;
  if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T;
  if (isPlainObject(defaults)) {
    if (!isPlainObject(value)) return defaults;
    const out: Record<string, unknown> = { ...value };
    for (const [k, d] of Object.entries(defaults)) out[k] = fillDefaults(d, value[k]);
    return out as T;
  }
  if (typeof defaults === 'number') {
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return (Number.isFinite(n) ? n : defaults) as T;
  }
  return (typeof value === typeof defaults ? value : defaults) as T;
}

const loc = (v: unknown) => {
  const out = fillDefaults({ en: '' }, v);
  if ('es' in out && typeof out.es !== 'string') delete (out as { es?: unknown }).es;
  return out;
};

/** Keeps object items of an array, each filled from `defaults`, with Loc-typed `name` sanitized when asked. */
function cleanList<T extends object>(list: unknown, defaults: () => T, fix?: (item: T) => T): T[] {
  if (!Array.isArray(list)) return [];
  return list.filter(isPlainObject).map((x) => {
    const item = fillDefaults(defaults(), x);
    return fix ? fix(item) : item;
  });
}

function optionalNumber(obj: Record<string, unknown>, key: string) {
  if (key in obj && !(typeof obj[key] === 'number' && Number.isFinite(obj[key]))) delete obj[key];
}

/** Upgrades any stored/imported character JSON to the current schema. Throws on invalid input. */
export function migrateCharacter(raw: unknown): Character {
  if (!isPlainObject(raw)) throw new Error('Character must be an object');
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) throw new Error('Character was saved by a newer app version');
  const base = newCharacter();
  const c = fillDefaults(base, raw);
  if (!c.id) c.id = base.id;
  // A portrait is a data URI or file URI; anything else would break the image.
  if (c.portraitUri !== undefined && (typeof c.portraitUri !== 'string' || !/^(data:image\/|file:|https?:|blob:)/.test(c.portraitUri))) delete c.portraitUri;

  c.species = { ...c.species, name: loc(c.species.name) };
  if (c.species.subspecies !== undefined) c.species.subspecies = loc(c.species.subspecies);
  c.background = { ...c.background, name: loc(c.background.name) };

  c.classes = cleanList<CharacterClass>(
    c.classes,
    () => ({ classId: '', name: { en: '' }, level: 1, hitDie: 8, hitDiceUsed: 0, casterType: 'none' }),
    (k) => ({
      ...k,
      name: loc(k.name),
      ...(k.subclassName !== undefined ? { subclassName: loc(k.subclassName) } : {}),
      level: Math.max(1, Math.min(20, Math.floor(k.level))),
      hitDie: [6, 8, 10, 12].includes(k.hitDie) ? k.hitDie : 8,
      casterType: ['none', 'full', 'half', 'third', 'pact'].includes(k.casterType) ? k.casterType : 'none',
    }),
  );

  c.inventory = cleanList<InventoryItem>(
    c.inventory,
    () => ({ uid: uid('item'), name: { en: '' }, kind: 'other', qty: 1, weight: 0, equipped: false, attuned: false }),
    (i) => {
      const item = { ...i, name: loc(i.name) };
      if (item.armor !== undefined) {
        if (isPlainObject(item.armor)) item.armor = fillDefaults<NonNullable<InventoryItem['armor']>>({ type: 'light', base: 10 }, item.armor);
        else delete item.armor;
      }
      if (item.weapon !== undefined) {
        if (isPlainObject(item.weapon)) {
          item.weapon = fillDefaults<NonNullable<InventoryItem['weapon']>>({ damage: '1d4', damageType: '', properties: [], ranged: false, martial: false }, item.weapon);
          item.weapon.properties = item.weapon.properties.filter((p: unknown) => typeof p === 'string');
        } else delete item.weapon;
      }
      if (item.bonus !== undefined && !isPlainObject(item.bonus)) delete item.bonus;
      if (item.bonus) for (const k of ['attack', 'damage', 'ac']) optionalNumber(item.bonus as Record<string, unknown>, k);
      optionalNumber(item as Record<string, unknown>, 'shieldBonus');
      return item;
    },
  );

  const sc = c.spellcasting;
  sc.spells = cleanList<KnownSpell>(sc.spells, () => ({ uid: uid('spell'), name: { en: '' }, level: 0, prepared: false }), (s) => ({ ...s, name: loc(s.name) }));
  const used = Array.isArray(sc.slotsUsed) ? sc.slotsUsed : [];
  sc.slotsUsed = Array.from({ length: 9 }, (_, i) => Number(used[i]) || 0);
  if (typeof sc.concentratingOn !== 'string') sc.concentratingOn = null;

  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  c.conditions = strings(c.conditions);
  const p = c.proficiencies;
  p.saves = strings(p.saves) as typeof p.saves;
  p.armor = strings(p.armor);
  p.weapons = strings(p.weapons);
  p.tools = strings(p.tools);
  p.languages = strings(p.languages);

  c.resources = cleanList<Resource>(c.resources, () => ({ uid: uid('res'), name: '', max: 0, used: 0, recharge: 'long' }));
  c.features = cleanList<Feature>(c.features, () => ({ uid: uid('feat'), name: '', text: '' }));
  c.notes = cleanList(c.notes, () => ({ uid: uid('note'), date: 0, text: '' }));

  optionalNumber(c.hp as Record<string, unknown>, 'maxOverride');
  for (const k of ['ac', 'initiativeBonus', 'spellDcBonus', 'spellAttackBonus']) optionalNumber(c.overrides as Record<string, unknown>, k);

  c.schemaVersion = SCHEMA_VERSION;
  return c;
}
