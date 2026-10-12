# ScrollifyDND — Diseño

Fecha: 2026-10-11 · Estado: aprobado por el usuario ("hazlo todo")

## Objetivo

App móvil nativa (Android principalmente, iOS posible) para que cada jugador de un grupo
de D&D lleve sus fichas de personaje en el móvil, totalmente funcionales y siguiendo las
reglas de D&D 5.5 (2024), más una wiki con buscador para consultar conjuros, equipo,
clases, especies, dotes, reglas, estados y monstruos.

Referencia: ficha en papel de "Angvel" (Mago 4, Aasimar Caído) que tenía errores de cálculo
(CD de conjuros 12 en lugar de 13, ataque +4 en lugar de +5). La app calcula todo lo derivado.

## Decisiones del usuario

| Tema | Decisión |
|---|---|
| Plataforma | App nativa; distribución por APK de Android |
| Usuarios | Cada jugador en su móvil, sin servidor ni cuentas |
| Idioma | Bilingüe ES/EN (selector en Ajustes) |
| Reglas | 2024 por defecto + homebrew |
| Wiki | SRD 5.2 incluido + índice de contenido no-SRD con enlaces a Wikidot / AideDD / Nivel20 |
| Secciones wiki | Conjuros, equipo y objetos mágicos, clases/especies/trasfondos/dotes, reglas/estados/monstruos |
| Creación | Asistente paso a paso + edición libre |
| En partida | Vida y descansos, tirador de dados, conjuros y espacios, estados y recursos |
| Extras | Inventario completo, notas y personalidad, compartir fichas |
| Subir de nivel | Lo gestiona el DM en la mesa: la app solo permite cambiar el nivel y recalcula lo derivado |
| Multiclase | Sí |
| Homebrew | Paquetes exportables/importables |
| Estilo | Tema claro "pergamino" y oscuro "moderno" |
| Ficha de ejemplo | No |

## Supuestos

- Cada móvil guarda varias fichas.
- Todo funciona sin conexión salvo los enlaces externos.
- El DM no tiene vista especial: importa las fichas que le pasen.

## Arquitectura

- **Expo (React Native + TypeScript)**, Expo Router con pestañas: Personajes · Wiki · Dados · Ajustes.
- **Estado**: Zustand con persistencia en AsyncStorage (funciona en Android, iOS y web).
  Cada ficha es un documento JSON con `schemaVersion` para migraciones.
- **Wiki**: JSON precompilado incluido en el bundle (~2.400 entradas). Búsqueda en memoria
  sobre un índice normalizado (sin tildes, minúsculas, ES+EN). Con este volumen es instantáneo
  y evita la complejidad de SQLite/FTS (cambio respecto al borrador: YAGNI).
- **Motor de reglas** (`src/rules/`): TypeScript puro, sin UI, con tests unitarios. Recibe una
  ficha + datos de la wiki y devuelve todos los valores derivados.
- **i18n** propio y mínimo (`src/i18n/`): diccionarios `es`/`en` y helper `t()`; el contenido
  de la wiki lleva campos `{ en, es? }` y si falta `es` se muestra en inglés con marca "EN".

### Datos (`scripts/build-data.ts`, se ejecuta en desarrollo, no en el móvil)

1. Entrada: `5e-bits/5e-database` `src/2024/en/*.json` (SRD 5.2, CC-BY-4.0; repo MIT).
2. Traducciones ES en `data/i18n/es/*.json`, indexadas por `id`, escritas a partir de la
   terminología oficial de 2024 (la descarga del SRD oficial en español no es accesible
   desde el entorno de construcción). Prioridad: nombres de todo, conjuros completos,
   estados, especies, trasfondos, dotes, rasgos de clase, propiedades y maestrías de armas.
   Descripciones de monstruos y objetos mágicos: inglés con marca hasta que se traduzcan.
3. Glosario de reglas propio (`data/rules/*.json`) redactado a partir del SRD 5.2.
4. Índice externo (`data/external/*.json`): solo hechos (nombre ES/EN, tipo, nivel, escuela,
   clases, fuente) de conjuros, especies, dotes y subclases del PHB 2024 que no están en el SRD.
   Sin texto con copyright. Cada entrada genera enlaces:
   - AideDD: `https://www.aidedd.org/spell/<slug-en>` y `https://www.aidedd.org/spell/es/<slug-es>`
   - Wikidot: `http://dnd2024.wikidot.com/spell:<slug-en>`
   - Nivel20: búsqueda web restringida al sitio.
5. Salida: `assets/data/*.json` normalizado. Pantalla de créditos con atribución CC-BY-4.0.

### Modelo de ficha (resumen)

```
Character {
  id, schemaVersion, name, player, portraitUri?
  species: ContentRef, subspecies?: ContentRef, background: ContentRef
  classes: [{ class: ContentRef, subclass?: ContentRef, level, hitDieUsed }]   // multiclase
  abilities: { str, dex, con, int, wis, cha }          // puntuaciones base finales
  proficiencies: { saves[], skills: {id: 'none'|'prof'|'expertise'}, armor[], weapons[], tools[], languages[] }
  hp: { max, current, temp, maxOverride? }, deathSaves: { successes, failures }
  spellcasting: { known: SpellEntry[] (prepared, alwaysPrepared, sourceClass), slotsUsed[1..9], pactUsed, concentration? }
  inventory: Item[] (ref|custom, qty, equipped, attuned, notes), currency: { cp, sp, ep, gp, pp }
  conditions: string[], exhaustion: 0..6, inspiration: boolean
  resources: [{ name, max, used, recharge: 'short'|'long'|'none' }]   // Manos Sanadoras, Recuperación Arcana...
  features: [{ name, source, description }]   // rasgos libres o desde la wiki
  attacks: custom extra attacks
  personality: { traits, ideals, bonds, flaws, backstory, appearance, alignment }
  notes: [{ date, text }]
  overrides: { ac?, initiative?, speed?, spellDC?, spellAttack? }   // edición libre
}
```

### Motor de reglas (2024)

- Modificador = floor((punt − 10)/2); competencia por nivel total (2/3/4/5/6).
- Salvaciones y habilidades con competencia/pericia; Agotamiento 2024: −2 × nivel a todas las tiradas d20; 6 = muerte.
- CA: armadura equipada (ligera +DES, media +DES máx 2, pesada) + escudo +2, o sin armadura 10+DES;
  Defensa sin armadura de Bárbaro/Monje; Armadura de mago 13+DES como opción; override manual.
- Iniciativa = DES (+ override). Percepción pasiva = 10 + Percepción.
- Lanzamiento: CD = 8 + comp + mod; ataque = comp + mod (por clase lanzadora).
- Espacios: un solo lanzador usa su tabla; multiclase usa la tabla combinada 2024
  (completos ×1, medios redondeando arriba, tercios redondeando abajo); Brujo aparte (Magia de pacto).
- Ataques con arma: mod FUE o DES (sutileza/distancia), + comp si competente; daño + mod; maestría si la clase la tiene.
- Carga: FUE × 15 lb.
- Daño: primero PG temporales, luego actuales; a 0 PG → salvaciones contra muerte; daño ≥ máximo restante → muerte instantánea.
- Descanso corto: gastar dados de golpe (tirada + CON); recursos "short"; espacios de pacto.
- Descanso largo: PG al máximo, recupera todos los dados de golpe, espacios, recursos; −1 Agotamiento; borra PG temporales.
- Concentración: al recibir daño, aviso de salvación de CON con CD max(10, daño/2) (máx 30).

### Pantallas

- **Personajes**: lista, crear (asistente), importar.
- **Asistente**: Clase(s) → Especie → Trasfondo (mejoras de característica 2024 +2/+1 o +1/+1/+1)
  → Características (estándar, compra por puntos o manual) → Habilidades → Equipo inicial → Detalles.
  Opción de contenido homebrew o externo como especie/clase personalizada.
- **Ficha** (pestañas internas): Principal (características, salvaciones, habilidades, CA, PG, dados),
  Combate (ataques, estados, recursos, descansos), Conjuros, Inventario, Rasgos, Notas.
  Todo número tocable tira el d20. Barra de PG con botones Daño/Curar/Temp.
- **Wiki**: buscador global + filtros por categoría; detalle con texto, tabla y botones externos
  (abre WebView dentro de la app). Botón "Añadir a ficha" en conjuros, objetos y dotes.
- **Dados**: tirador libre (expresiones `2d6+3`, ventaja/desventaja), historial.
- **Ajustes**: idioma, tema, gestionar homebrew (crear/editar/exportar/importar paquetes), créditos.

### Compartir

- Ficha o paquete homebrew → archivo `.scrollify.json` por el diálogo de compartir del sistema,
  o código QR (si cabe) / texto copiable. Importar desde archivo, texto o escaneando QR.
- Validación del esquema al importar; los IDs en conflicto se renombran.

### Errores

- Importaciones inválidas: mensaje claro, sin tocar datos existentes.
- Datos persistidos con versión antigua → migración; si falla, se conserva copia de respaldo.
- Referencias a contenido inexistente (homebrew borrado): se muestran con el nombre guardado.

### Pruebas

- Jest para el motor de reglas, dados, i18n, búsqueda, importación/exportación y migraciones.
- Prueba de humo en web (Expo web + Playwright): crear a Angvel, lanzar conjuro, recibir daño, descansar.
- GitHub Actions: tests + compilación de APK (Gradle) publicada como artefacto.

## Fuera de alcance

- Sincronización en la nube, cuentas, vista de DM en tiempo real.
- Asistente de subida de nivel (lo hace el DM).
- Texto con copyright fuera del SRD.

## Addendum (2026-10-12): DM section

User request: "un apartado de DM donde pueda apuntar enemigos con sus nombres, vida, debilidad, habilidades, ataques, etc."

- New bottom tab **DM** with two views: **Enemigos** (the DM's own bestiary) and **Combate** (encounter tracker).
- **Enemy** = full 2024 stat block, all editable: name, size, type, alignment, CR/XP, AC (+ note), HP max + formula, speed, six abilities, save bonuses, skill bonuses, damage vulnerabilities (debilidades) / resistances / immunities, condition immunities, senses, languages, traits, actions (attack bonus, damage dice + type, or save DC), bonus actions, reactions, legendary actions, free notes.
- Create from scratch or copy any of the 341 SRD monsters as a starting point (names localized; SRD action text stays English, editable).
- Stat block view: tap an attack to roll to-hit and damage with the shared dice roller; tap an ability to roll a check.
- **Combat tracker**: add N copies of an enemy (auto-numbered "Trasgo 1, 2…", HP fixed or rolled from formula) and saved player characters (HP/AC/initiative from their sheet); roll initiative for enemies; sorted turn order with round counter and next turn; per-combatant damage (temp HP first) / heal / temp HP / conditions / notes; enemies at 0 HP are marked defeated and skipped. Player-character HP in the tracker is a copy (the player tracks their own sheet).
- Local only, persisted (`scrollify.dm`), sanitized on load like characters. Bestiary export/import via the existing share codec (kind `enemies`); imported ids that already exist get a new id.
