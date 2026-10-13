"""Spanish monster texts from foundryvtt-sinregistrar/translate-dnd5e-sdr2-es (CC BY 4.0, translation of the SRD 5.2).

The translation keeps Foundry markup ([[/attack]], [[lookup @save.dc.value]], &Reference[...]); every value is filled
in from the English SRD text of the same feature, in order. A feature whose markup can't all be resolved keeps
its English text. Usage: python3 -I gen_monster_es.py <fvtt actors24 dir> <sdr2-es actors24.json> <app monsters.json> <out.json>
"""
import glob
import html
import json
import re
import sys

FVTT, ES, APP, OUT = sys.argv[1:5]

DMG = {'acid': 'ácido', 'bludgeoning': 'contundente', 'cold': 'frío', 'fire': 'fuego', 'force': 'fuerza', 'lightning': 'relámpago', 'necrotic': 'necrótico',
       'piercing': 'perforante', 'poison': 'veneno', 'psychic': 'psíquico', 'radiant': 'radiante', 'slashing': 'cortante', 'thunder': 'trueno'}
NOUN = {'ácido', 'frío', 'fuego', 'fuerza', 'relámpago', 'veneno', 'trueno'}
COND = {'blinded': 'Cegado', 'charmed': 'Hechizado', 'deafened': 'Ensordecido', 'exhaustion': 'Agotamiento', 'frightened': 'Asustado', 'grappled': 'Agarrado',
        'incapacitated': 'Incapacitado', 'invisible': 'Invisible', 'paralyzed': 'Paralizado', 'petrified': 'Petrificado', 'poisoned': 'Envenenado', 'prone': 'Derribado',
        'restrained': 'Apresado', 'stunned': 'Aturdido', 'unconscious': 'Inconsciente'}
REF = {**COND, 'difficultterrain': 'Terreno difícil', 'difficult terrain': 'Terreno difícil', 'hide': 'Esconderse', 'disengage': 'Destrabarse', 'dash': 'Correr',
       'dodge': 'Esquivar', 'help': 'Ayudar', 'opportunity attacks': 'ataques de oportunidad', 'opportunity attack': 'ataque de oportunidad', 'truesight': 'visión verdadera',
       'darkvision': 'visión en la oscuridad', 'blindsight': 'vista ciega', 'tremorsense': 'sentido de la vibración', 'darkness': 'oscuridad', 'dim light': 'luz tenue',
       'bright light': 'luz brillante', 'heavily obscured': 'muy oscurecido', 'lightly obscured': 'ligeramente oscurecido', 'emanation': 'Emanación', 'cone': 'Cono',
       'sphere': 'Esfera', 'line': 'Línea', 'cube': 'Cubo', 'cylinder': 'Cilindro', 'half cover': 'cobertura media', 'total cover': 'cobertura total',
       'three-quarters cover': 'cobertura de tres cuartos', 'teleportation': 'teletransporte', 'telepathy': 'telepatía', 'concentration': 'Concentración',
       'bloodied': 'Malherido', 'surprise': 'sorpresa', 'magic': 'Magia', 'influence': 'Influir', 'search': 'Buscar', 'study': 'Estudiar', 'utilize': 'Usar',
       'ready': 'Preparar', 'attack': 'Atacar', 'unarmed strike': 'golpe sin armas', 'burning': 'Arder', 'suffocation': 'Asfixia', 'falling': 'Caída',
       'hover': 'flotar', 'flying': 'vuelo', 'climbing': 'trepar', 'swimming': 'nadar', 'spell scroll': 'pergamino de conjuro'}
SHAPE = {'emanation': 'Emanación', 'cone': 'Cono', 'sphere': 'Esfera', 'line': 'Línea', 'cube': 'Cubo', 'cylinder': 'Cilindro'}
ABIL = {'Strength': 'Fuerza', 'Dexterity': 'Destreza', 'Constitution': 'Constitución', 'Intelligence': 'Inteligencia', 'Wisdom': 'Sabiduría', 'Charisma': 'Carisma'}


def meters(ft: str) -> str:
    v = round(int(ft) * 0.3, 1)
    return (str(int(v)) if v == int(v) else str(v).replace('.', ',')) + ' m'


def dmg_type(t: str) -> str:
    return DMG.get(t.lower(), t.lower())


def de_dano(amount: str, t: str) -> str:
    es = dmg_type(t)
    return f'{amount} de daño {"de " if es in NOUN else ""}{es}'


def attack_es(en: str):
    m = re.search(r'(Melee or Ranged|Melee|Ranged) Attack Roll: ([+-]\d+)(?:, reach (\d+) ft\.)?(?:,? (?:or )?range ([\d/]+) ft\.)?', en)
    if not m:
        return None
    kind = {'Melee': 'cuerpo a cuerpo', 'Ranged': 'a distancia', 'Melee or Ranged': 'cuerpo a cuerpo o a distancia'}[m.group(1)]
    parts = [f'Tirada de ataque {kind}: {m.group(2)}']
    if m.group(3):
        parts.append(f'alcance {meters(m.group(3))}')
    rng = '/'.join(meters(x) for x in m.group(4).split('/')) if m.group(4) else None
    if m.group(3) and rng:
        return f'{parts[0]}, alcance {meters(m.group(3))} o distancia {rng}'
    if rng:
        parts.append(f'distancia {rng}')
    return ', '.join(parts)


DMG_RE = r'(\d+) \(([^)]+)\) (\w+) damage'
# Names for plain weapon/natural attacks the translation has no item for.
ATTACKS = {'Scratch': 'Arañazo', 'Longbow': 'Arco largo', 'Shortbow': 'Arco corto', 'Javelin': 'Jabalina', 'Heavy Crossbow': 'Ballesta pesada',
           'Light Crossbow': 'Ballesta ligera', 'Hand Crossbow': 'Ballesta de mano', 'Spear': 'Lanza', 'Dagger': 'Daga', 'Greatsword': 'Espadón',
           'Mace': 'Maza', 'Shortsword': 'Espada corta', 'Longsword': 'Espada larga', 'Scimitar': 'Cimitarra', 'Pistol': 'Pistola', 'Rend': 'Desgarrar',
           'Greataxe': 'Gran hacha', 'Pike': 'Pica', 'Club': 'Clava', 'Rapier': 'Estoque', 'Greatclub': 'Gran clava', 'Shock': 'Descarga',
           'Bite': 'Mordisco', 'Sting': 'Aguijón', 'Claw': 'Garra', 'Slam': 'Golpe', 'Tail': 'Cola', 'Gore': 'Cornada', 'Hooves': 'Cascos',
           'Tentacle': 'Tentáculo', 'Battleaxe': 'Hacha de batalla', 'Warhammer': 'Martillo de guerra', 'Morningstar': 'Lucero del alba',
           'Handaxe': 'Hacha de mano', 'Sling': 'Honda', 'Trident': 'Tridente', 'Halberd': 'Alabarda', 'Glaive': 'Guja', 'Whip': 'Látigo',
           'Flail': 'Mangual', 'Maul': 'Mazo', 'Lance': 'Lanza de caballería', 'Quarterstaff': 'Bastón', 'Unarmed Strike': 'Golpe sin armas'}
PURE_ATTACK = re.compile(r'(Melee or Ranged|Melee|Ranged) Attack Roll: [+-]\d+(, reach \d+ ft\.)?(,? (or )?range [\d/]+ ft\.)? Hit: \d+ \([^)]+\) \w+ damage(,? (plus|and) \d+ \([^)]+\) \w+ damage)*\.')


def hit_es(en: str):
    """'Hit: 5 (1d6 + 2) Slashing damage plus 7 (2d6) Fire damage' → Spanish, without the rest of the sentence."""
    m = re.search(r'Hit: ((?:' + DMG_RE + r')(?:,? (?:plus|and) ' + DMG_RE + r')*)', en)
    if not m:
        m2 = re.search(r'Hit: (\d+) (\w+) damage', en)
        return f'Impacto: {de_dano(m2.group(1), m2.group(2))}' if m2 else None
    pieces = [de_dano(f'{a} ({d})', t) for a, d, t in re.findall(DMG_RE, m.group(1))]
    return 'Impacto: ' + ' más '.join(pieces)


def avg(dice: str) -> int:
    total = 0.0
    for sign, n, s, k in re.findall(r'([+-]?)\s*(?:(\d*)d(\d+)|(\d+))', dice.replace(' ', '')):
        v = (int(n or 1) * (int(s) + 1) / 2) if s else int(k)
        total += -v if sign == '-' else v
    return int(total)


FEM_WORDS = {'esfinge', 'serpiente', 'hidra', 'saga', 'quimera', 'medusa', 'momia', 'gárgola', 'mantícora', 'araña', 'arpía', 'harpía', 'sombra', 'rana',
             'rata', 'cabra', 'abeja', 'avispa', 'águila', 'lechuza', 'orca', 'pantera', 'hiena', 'mula', 'yegua', 'oca', 'tortuga', 'ballena', 'bruja',
             'aparición', 'manada', 'nube', 'mente', 'calavera', 'boca', 'ciempiés', 'cría', 'tarasca', 'larva', 'gelatina', 'jalea', 'mantis', 'mosca',
             'langosta', 'barracuda', 'víbora', 'cobra', 'pitón', 'serpiente', 'salamandra', 'babosa', 'banshee', 'dríade', 'ninfa', 'sirena', 'lamia', 'naga',
             'mefítica', 'criatura', 'planta', 'enredadera', 'garza', 'gaviota', 'golondrina', 'zarigüeya', 'comadreja', 'llama', 'jirafa', 'mofeta', 'cebra',
             'chacal', 'gata', 'loba', 'mantis', 'piraña', 'sanguijuela', 'garrapata', 'cucaracha', 'ameba', 'esfera', 'espada', 'armadura', 'alfombra', 'estatua',
             'bestia', 'vaca', 'oveja', 'gallina', 'cierva', 'osa', 'zorra'}


def feminine(name: str) -> bool:
    first = name.split()[0].lower() if name.split() else ''
    return first in FEM_WORDS


def resolve(es_html: str, en: str, name_es: str, items_es: dict, items_en_by_id: dict):
    """Returns (spanish text, ok)."""
    t = html.unescape(es_html)
    t = re.sub(r'</p>\s*<p[^>]*>', '\n\n', t)
    t = re.sub(r'<br\s*/?>', '\n', t)
    t = re.sub(r'</?em>', '_', t)
    t = re.sub(r'</?strong>', '**', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'@UUID\[[^\]]*\]\{([^}]*)\}', r'\1', t)
    t = re.sub(r'@Embed\[[^\]]*\]', '', t)
    t = re.sub(r'&Reference\[([^\]]*)\]\{([^}]*)\}', r'\2', t)
    t = re.sub(r'&Reference\[([^\] ]+(?: [^\]=]+)*?)(?: [a-z]+=[^\]]*)?\]', lambda m: REF.get(m.group(1).lower(), m.group(1)), t)
    t = re.sub(r'\[\[lookup @name lowercase\]\]', name_es.lower(), t)
    if feminine(name_es):
        low = re.escape(name_es.lower())
        t = re.sub(r'\bEl (' + low + r')', r'La \1', t)
        t = re.sub(r'\bdel (' + low + r')', r'de la \1', t)
        t = re.sub(r'\bal (' + low + r')', r'a la \1', t)
        t = re.sub(r'\bel (' + low + r')', r'la \1', t)
    t = re.sub(r'\[\[lookup @name\]\]', name_es, t)
    t = re.sub(r'\[\[/r ([^\]#]+)(?:#[^\]]*)?\]\]', lambda m: m.group(1).strip(), t)

    def item(m):
        ref = m.group(1).strip()
        key = ref[1:] if ref.startswith('.') else None
        if key and key in items_es:
            return items_es[key]['name']
        for iid, en_name in items_en_by_id.items():
            if en_name.lower() == ref.lower() and iid in items_es:
                return items_es[iid]['name']
        return ref
    t = re.sub(r'\[\[/item ([^\]]+)\]\]', item, t)

    ok = True
    atk = attack_es(en)
    hit = hit_es(en)
    if '[[/attack' in t:
        if not atk:
            ok = False
        t = re.sub(r'\[\[/attack[^\]]*\]\]', atk or '', t)
    t = re.sub(r'\[\[/damage (average )?extended[^\]]*\]\]', '[[/damage average extended]]', t)
    t = re.sub(r'\[\[/damage average activity=[^\]]*\]\]', '[[/damage average]]', t)
    if '[[/damage average extended]]' in t:
        if not hit:
            ok = False
        t = t.replace('[[/damage average extended]]', hit or '')
    # Explicit damage: [[/damage 1d4 slashing average]] / [[/damage 5 type=fire]]
    def explicit(m):
        body = m.group(1)
        tm = re.search(r'type=(\w+)', body) or re.search(r'\b(' + '|'.join(DMG) + r')\b', body)
        dice = re.sub(r'\b(average|extended|type=\w+|' + '|'.join(DMG) + r')\b', '', body).strip()
        if not tm or not dice:
            return None
        amount = f'{avg(dice)} ({dice})' if 'd' in dice else dice
        return f'{amount}\u0000{dmg_type(tm.group(1))}'
    def explicit_sub(m):
        r = explicit(m)
        nonlocal ok
        if r is None:
            ok = False
            return m.group(0)
        return r
    t = re.sub(r'\[\[/damage ((?!average\]\])(?!average extended)[^\]]+)\]\]', explicit_sub, t)
    # "<amount>\0<type> de daño" → "<amount> de daño <type>"
    t = re.sub(r'(\S+(?: \([^)]*\))?)\u0000(\S+) de daño', lambda m: f'{m.group(1)} de daño {"de " if m.group(2) in NOUN else ""}{m.group(2)}', t)
    t = re.sub(r'(\S+(?: \([^)]*\))?)\u0000(\S+)', lambda m: de_dano(m.group(1), m.group(2)).replace(' de daño de ', ' de ').replace(' de daño ', ' '), t)

    # Plain [[/damage average]] (failure lines): the first English damage of a Failure/Hit clause, in order.
    en_dmgs = re.findall(DMG_RE, en)
    idx = [0]
    def plain(m):
        nonlocal ok
        # skip damages already used by "Hit:" (extended)
        if idx[0] < len(en_dmgs):
            a, d, ty = en_dmgs[idx[0]]
            idx[0] += 1
            return f'{a} ({d}) {dmg_type(ty)}'
        ok = False
        return m.group(0)
    if '[[/damage average]]' in t:
        fail = re.search(r'Failure: ' + DMG_RE, en)
        if fail:
            en_dmgs = [fail.groups()] + [x for x in en_dmgs if x != fail.groups()]
        t = re.sub(r'\[\[/damage average\]\]', plain, t)
        t = re.sub(r'(\d+ \([^)]*\)) (\S+) de daño', lambda m: f'{m.group(1)} de daño {"de " if m.group(2) in NOUN else ""}{m.group(2)}', t)
    if '[[/healing average]]' in t:
        h = re.search(r'regains (\d+ \([^)]+\)) Hit Points', en) or re.search(r'regains (\d+) Hit Points', en)
        t = t.replace('[[/healing average]]', f'{h.group(1)} puntos de golpe' if h else '[[x]]')

    # Lookups filled from the English text of the same feature.
    dcs = re.findall(r'DC (\d+)', en)
    saves = re.findall(r'(\w+) Saving Throw: DC (\d+)', en)
    def lookup(m):
        nonlocal ok
        key = m.group(1)
        if key.startswith('@save.dc'):
            return dcs.pop(0) if dcs else '?'
        if key.startswith('@range.value'):
            r = re.search(r'within (\d+) (?:feet|ft\.)', en)
            return r.group(1) if r else '?'
        if key.startswith('@target.template.size'):
            r = re.search(r'(\d+)-foot', en)
            return r.group(1) if r else '?'
        if key.startswith('@target.template.units'):
            return 'pies'
        if key.startswith('@damage.onSave'):
            if re.search(r'Success: Half damage', en):
                return '\u0001'
            return '?'
        if key.startswith('@target.template.type'):
            r = re.search(r'\d+-foot(?:-long)?(?:, \d+-foot-wide)? (Emanation|Cone|Sphere|Cube|Line|Cylinder)', en)
            return SHAPE[r.group(1).lower()].lower() if r else '?'
        if key.startswith('@target.template.width'):
            r = re.search(r'(\d+)-foot-wide', en)
            return r.group(1) if r else '?'
        if key.startswith('@target.affects.type'):
            r = re.search(r'DC \d+, (?:each|one|any) (\w+)', en)
            return {'creature': 'criatura', 'object': 'objeto'}.get(r.group(1), '?') if r else 'criatura'
        if key.startswith('@target.affects.labels.statblock'):
            r = re.search(r'DC \d+, (each creature|one creature|each other creature|one target|each target)', en)
            return {'each creature': 'cada criatura', 'one creature': 'una criatura', 'each other creature': 'cada otra criatura',
                    'one target': 'un objetivo', 'each target': 'cada objetivo'}.get(r.group(1), '?') if r else '?'
        if key.startswith('@target.affects.special'):
            return '?'
        if key.startswith('@skills.') and key.endswith('.passive'):
            r = re.search(r'escape DC (\d+)', en)
            return r.group(1) if r else '?'
        return '?'
    t = re.sub(r'\[\[lookup ([^\]]+)\]\]', lookup, t)

    t = re.sub(r'\u0001( de daño)?', 'la mitad del daño', t)
    t = re.sub(r'(\d+)-pies (cono|cubo|cilindro|emanación|esfera|línea)', lambda m: f'{m.group(1)} pies {m.group(2)}', t)
    t = re.sub(r'un (\d+ pies) (cono|cubo|cilindro|emanación|esfera|línea)', lambda m: f'un(a) {m.group(1)} {m.group(2)}', t)
    t = t.replace('_Fracaso:_', '_Fallo:_').replace('_Fracaso: _', '_Fallo:_ ')
    t = re.sub(r'_Éxito:_ ?(La )?[Mm]itad del daño\.', '_Éxito:_ La mitad del daño.', t)
    t = re.sub(r'(_Éxito:_ ?)la mitad', r'\1La mitad', t)
    t = re.sub(r'(\d+)\+ pies', lambda m: meters(m.group(1)).replace(' m', '+ m'), t)
    t = re.sub(r'(\d+) pies', lambda m: meters(m.group(1)), t)
    # "un(a) 9 m cono" → "un cono de 9 m"; lines: "un(a) 9 m de largo por 1,5 m de ancho, línea" → "una línea de 9 m de largo y 1,5 m de ancho"
    gender = {'cono': 'un', 'cubo': 'un', 'cilindro': 'un', 'emanación': 'una', 'esfera': 'una', 'línea': 'una'}
    t = re.sub(r'un\(a\) (\S+ m) de largo por (\S+ m) de ancho,? ?l[ií]nea', r'una línea de \1 de largo y \2 de ancho', t)
    t = re.sub(r'un\(a\) (\S+ m) (cono|cubo|cilindro|emanación|esfera|línea)', lambda m: f'{gender[m.group(2)]} {m.group(2)} de {m.group(1)}', t)
    t = re.sub(r'\b[Rr]estringid([oa]s?)\b', lambda m: ('A' if m.group(0)[0] == 'R' else 'a') + 'presad' + m.group(1), t)
    t = re.sub(r'_Éxito:_ ?Mitad de daño\.', '_Éxito:_ La mitad del daño.', t)
    t = re.sub(r'_(\w[^_]*?): _', r'_\1:_ ', t)
    t = re.sub(r'\bDC (\d+)', r'CD \1', t)
    t = re.sub(r'[ \t]+', ' ', t).replace(' ,', ',').replace(' .', '.')
    t = re.sub(r'\n{3,}', '\n\n', t).strip()
    if '?' in re.sub(r'¿[^?]*\?', '', t) and re.search(r'(?<![¿\w])\?(?!\w)|\s\?\s|\?(?=[,.)])', t):
        ok = False
    if re.search(r'\[\[|&Reference|@\w+\[|\u0000', t):
        ok = False
    return t, ok


# --- Foundry English actors: id → (name, {item id → item name}) ---------------------------------
actors = {}
for p in glob.glob(f'{FVTT}/**/*.yml', recursive=True):
    t = open(p).read()
    top = re.search(r'^_id: (\S+)', t, re.M)
    name = re.search(r'^name: (.+)$', t, re.M)
    if not top or not name:
        continue
    items = {m.group(1): m.group(2).strip().strip("'\"") for m in re.finditer(r'^  - _id: (\S+)\n(?:    .*\n|\s*\n)*?    name: (.+)$', t, re.M)}
    actors[name.group(1).strip().strip("'\"").lower()] = (top.group(1), items)

FAILS = []
es = json.load(open(ES))['entries']
app = json.load(open(APP))
out = {}
stats = {'features': 0, 'ok': 0, 'monsters': 0}
for mon in app:
    found = actors.get(mon['name']['en'].lower())
    if not found or found[0] not in es:
        continue
    aid, items_en = found
    items_es = es[aid].get('items', {})
    name_es = mon['name'].get('es') or mon['name']['en']
    en_by_name = {v.lower(): k for k, v in items_en.items()}
    feats = {}
    for group in ('special_abilities', 'actions', 'bonus_actions', 'reactions', 'legendary_actions'):
        for f in mon['data'].get(group) or []:
            stats['features'] += 1
            base = re.sub(r'\s*\((?:\d+/Day|Recharge [^)]*|[^)]*Day[^)]*|Costs \d+ Actions?)\)$', '', f['name']).strip()
            iid = en_by_name.get(base.lower()) or en_by_name.get(f['name'].lower())
            if not iid or iid not in items_es:
                # A plain attack with nothing else in it can be rebuilt from its numbers.
                if base in ATTACKS and PURE_ATTACK.fullmatch(f.get('desc', '')):
                    feats[f'{group}:{f["name"]}'] = {'name': ATTACKS[base] + f['name'][len(base):], 'desc': f"{attack_es(f['desc'])}. {hit_es(f['desc'])}."}
                    stats['ok'] += 1
                continue
            tr = items_es[iid]
            text, ok = resolve(tr.get('description', ''), f.get('desc', ''), name_es, items_es, items_en)
            entry = {'name': tr['name'] + f['name'][len(base):].replace('Day', 'día').replace('Recharge', 'Recarga').replace('Costs', 'Cuesta').replace('Actions', 'acciones').replace('Action', 'acción')}
            if not ok:
                pass
            if ok and text:
                entry['desc'] = text
                stats['ok'] += 1
            feats[f'{group}:{f["name"]}'] = entry
    if feats:
        out[mon['id']] = feats
        stats['monsters'] += 1
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
print(stats)

