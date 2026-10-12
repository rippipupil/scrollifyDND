"""Writes the PDF review (docs/revision-pdf-5e-a-5.5.md) from report.json and the generated index files."""
import json
import re
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from names import BACKGROUND_ES, CLASS_ES, FEAT_ES  # noqa: E402

REPORT, REPO, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
r = json.load(open(REPORT))
legacy = json.load(open(os.path.join(REPO, 'data/external/legacy-2014.json')))
new = json.load(open(os.path.join(REPO, 'data/external/books-2024.json')))
SHORT = {'PHB': 'PHB 2014', 'DMG': 'DMG 2014', 'SCAG': 'Costa de la Espada', 'XGE': 'Xanathar', 'TCE': 'Tasha', 'EGW': 'Wildemount', 'FTD': 'Fizban', 'BGG': 'Bigby',
         'VRGR': 'Van Richten', 'DSotDQ': 'Dragonlance', 'GGR': 'Ravnica', 'XPHB': 'Manual del Jugador 2024', 'FRHoF': 'Heroes of Faerûn', 'AU': 'Arcana Unleashed',
         'RHW': 'Ravenloft: The Horrors Within', 'EFA': 'Eberron: Forge of the Artificer'}

PHB_BG_ES = {'Acolyte': 'Acólito', 'Charlatan': 'Charlatán', 'Criminal': 'Criminal', 'Entertainer': 'Artista', 'Hermit': 'Ermitaño', 'Noble': 'Noble', 'Sage': 'Sabio',
             'Sailor': 'Marinero', 'Soldier': 'Soldado'}
FEAT_2014_ES = {
    'Actor': 'Actor', 'Alert': 'Alerta', 'Athlete': 'Atleta', 'Charger': 'Cargar', 'Chef': 'Chef', 'Crossbow Expert': 'Experto en Ballestas', 'Crusher': 'Destructor',
    'Defensive Duelist': 'Duelista Defensivo', 'Dual Wielder': 'Luchador con Dos Armas', 'Durable': 'Vigoroso', 'Elemental Adept': 'Adepto Elemental', 'Fey Touched': 'Tocado por lo Desconocido',
    'Grappler': 'Apresador', 'Great Weapon Master': 'Gran Experto en Armas', 'Healer': 'Sanador', 'Heavily Armored': 'Fuertemente Acorazado', 'Heavy Armor Master': 'Experto en Armadura Pesada',
    'Inspiring Leader': 'Líder Inspirador', 'Keen Mind': 'Mente Aguda', 'Lightly Armored': 'Ligeramente Acorazado', 'Lucky': 'Afortunado', 'Mage Slayer': 'Asesino de Magos',
    'Magic Initiate': 'Iniciado en la Magia', 'Medium Armor Master': 'Experto en Armadura Media', 'Mobile': 'Ágil', 'Moderately Armored': 'Moderadamente Acorazado',
    'Mounted Combatant': 'Combatiente Montado', 'Observant': 'Observador', 'Piercer': 'Perforador', 'Poisoner': 'Envenenador', 'Polearm Master': 'Experto en Armas de Asta',
    'Resilient': 'Resistente', 'Ritual Caster': 'Ritualista', 'Savage Attacker': 'Atacante Salvaje', 'Sentinel': 'Centinela', 'Shadow Touched': 'Tocado por las Sombras',
    'Sharpshooter': 'Francotirador', 'Shield Master': 'Experto en Escudos', 'Skill Expert': 'Experto en Varias Habilidades', 'Skilled': 'Habilidoso', 'Skulker': 'Acechador',
    'Slasher': 'Desgarrador', 'Spell Sniper': 'Francotirador de Conjuros', 'Tavern Brawler': 'Alborotador de Taberna', 'Telekinetic': 'Telequinético', 'Telepathic': 'Telepatía',
    'Tough': 'Duro', 'War Caster': 'Conjurador de Guerra', 'Weapon Master': 'Experto en Armas',
}
FEAT_2024_ES = {'Speedy': 'Veloz', 'Martial Weapon Training': 'Entrenamiento con armas marciales', 'Fey-Touched': 'Tocado por los feéricos', 'Shadow-Touched': 'Tocado por las sombras'}

L = []
w = L.append
n_leg = {c: sum(1 for e in legacy if e['category'] == c) for c in ('species', 'subclass', 'background', 'feat')}
n_new = {c: sum(1 for e in new if e['category'] == c) for c in ('class', 'species', 'subclass', 'background', 'feat')}

w('# Revisión del «Manual para Casi Todo de D&D 5e» frente a la app (5.5)')
w('')
w('He repasado el PDF apartado por apartado (610 páginas, versión 31.08.23) y lo he comparado con lo que tiene Scrollify. '
  'Para cada cosa indico qué pasó en 5.5 (reglas 2024): **sin cambios de nombre**, **renombrada**, **sustituida por otra** o **sin versión 2024 (legado)**. '
  'Los datos de qué libro 2024 sustituye a qué opción 2014 salen del índice de 5etools; el texto de reglas no se copia en la app (tiene derechos de autor), '
  'solo los datos básicos y los enlaces a Wikidot y Nivel20.')
w('')
w('## Resumen')
w('')
w('| Apartado del PDF | En el PDF | Cómo queda en la app |')
w('|---|---|---|')
w(f'| Razas | ~70 razas y subrazas | Las 10 especies 2024 (SRD + Aasimar) y **{n_leg["species"]} especies 2014 añadidas como legado**, más {n_new["species"]} especies de libros 2024 (Eberron, Ravenloft, Lorwyn) |')
w(f'| Clases | 13 (con Artificiero) | 12 del SRD 2024 + **Artífice 2024** (Eberron: Forge of the Artificer), ya se puede crear |')
w(f'| Subclases | {len(r["subclasses"])} | Las 2024 que ya había, **{n_leg["subclass"]} subclases 2014 sin versión 2024 añadidas como legado** y {n_new["subclass"]} subclases de libros 2024 |')
w(f'| Trasfondos | 25 | Los 16 del Manual 2024, **{n_leg["background"]} trasfondos 2014 como legado** y {n_new["background"]} de libros 2024 |')
w(f'| Dotes | 74 | Las del Manual 2024 (faltaban 7, ya están), **{n_leg["feat"]} dotes 2014 como legado** y {n_new["feat"] - 7} de libros 2024 |')
w('| Equipo | Tablas 2014 | Ya estaba completo con las tablas 2024 del SRD (maestrías de armas incluidas) |')
w('| Multiclase | Reglas 2014 | La app ya usa las de 2024 (ver abajo) |')
w('| Conjuros | 499 | **Están los 499**: 2 cambiaron de nombre en 2024 y la app usa el nombre nuevo |')
w('')
w('En la wiki tienes un filtro nuevo: **Todas las ediciones / 5.5 (2024) / 5e (2014, legado)**, y las opciones 2014 llevan una etiqueta naranja «2014». '
  'En la creación de personaje las opciones 2014 están ocultas; aparecen con el botón «Mostrar también opciones de 2014 (legado)».')
w('')

# --- species (hand-written, follows the PDF's sections) ---------------------------------------------
w('## Razas → Especies')
w('')
w('En 5.5 las razas se llaman **especies**, ya no dan mejoras de característica (las da el trasfondo) y las subrazas pasan a ser **linajes** dentro de la especie.')
w('')
w('| En el PDF | Qué pasa en 5.5 | En la app |')
w('|---|---|---|')
SP = [
    ('Enano (de la Colina / de la Montaña)', 'Una sola especie Enano; sin subrazas', 'Enano (SRD)'),
    ('Duergar (Legado)', 'Sin versión 2024', 'Duergar (2014)'),
    ('Alto Elfo / Elfo de los Bosques / Drow', 'Pasan a ser linajes del Elfo', 'Elfo (SRD) con linaje'),
    ('Elfo del Mar, Shadar-Kai, Eladrín (Legado)', 'Sin versión 2024', 'Las tres como 2014'),
    ('Elfo Pálido (Wildemount)', 'Sin versión 2024', 'Solo en el informe (subraza)'),
    ('Humano / Humano Variante', 'Humano 2024: obtiene una dote de origen, como el antiguo Variante', 'Humano (SRD)'),
    ('Mediano Piesligeros / Fornido / Fantasagaz / de Lotusden', 'Una sola especie Mediano; sin subrazas', 'Mediano (SRD)'),
    ('Dracónido (y de Fizban: Cromático, Metálico)', 'Dracónido 2024 con ascendencia de dragón', 'Dracónido (SRD)'),
    ('Dracónido Gemático (Fizban)', 'Sin versión 2024', 'Dracónido gemático (2014)'),
    ('Dracónidos de Wildemount (Draconblood, Ravenite)', 'Sin versión 2024', 'Solo en el informe (subraza)'),
    ('Gnomo del Bosque / de las Rocas', 'Linajes del Gnomo 2024', 'Gnomo (SRD)'),
    ('Gnomo de las Profundidades', 'Sin versión 2024', 'Gnomo de las Profundidades (2014)'),
    ('Semielfo', 'Desaparece del Manual 2024; en Eberron 2024 es el Khoravar', 'Semielfo (2014) y Khoravar (2024)'),
    ('Semiorco', 'Desaparece; el Orco 2024 ocupa su lugar', 'Semiorco (2014) y Orco (SRD)'),
    ('Tiefling y sus linajes (Asmodeus, Zariel…)', 'Tiflin 2024 con legados Abisal, Ctónico o Infernal', 'Tiflin (SRD)'),
    ('Aasimar (Protector, Atormentado, Caído)', 'Aasimar 2024, una sola especie', 'Aasimar (Manual 2024)'),
    ('Goliath', 'Goliat 2024 con ascendencia de gigante', 'Goliat (SRD)'),
    ('Orco', 'Orco 2024', 'Orco (SRD)'),
    ('Osgo, Goblin, Hobgoblin, Kobold, Hombre lagarto, Yuan-ti (Legado)', 'Sin versión 2024 (siguen siendo las de Monsters of the Multiverse)', 'Todas como 2014'),
    ('Aarakocra, Firbolg, Genasi, Githyanki, Githzerai, Kenku, Tabaxi, Tortuga, Tritón, Hada, Conéjido (Legado)', 'Sin versión 2024', 'Todas como 2014'),
    ('Búhonido, Grung, Locathah, Verdan', 'Sin versión 2024', 'Todas como 2014'),
    ('Centauro, Minotauro, Sátiro, Leónido (Theros)', 'Sin versión 2024', 'Todas como 2014'),
    ('Loxodon, Híbrido Simic, Vedalken (Ravnica)', 'Sin versión 2024', 'Todas como 2014'),
    ('Cambiante, Cambiaformas (Multiverso)', 'Versión 2024 en Eberron: Forge of the Artificer', 'Las versiones 2024'),
    ('Dhampiro, Sangre Maldita, Renacido (Ravenloft)', 'Versión 2024 en Ravenloft: The Horrors Within', 'Las versiones 2024'),
    ('Linaje Customizado (Tasha)', 'Ya no existe: en 2024 cualquier especie usa las mejoras del trasfondo', 'Especie personalizada en el creador'),
]
for a, b, c in SP:
    w(f'| {a} | {b} | {c} |')
w('')

# --- classes and subclasses -------------------------------------------------------------------------
w('## Clases')
w('')
w('Las 12 clases del PDF existen en 5.5 con cambios en casi todos los rasgos: todas eligen subclase a **nivel 3**, las mejoras de característica se toman como dotes, '
  'los lanzadores preparan conjuros de la misma forma y los espacios de medio lanzador (paladín, explorador) se redondean hacia arriba desde nivel 1. '
  'La app ya usa las versiones 2024 del SRD.')
w('')
w('El **Artificiero** (Tasha) tiene versión 2024: el **Artífice** de *Eberron: Forge of the Artificer*. Lo he añadido a la wiki y al creador de personajes '
  '(dado de golpe d8, salvaciones de Constitución e Inteligencia, medio lanzador con Inteligencia, armaduras ligeras y medias, escudos y armas sencillas). '
  'Sus rasgos de clase no están en el SRD: escríbelos en la ficha o consulta el enlace. Las **infusiones** del PDF son de la versión 2014.')
w('')
w('## Subclases')
w('')
w('Leyenda: **=** sigue igual de nombre en 2024 · **→** renombrada o sustituida · **legado** sin versión 2024 (añadida a la app como opción 2014).')
w('')
APP_ES = {}
for f in ('assets/data/subclasses.json',):
    for e in json.load(open(os.path.join(REPO, f))):
        APP_ES[e['name']['en']] = e['name'].get('es')
for e in json.load(open(os.path.join(REPO, 'data/external/phb2024.json'))):
    if e['category'] == 'subclass':
        APP_ES[e['name']['en']] = e['name'].get('es')
for s in r['subclasses']:
    if s['rep'] and s['rep'] in APP_ES:
        s['repEs'] = APP_ES[s['rep']]
ORDER = ['PHB', 'DMG', 'SCAG', 'XGE', 'VRGR', 'EGW', 'TCE', 'FTD', 'BGG', 'DSotDQ']
r['subclasses'].sort(key=lambda x: (ORDER.index(x['src']) if x['src'] in ORDER else 99, x['page'] or 0))
by_class = {}
for s in r['subclasses']:
    by_class.setdefault(s['cls'], []).append(s)
for cls in ['artificer', 'barbarian', 'bard', 'warlock', 'cleric', 'druid', 'ranger', 'fighter', 'sorcerer', 'wizard', 'monk', 'paladin', 'rogue']:
    rows = by_class.get(cls, [])
    if not rows:
        continue
    w(f'### {CLASS_ES[cls]}')
    w('')
    w('| En el PDF | Libro | En 5.5 |')
    w('|---|---|---|')
    for s in rows:
        if s['rep']:
            book = SHORT.get(s['repSrc'], s['repSrc'])
            same = re.sub(r'\b(la|el)\s', '', s['repEs'].lower()) == re.sub(r'\b(la|el)\s', '', s['es'].lower())
            status = f'= {s["repEs"]} ({book})' if same else f'→ **{s["repEs"]}** ({book})'
        else:
            status = 'legado (2014)'
        w(f'| {s["es"]} | {SHORT.get(s["src"], s["src"])} | {status} |')
    w('')
replacements = {(x['cls'], x['rep']) for x in r['subclasses'] if x['rep']}
extra = [e for e in new if e['category'] == 'subclass' and (e['data']['classId'], e['name']['en']) not in replacements]
w('### Subclases nuevas de libros 2024 (no están en el PDF)')
w('')
w(', '.join(f'{e["name"]["es"]} ({CLASS_ES[e["data"]["classId"]].lower()}, {e["book"]})' for e in extra) + '.')
w('')

# --- backgrounds ------------------------------------------------------------------------------------
w('## Trasfondos')
w('')
w('En 5.5 el trasfondo da las **mejoras de característica (+2/+1 o +1/+1/+1)**, una **dote de origen**, dos habilidades, una herramienta y el equipo. '
  'Los trasfondos 2014 no traen nada de eso: si usas uno, acordad con el DM qué tres características y qué dote de origen le corresponden.')
w('')
w('| En el PDF | En 5.5 |')
w('|---|---|')
for b in r['backgrounds']:
    es = PHB_BG_ES.get(b['en']) or BACKGROUND_ES.get(b['en'], b['en'])
    if b['rep']:
        w(f'| {es} | = {PHB_BG_ES.get(b["rep"], b["rep"])} (Manual 2024) |')
    else:
        hint = {'Guild Artisan': 'lo más parecido: **Artesano**', 'Folk Hero': 'lo más parecido: **Granjero**', 'Outlander': 'lo más parecido: **Guía**',
                'Urchin': 'lo más parecido: **Vagabundo**', 'City Watch': 'lo más parecido: **Guardia**', 'Far Traveler': 'lo más parecido: **Vagabundo** o **Guía**',
                'Courtier': 'lo más parecido: **Noble**', 'Clan Crafter': 'lo más parecido: **Artesano**', 'Cloistered Scholar': 'lo más parecido: **Escriba** o **Sabio**',
                'Mercenary Veteran': 'lo más parecido: **Soldado**', 'Waterdhavian Noble': 'lo más parecido: **Noble**'}.get(b['en'], '')
        w(f'| {es} | legado (2014){" · " + hint if hint else ""} |')
w('')

# --- feats ------------------------------------------------------------------------------------------
w('## Dotes')
w('')
w('En 5.5 las dotes tienen **tipo**: de origen (nivel 1, por trasfondo), generales (nivel 4+, casi todas suben +1 una característica), estilos de combate y dones épicos (nivel 19). '
  'Casi todas las del Manual 2014 y de Tasha siguen existiendo con cambios. Las dotes raciales de Xanathar no tienen versión 2024.')
w('')
w('| En el PDF | En 5.5 |')
w('|---|---|')
for f in sorted(r['feats'], key=lambda x: FEAT_2014_ES.get(x['en']) or FEAT_ES.get(x['en'], x['en'])):
    es = FEAT_2014_ES.get(f['en']) or FEAT_ES.get(f['en'], f['en'])
    if f['rep']:
        rep = f['rep']
        if rep.replace('-', ' ') != f['en'].replace('-', ' '):
            w(f'| {es} | → **{FEAT_2024_ES.get(rep, rep)}** |')
        elif rep in FEAT_2024_ES and FEAT_2024_ES[rep].lower() != es.lower():
            w(f'| {es} | = misma dote, revisada (en la app: {FEAT_2024_ES[rep]}) |')
        else:
            w(f'| {es} | = misma dote, revisada |')
    elif f['en'] == 'Fighting Initiate':
        w(f'| {es} | → sustituida por las **dotes de estilo de combate** (Arquería, Defensa, Duelo…) |')
    else:
        w(f'| {es} | legado (2014) |')
w('')
w('Además faltaban en la app 7 dotes del Manual 2024 que ya están: Guerrero bendito, Guerrero druídico y los dones épicos de resistencia a la energía, fortaleza, recuperación, habilidad y velocidad.')
w('')

# --- equipment, multiclass, spells ----------------------------------------------------------------
w('## Equipo')
w('')
w('La app ya tenía todo el equipo del SRD 2024. Cambios principales respecto a las tablas del PDF:')
w('')
w('- **Maestrías de armas**: cada arma tiene una (Derribar, Debilitar, Empujar, Fustigar, Hendir, Mellar, Ralentizar o Rozar). La app las muestra y las calcula.')
w('- El **mosquete y la pistola** pasan a ser armas marciales normales del Manual; la **red** deja de ser un arma y pasa a ser equipo de aventurero.')
w('- Los paquetes de equipo inicial dependen de la clase y del trasfondo, con la alternativa de cobrar oro (la app ya lo ofrece en el creador).')
w('- Herramientas: cada una indica característica, usos y objetos que permite fabricar.')
w('')
w('## Multiclase')
w('')
w('- Requisito: 13 en la característica principal de cada clase (igual que antes).')
w('- Espacios de conjuro combinados: lanzadores completos cuentan su nivel entero, **medios (paladín, explorador, artífice) la mitad redondeando hacia arriba** y tercios un tercio redondeando hacia arriba. La app ya lo calcula así.')
w('- La Magia del pacto del brujo sigue aparte.')
w('')
w('## Conjuros')
w('')
w('El PDF tiene 499 conjuros: 361 del Manual 2014, 95 de Xanathar, 21 de Tasha, 7 de Fizban y 15 de Dunamancia (Wildemount). **Están todos en la app.**')
w('')
w('- Los 361 del Manual 2014 siguen en el Manual 2024, casi todos con cambios; la app usa la versión 2024.')
w('- Dos cambian de nombre: **Castigo marcador → Castigo brillante** (Branding Smite → Shining Smite) y **Debilidad mental → Ofuscación** (Feeblemind → Befuddlement).')
w('- **Invocar espíritu dracónico** (Fizban) pasa a ser **Invocar dragón** en el Manual 2024.')
w('- De Xanathar, 10 pasaron al Manual 2024 (Aliento de dragón, Clavo mental, Cuchillo de hielo, Esfera vitriólica, Estática sináptica, Golpe de viento acerado, Hechizar monstruo, Palabra de resplandor, Tañido por los muertos y Tronar) y 6 a *Arcana Unleashed*; de Tasha, los 8 «Invocar…», Fragmento mental y Filo del desastre tienen versión 2024. El resto siguen siendo opciones 2014 con su ficha en la app.')
w('')
w('## Fuera de lo que trae la app')
w('')
w('El PDF también recoge invocaciones de brujo, maniobras, infusiones, metamagias y disparos arcanos. En 5.5 la mayoría siguen existiendo dentro de su clase o subclase. '
  'La app no tiene una sección propia para ellas: puedes añadirlas a la ficha como rasgos.')
open(OUT, 'w').write('\n'.join(L) + '\n')
print('written', OUT, len(L), 'lines')
