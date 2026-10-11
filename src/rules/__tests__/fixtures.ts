import { newCharacter } from '../core';
import type { Character, CharacterClass } from '../types';

export function wizardClass(level: number): CharacterClass {
  return {
    classId: 'wizard',
    name: { en: 'Wizard', es: 'Mago' },
    level,
    hitDie: 6,
    hitDiceUsed: 0,
    casterType: 'full',
    spellAbility: 'int',
  };
}

/** Angvel, from the reference paper sheet: Wizard 4, Aasimar. */
export function angvel(): Character {
  return newCharacter({
    name: 'Angvel',
    player: 'Pablo',
    classes: [wizardClass(4)],
    abilities: { str: 12, dex: 10, con: 14, int: 16, wis: 13, cha: 19 },
    proficiencies: {
      saves: ['int', 'wis'],
      skills: { arcana: 'prof', insight: 'prof' },
      armor: [],
      weapons: ['simple'],
      tools: [],
      languages: ['common'],
    },
  });
}
