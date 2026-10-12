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
- The index of spells outside the SRD (`data/external/spells-official.json`) holds facts only — name, level, school,
  casting time, range, component flags, duration, classes, book and page — taken from the
  [5etools](https://github.com/5etools-mirror-3/5etools-src) data. No rules text is included; the app links to
  AideDD, Wikidot and Nivel20 for it. Regenerate with `scripts/import-spell-index.ts`.
