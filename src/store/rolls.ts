import { create } from 'zustand';
import { roll, type RollResult } from '../rules/dice';

export type RollMode = 'normal' | 'adv' | 'dis';

export interface RollEntry {
  id: number;
  label: string;
  result: Extract<RollResult, { ok: true }>;
  mode: RollMode;
  ts: number;
}

interface RollsState {
  history: RollEntry[];
  last: RollEntry | null;
  mode: RollMode;
  setMode: (m: RollMode) => void;
  roll: (label: string, expr: string, mode?: RollMode) => RollEntry | null;
  /** Records a roll made elsewhere (e.g. a full attack) in the history and the toast. */
  push: (label: string, result: RollEntry['result'], mode?: RollMode) => void;
  /** Last target AC typed in a full attack, to prefill the next one. */
  targetAc?: number;
  setTargetAc: (ac: number | undefined) => void;
  dismiss: () => void;
  clear: () => void;
}

let counter = 0;

export const useRolls = create<RollsState>()((set, get) => ({
  history: [],
  last: null,
  mode: 'normal',
  setMode: (mode) => set({ mode }),
  roll: (label, expr, modeOverride) => {
    const mode = modeOverride ?? get().mode;
    const r = roll(expr, { adv: mode === 'adv', dis: mode === 'dis' });
    if (!r.ok) return null;
    const entry: RollEntry = { id: ++counter, label, result: r, mode, ts: Date.now() };
    set((s) => ({ history: [entry, ...s.history].slice(0, 100), last: entry, mode: modeOverride ? s.mode : 'normal' }));
    return entry;
  },
  push: (label, result, mode = 'normal') => {
    const entry: RollEntry = { id: ++counter, label, result, mode, ts: Date.now() };
    set((s) => ({ history: [entry, ...s.history].slice(0, 100), last: entry }));
  },
  setTargetAc: (targetAc) => set({ targetAc }),
  dismiss: () => set({ last: null }),
  clear: () => set({ history: [], last: null }),
}));

/** "1d20+5" style expression for a d20 test with a bonus. */
export function d20(bonus: number): string {
  return bonus === 0 ? '1d20' : `1d20${bonus > 0 ? '+' : ''}${bonus}`;
}
