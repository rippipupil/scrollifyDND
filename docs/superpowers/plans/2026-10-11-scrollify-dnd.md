# ScrollifyDND Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo app (Android APK) with functional D&D 2024 character sheets and a bilingual SRD wiki.

**Architecture:** Pure TypeScript rules engine (`src/rules`) consumed by React Native screens (Expo Router tabs). Wiki content is precompiled JSON in `assets/data` searched in memory. Characters and homebrew persist via Zustand + AsyncStorage.

**Tech Stack:** Expo SDK 57, TypeScript, Expo Router, Zustand, AsyncStorage, Jest (jest-expo), react-native-webview, expo-sharing / expo-file-system / expo-document-picker / expo-clipboard / expo-camera, react-native-qrcode-svg, GitHub Actions (Gradle APK).

**Spec:** `docs/superpowers/specs/2026-10-11-scrollify-dnd-design.md`

## Global Constraints

- Rules 2024 (SRD 5.2). Proficiency by total level: 1–4 +2, 5–8 +3, 9–12 +4, 13–16 +5, 17–20 +6.
- Spell save DC = 8 + prof + mod; spell attack = prof + mod.
- Exhaustion 2024: −2 × level to every d20 test; level 6 = death.
- All UI strings through `t()`; content fields `{ en: string; es?: string }`; missing `es` shows English + "EN" badge.
- No copyrighted non-SRD text in the bundle; external index holds facts + links only.
- Every persisted document carries `schemaVersion`.
- Works offline except external links.

## Review Focus

1. Damage larger than temp HP + current HP (spill over, massive-damage death when remainder ≥ max HP) → test in Task 4.
2. Importing malformed / old-version / foreign JSON must not corrupt existing data → test in Task 9.
3. Multiclass Warlock + full caster: pact slots separate from combined table → test in Task 3.
4. Search with accents, case and mixed ES/EN ("proyectil magico", "Magic missile") → test in Task 5.
5. Empty / non-numeric / negative input in numeric fields (HP, scores) → clamp helpers tested in Task 2.

---

### Task 1: Scaffold + CI

**Files:** `package.json`, `app.json`, `tsconfig.json`, `jest.config.js`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `.github/workflows/ci.yml`, `README.md`

- [ ] Create Expo app (`create-expo-app` blank-typescript), add Expo Router with tabs: `characters`, `wiki`, `dice`, `settings`.
- [ ] Add jest-expo; `npm test` runs `jest`. `npx tsc --noEmit` passes.
- [ ] CI: job `test` (npm ci, tsc, jest); job `android` (needs test): `npx expo prebuild -p android`, `./gradlew assembleRelease` (debug-signed), upload `app-release.apk` artifact.
- [ ] Commit.

### Task 2: Rules core — abilities, proficiency, saves, skills

**Files:** `src/rules/types.ts`, `src/rules/core.ts`, `src/rules/num.ts`, tests `src/rules/__tests__/core.test.ts`

**Produces:** `Character` type (spec model), `abilityMod(score)`, `totalLevel(c)`, `profBonus(level)`, `saveBonus(c, ab)`, `skillBonus(c, skillId)`, `passive(c, skillId)`, `initiative(c)`, `d20Penalty(c)` (exhaustion), `clampInt(v, min, max, fallback)`, `SKILLS` table (id → ability), `newCharacter(partial)`.

- [ ] Tests: `abilityMod(16)===3`, `abilityMod(19)===4`, `abilityMod(1)===-5`; `profBonus(4)===2`, `profBonus(5)===3`, `profBonus(17)===6`; Angvel (INT 16, prof INT/WIS saves, Arcana+Insight): INT save +5, Arcana +5, Insight +3, passive Perception 11, initiative +0; expertise doubles prof; exhaustion 2 → −4 on saves/skills; `clampInt('', 0, 30, 10)===10`, `clampInt('-5',0,30,10)===0`, `clampInt('abc',…,7)===7`.
- [ ] Implement, pass, commit.

### Task 3: Rules — AC, attacks, spellcasting, slots, carrying

**Files:** `src/rules/combat.ts`, `src/rules/spellcasting.ts`, tests alongside.

**Consumes:** Task 2. **Produces:** `armorClass(c, items)`, `weaponAttacks(c, items)` → `{name, toHit, damage, damageType, mastery?}[]`, `spellcastingStats(c)` → per class `{ability, dc, attack}`, `spellSlots(c)` → `{slots: number[9], pact?: {level, count}}`, `carryingCapacity(c)`.

- [ ] Tests: unarmored DEX 10 → AC 10; Mage Armor flag → 13+DEX; chain mail 16, +shield 18; half plate DEX 18 → 15+2; Barbarian unarmored 10+DEX+CON; Angvel spell DC 13, attack +5; Wizard 4 slots `[4,3,0…]`; Wizard 3/Cleric 2 combined level 5 → `[4,3,2,…]`; Paladin 2 + Sorcerer 3 → caster level 4 (paladin rounds up: ceil(2/2)=1 + 3) → `[4,3]`; Warlock 3 + Wizard 2 → slots `[3,0…]` + pact `{level 2, count 2}`; longsword STR 16 prof → +5, `1d8+3`; dagger finesse uses higher of STR/DEX; carrying STR 12 → 180.
- [ ] Implement using class data tables from `assets/data/classes.json` (slots per level, caster type: full/half/third/pact). Pass, commit.

### Task 4: Rules — HP, rests, conditions, concentration

**Files:** `src/rules/health.ts`, test.

**Produces:** `applyDamage(c, n)` → `{character, events: ('dropped'|'instantDeath'|'concentrationCheck'|'deathSaveFailure')[], concentrationDC?}`, `applyHealing(c, n)`, `setTempHp(c, n)` (no stacking; keep higher), `rollDeathSave(c, d20)`, `shortRest(c, hitDiceSpent: {classIdx, roll}[])`, `longRest(c)`, `hitDiceRemaining(c)`.

- [ ] Tests: temp 5, cur 10, dmg 8 → temp 0, cur 7; cur 10 max 31, dmg 41 → instant death (remainder 31 ≥ max); dmg at 0 HP → death save failure (crit = 2 not modelled here); heal from 0 resets death saves; heal caps at max; nat 20 death save → 1 HP; three failures → dead flag; concentration DC = max(10, floor(dmg/2)) capped 30; long rest restores HP, all hit dice, slots, resources (short+long), clears temp HP, exhaustion −1; short rest restores `short` resources and pact slots, heals roll+CON per die (min 0 per die? 2024: no min — total floor 0).
- [ ] Implement, pass, commit.

### Task 5: Dice + search

**Files:** `src/rules/dice.ts`, `src/wiki/search.ts`, tests.

**Produces:** `parseDice(expr)` → terms or error; `roll(expr, opts {adv?, dis?, rng?})` → `{total, rolls, expr, natural?}`; `normalize(s)` (lowercase, strip accents); `searchEntries(entries, query, filters)` ranked (name prefix > name contains > text contains).

- [ ] Tests: `2d6+3` with seeded rng; `d20` alias `1d20`; `1d8-1`; invalid `2x6` → error; adv takes higher of two d20; `normalize('Proyectil Mágico')==='proyectil magico'`; search "proyectil magico" and "magic missile" both return `magic-missile` first; filters by category and spell level.
- [ ] Implement, pass, commit.

### Task 6: Data pipeline (EN)

**Files:** `scripts/build-data.ts`, `src/content/types.ts`, `assets/data/*.json`, `data/srd-2024-en/` (vendored 5e-database JSON + LICENSE note).

**Produces:** `ContentEntry { id, category: 'spell'|'equipment'|'magic-item'|'class'|'subclass'|'species'|'background'|'feat'|'condition'|'rule'|'monster'|'feature'|'weapon-mastery'|'weapon-property'|'external', name: Loc, text?: Loc, data: object, source: 'srd'|'homebrew'|'external', external?: ExternalLinks }`, `Loc = { en: string; es?: string }`; class data `{ id, hitDie, saves, casterType, spellAbility, levels: {slots?, prepared?, cantrips?, features[]}[] }`.

- [ ] Script maps each source file to entries, merges `data/i18n/es/*.json` by id, writes `assets/data/{spells,equipment,magic-items,classes,subclasses,species,backgrounds,feats,conditions,rules,monsters,features,masteries,external}.json`.
- [ ] Test `scripts/__tests__/build-data.test.ts`: 339 spells, 12 classes, wizard level 4 slots `[4,3]`, every entry has `name.en`.
- [ ] Commit.

### Task 7: Spanish content, rules glossary, external index

**Files:** `data/i18n/es/*.json`, `data/rules/glossary.json`, `data/external/*.json`.

- [ ] ES names for every entry; full ES text for spells, conditions, species/traits, backgrounds, feats, class features, weapon properties/masteries.
- [ ] Glossary (~60 rules: acciones, ventaja, cobertura, descansos, concentración, agarrado…) bilingual.
- [ ] External index: PHB 2024 non-SRD spells/species/feats/subclasses with facts + slugs.
- [ ] Rebuild data; test: ≥95% of spells have `name.es` and `text.es`. Commit.

### Task 8: App state, i18n, theme

**Files:** `src/i18n/{index.ts,es.ts,en.ts}`, `src/theme/*.ts`, `src/store/{characters.ts,settings.ts,homebrew.ts,migrations.ts}`, `src/content/index.ts` (loads assets + homebrew, `getEntry(id)`, `loc(l, lang)`).

- [ ] Tests: `t('es','tabs.wiki')==='Wiki'`; missing key falls back to en then key; `migrate({schemaVersion:0,…})` upgrades; store add/update/delete character.
- [ ] Commit.

### Task 9: Share / import

**Files:** `src/share/{codec.ts,validate.ts,io.ts}`.

**Produces:** `encodeBundle(kind: 'character'|'homebrew', payload)` → string; `decodeBundle(text)` → `{ok, kind, payload} | {ok:false, error}`; `importCharacter(store, payload)` assigns new id on conflict.

- [ ] Tests: roundtrip; garbage text → `{ok:false}`; wrong kind; old schemaVersion migrated; existing characters untouched on failure.
- [ ] UI hooks: share file (expo-sharing), copy text, QR (if ≤ 2000 chars), import from file/text/QR scan. Commit.

### Task 10: Wiki UI

**Files:** `app/(tabs)/wiki/index.tsx`, `app/wiki/[id].tsx`, `app/webview.tsx`, `src/components/wiki/*`.

- [ ] Search bar + category chips + spell filters (level, class, school, concentration, ritual); virtualized list; detail renders text (markdown-lite), stat blocks for monsters, tables for class levels; external buttons; "Añadir a ficha" picker.
- [ ] Commit.

### Task 11: Characters list + creation wizard

**Files:** `app/(tabs)/characters/index.tsx`, `app/character/new.tsx`, `src/components/wizard/*`.

- [ ] Steps: classes (multi, levels) → species (+subspecies, or custom) → background (ASI +2/+1 or +1/+1/+1) → abilities (standard array, point buy 27, manual) → skills (class choices + background) → starting equipment (option A/B) → details. Creates character via store. Commit.

### Task 12: Character sheet

**Files:** `app/character/[id]/*.tsx`, `src/components/sheet/*`.

- [ ] Tabs: Principal, Combate, Conjuros, Inventario, Rasgos, Notas. HP bar with damage/heal/temp modal using Task 4; death saves; rests; conditions + exhaustion; resources counters; spells list (prepared toggle, cast → slot picker, concentration banner); inventory with equip/attune, weight, currency; features; personality + notes; edit mode with overrides. Tap a bonus → dice roll toast. Commit.

### Task 13: Dice tab, settings, homebrew editor, credits

**Files:** `app/(tabs)/dice.tsx`, `app/(tabs)/settings/*.tsx`, `src/components/homebrew/*`.

- [ ] Dice: quick buttons d4–d100, expression input, adv/dis, history. Settings: language, theme (system/light/dark), homebrew list + editor (spell, item, species, feat, feature, class-lite) + export/import packs, credits (CC-BY-4.0 attribution). Commit.

### Task 14: Smoke test + docs

- [ ] `npx expo export -p web`; Playwright script creates Angvel, casts Magic Missile, takes 10 damage, long rests; screenshots. README in Spanish with install instructions (download APK from Actions). Push.
