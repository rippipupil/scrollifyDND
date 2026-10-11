import { armorClass, carriedWeight, carryingCapacity, weaponAttacks } from '../combat';
import { newCharacter } from '../core';
import type { InventoryItem } from '../types';
import { angvel } from './fixtures';

const item = (p: Partial<InventoryItem>): InventoryItem => ({
  uid: Math.random().toString(),
  name: { en: 'x' },
  kind: 'gear',
  qty: 1,
  weight: 0,
  equipped: true,
  attuned: false,
  ...p,
});
const chainMail = item({ kind: 'armor', name: { en: 'Chain Mail' }, weight: 55, armor: { type: 'heavy', base: 16 } });
const halfPlate = item({ kind: 'armor', armor: { type: 'medium', base: 15 } });
const leather = item({ kind: 'armor', armor: { type: 'light', base: 11 } });
const shield = item({ kind: 'shield', shieldBonus: 2, weight: 6 });
const longsword = item({
  kind: 'weapon',
  name: { en: 'Longsword' },
  weapon: { damage: '1d8', damageType: 'slashing', properties: ['versatile'], versatileDamage: '1d10', ranged: false, martial: true, mastery: 'sap' },
});
const dagger = item({
  kind: 'weapon',
  name: { en: 'Dagger' },
  weapon: { damage: '1d4', damageType: 'piercing', properties: ['finesse', 'light', 'thrown'], ranged: false, martial: false, mastery: 'nick' },
});

describe('armorClass', () => {
  test('unarmored DEX 10 -> 10', () => expect(armorClass(angvel())).toBe(10));
  test('Mage Armor -> 13 + DEX', () => {
    const c = angvel();
    c.abilities.dex = 14;
    c.effects.mageArmor = true;
    expect(armorClass(c)).toBe(15);
  });
  test('chain mail 16, with shield 18', () => {
    const c = angvel();
    c.inventory = [chainMail];
    expect(armorClass(c)).toBe(16);
    c.inventory = [chainMail, shield];
    expect(armorClass(c)).toBe(18);
  });
  test('half plate with DEX 18 -> 17 (DEX capped at +2)', () => {
    const c = angvel();
    c.abilities.dex = 18;
    c.inventory = [halfPlate];
    expect(armorClass(c)).toBe(17);
  });
  test('light armor adds full DEX', () => {
    const c = angvel();
    c.abilities.dex = 18;
    c.inventory = [leather];
    expect(armorClass(c)).toBe(15);
  });
  test('unequipped armor is ignored', () => {
    const c = angvel();
    c.inventory = [{ ...chainMail, equipped: false }];
    expect(armorClass(c)).toBe(10);
  });
  test('Barbarian unarmored defense 10 + DEX + CON', () => {
    const c = newCharacter({
      classes: [{ classId: 'barbarian', name: { en: 'Barbarian' }, level: 1, hitDie: 12, hitDiceUsed: 0, casterType: 'none' }],
      abilities: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 10 },
    });
    expect(armorClass(c)).toBe(15);
  });
  test('Monk unarmored defense lost with a shield', () => {
    const c = newCharacter({
      classes: [{ classId: 'monk', name: { en: 'Monk' }, level: 1, hitDie: 8, hitDiceUsed: 0, casterType: 'none' }],
      abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 16, cha: 10 },
    });
    expect(armorClass(c)).toBe(16);
    c.inventory = [shield];
    expect(armorClass(c)).toBe(15);
  });
  test('magic armor bonus adds', () => {
    const c = angvel();
    c.inventory = [{ ...chainMail, bonus: { ac: 1 } }];
    expect(armorClass(c)).toBe(17);
  });
  test('override replaces computed AC', () => {
    const c = angvel();
    c.overrides.ac = 21;
    expect(armorClass(c)).toBe(21);
  });
});

describe('weaponAttacks', () => {
  test('longsword STR 16 proficient -> +5, 1d8+3', () => {
    const c = angvel();
    c.abilities.str = 16;
    c.proficiencies.weapons = ['simple', 'martial'];
    c.inventory = [longsword];
    const [a] = weaponAttacks(c);
    expect(a.toHit).toBe(5);
    expect(a.damage).toBe('1d8+3');
    expect(a.versatileDamage).toBe('1d10+3');
    expect(a.damageType).toBe('slashing');
    expect(a.mastery).toBe('sap');
  });
  test('non-proficient weapon has no proficiency bonus', () => {
    const c = angvel();
    c.inventory = [longsword];
    expect(weaponAttacks(c)[0].toHit).toBe(1);
  });
  test('finesse uses the higher of STR and DEX', () => {
    const c = angvel();
    c.abilities.dex = 18;
    c.inventory = [dagger];
    const [a] = weaponAttacks(c);
    expect(a.toHit).toBe(6);
    expect(a.damage).toBe('1d4+4');
  });
  test('negative modifier formats as minus', () => {
    const c = angvel();
    c.abilities.str = 8;
    c.proficiencies.weapons = [];
    c.inventory = [longsword];
    expect(weaponAttacks(c)[0].damage).toBe('1d8-1');
  });
  test('always includes Unarmed Strike last', () => {
    const c = angvel();
    const atks = weaponAttacks(c);
    const u = atks[atks.length - 1];
    expect(u.id).toBe('unarmed-strike');
    expect(u.toHit).toBe(3);
    expect(u.damage).toBe('2');
  });
});

describe('carrying', () => {
  test('capacity STR 12 -> 180 lb', () => expect(carryingCapacity(angvel())).toBe(180));
  test('carried weight sums qty × weight plus coins (50 per lb)', () => {
    const c = angvel();
    c.inventory = [chainMail, { ...shield, qty: 2 }];
    c.currency.gp = 100;
    expect(carriedWeight(c)).toBe(55 + 12 + 2);
  });
});
