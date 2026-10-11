import { useCallback } from 'react';
import type { Character } from '../../rules/types';
import { useCharacters } from '../../store/characters';

export function useCharacter(id: string | undefined) {
  const c = useCharacters((s) => (id ? s.characters[id] : undefined));
  const update = useCharacters((s) => s.update);
  const mutate = useCallback((fn: (c: Character) => Character) => id && update(id, fn), [id, update]);
  return { c, mutate };
}

export type Mutate = (fn: (c: Character) => Character) => void;
