import type { Loc } from '../rules/types';

export type Category =
  | 'spell'
  | 'equipment'
  | 'magic-item'
  | 'class'
  | 'subclass'
  | 'species'
  | 'background'
  | 'feat'
  | 'condition'
  | 'rule'
  | 'monster'
  | 'feature'
  | 'mastery'
  | 'weapon-property';

export type Source = 'srd' | 'homebrew' | 'external';

export interface ExternalLinks {
  aidedd?: string;
  aideddEs?: string;
  wikidot?: string;
  nivel20?: string;
}

export interface SpellData {
  level: number;
  school: string;
  classes: string[];
  castingTime: Loc;
  range: Loc;
  components: string[];
  material?: Loc;
  duration: Loc;
  concentration: boolean;
  ritual: boolean;
  higherLevel?: Loc;
}

export interface ContentEntry {
  id: string;
  category: Category;
  name: Loc;
  /** Markdown-lite body text. Missing for external index entries. */
  text?: Loc;
  source: Source;
  /** Category-specific structured data (SpellData for spells, etc.). */
  data?: any;
  external?: ExternalLinks;
  /** Book/source label shown for external entries, e.g. "PHB 2024". */
  book?: string;
}
