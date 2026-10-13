# Atribución / Attribution

This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by
Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is
licensed under the Creative Commons Attribution 4.0 International License, available at
https://creativecommons.org/licenses/by/4.0/legalcode.

- `data/srd-2024-en/`: structured SRD 5.2 data from https://github.com/5e-bits/5e-database
  (`src/2024/en`, MIT License, © Adrian Padua, Christopher Ward). Commit in `SOURCE_COMMIT`.
- `data/srd-md/`: SRD 5.2.1 Markdown from https://github.com/downfallx/dnd-5e-srd-markdown
  (CC-BY-4.0). Commit in `SOURCE_COMMIT`.
- `data/i18n/es/`: traducción al español elaborada para esta app a partir del SRD 5.2.1
  (CC-BY-4.0), usando la terminología oficial de la edición 2024 en castellano.
- `data/external/`: índice de datos factuales (nombres, nivel, escuela, clases) de contenido
  que no está en el SRD, con enlaces a AideDD, Wikidot y Nivel20. No incluye texto de reglas.

## Official Spanish names and spell index

- Official Spanish spell names for the SRD 5.2 (`data/i18n/es/spells/99-official-names.json`) come from
  [foundryvtt-sinregistrar/translate-dnd5e-sdr2-es](https://github.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es) (CC BY 4.0)
  and [foundryvtt-sinregistrar/translate-dnd5e-phb-2024-es](https://github.com/foundryvtt-sinregistrar/translate-dnd5e-phb-2024-es) (MIT).
- Spanish monster feature texts (`data/i18n/es/monster-texts.json`) are adapted from the same SRD 5.2 translation
  (CC BY 4.0): Foundry markup is filled in with the numbers of the English SRD text, distances converted to metres and
  some terms aligned with the 2024 Spanish books. Plain weapon attacks are rebuilt from their numbers. Features that
  couldn't be resolved keep their English text. Regenerate with `scripts/oneoff/gen_monster_es.py`.
- The index of spells outside the SRD (`data/external/spells-official.json`) holds facts only — name, level, school,
  casting time, range, component flags, duration, classes, book and page — taken from the
  [5etools](https://github.com/5etools-mirror-3/5etools-src) data. No rules text is included; the app links to
  AideDD, Wikidot and Nivel20 for it. Regenerate with `scripts/import-spell-index.ts`.

## Monsters outside the SRD

- `data/external/monsters-official.json` indexes official monsters that aren't in the SRD 5.2 (2024 Monster Manual,
  Monsters of the Multiverse, Fizban's, Glory of the Giants, The Book of Many Things) with facts only — name, size,
  creature type, challenge rating, armor class, average hit points, book and page — from the
  [5etools](https://github.com/5etools-mirror-3/5etools-src) data. No stat block text is included; the app links to
  AideDD (links checked; a search link where AideDD has no page). Official Spanish names for the 2024 Monster Manual come
  from [foundryvtt-sinregistrar/translate-dnd5e-mm-2024-es](https://github.com/foundryvtt-sinregistrar/translate-dnd5e-mm-2024-es)
  (Apache-2.0; names only). Regenerate with `scripts/import-monster-index.ts` and `scripts/oneoff/check_monster_links.py`.

## 2014 (legacy) options and 2024-era books

- `data/external/legacy-2014.json`: species, subclasses, backgrounds and feats from 2014 books (the ones in the
  "Manual para Casi Todo" PDF) that have no 2024 version. `data/external/books-2024.json`: options from 2024-era books
  (Eberron: Forge of the Artificer, Heroes of Faerûn, Arcana Unleashed, Ravenloft: The Horrors Within, Lorwyn, Astarion's
  Book of Hungers) and a few PHB 2024 feats that were missing. Both hold facts only (name, book, page, class, size, speed,
  darkvision, feat type) taken from the [5etools](https://github.com/5etools-mirror-3/5etools-src) data, plus links checked
  against Wikidot. Spanish names follow the PDF for 2014 options and are this app's own translation for the rest.
  Regenerate with `scripts/oneoff/gen_index.py`; `scripts/oneoff/gen_report.py` writes `docs/revision-pdf-5e-a-5.5.md`.

## Spell icons

Spell icons are from [game-icons.net](https://game-icons.net) ([game-icons/icons](https://github.com/game-icons/icons)),
licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Authors of the icons used: caro-asercion, cathelineau, darkzaitzev, delapouite, faithtoken, heavenly-dog, lorc, lord-berandas, lucasms, sbed, skoll, willdabeast, zeromancer.
The assignment of icons to spells is in `data/icons/spell-icons.json`; `scripts/build-spell-icons.ts` builds
`assets/data/spell-icons.json` from it (white glyphs on a colour per school of magic).
