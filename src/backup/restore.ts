import { useCharacters } from '../store/characters';
import { useDm } from '../store/dm';
import { useHomebrew } from '../store/homebrew';
import { useJournal } from '../store/journal';
import { useWikiUser } from '../store/wiki';
import { mergeById, type Backup } from './backup';

/** Takes everything from the stores into one backup. */
export function collectBackup(now = Date.now()): Backup {
  const wiki = useWikiUser.getState();
  const dm = useDm.getState();
  return {
    createdAt: now,
    characters: Object.values(useCharacters.getState().characters),
    enemies: Object.values(dm.enemies),
    encounter: dm.encounter,
    homebrew: useHomebrew.getState().entries,
    journal: Object.values(useJournal.getState().entries),
    wiki: { notes: wiki.notes, favorites: wiki.favorites },
  };
}

export interface RestoreResult {
  /** Items that were new on this device. */
  added: number;
  /** Items the backup had a newer copy of. */
  updated: number;
  /** Whether the saved combat was brought back (only when there is none running here). */
  encounter: boolean;
}

/** Merges a backup into the stores without losing anything newer on the device. */
export function restoreBackup(b: Backup): RestoreResult {
  const chars = mergeById(useCharacters.getState().characters, b.characters);
  useCharacters.setState({ characters: chars.merged });
  const dm = useDm.getState();
  const enemies = mergeById(dm.enemies, b.enemies);
  const encounter = !dm.encounter.combatants.length && b.encounter.combatants.length > 0;
  useDm.setState({ enemies: enemies.merged, ...(encounter ? { encounter: b.encounter } : {}) });
  const journal = mergeById(useJournal.getState().entries, b.journal);
  useJournal.setState({ entries: journal.merged });
  const homebrew = useHomebrew.getState().importMany(b.homebrew);
  useWikiUser.getState().restore(b.wiki);
  return {
    added: chars.added + enemies.added + journal.added + homebrew,
    updated: chars.updated + enemies.updated + journal.updated,
    encounter,
  };
}
