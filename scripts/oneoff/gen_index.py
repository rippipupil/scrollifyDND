"""One-off generator: index of 2014 (legacy) options from the user's PDF and of 2024-era options from newer books.
Facts only (name, book, page, class, size/speed/darkvision, feat type) from 5etools data; no rules text.
Writes data/external/legacy-2014.json, data/external/books-2024.json and a review report (markdown).
Usage: python3 -I gen_index.py <5etools data dir> <repo dir> <report path>
"""
import concurrent.futures as cf
import glob
import json
import os
import re
import subprocess
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from names import BACKGROUND_ES, CLASS_ES, FEAT_ES, SPECIES_ES, SUBCLASS_ES  # noqa: E402

DATA, REPO, REPORT = sys.argv[1], sys.argv[2], sys.argv[3]
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'url-cache.json')

BOOKS = {b['id']: b['name'] for b in json.load(open(os.path.join(DATA, 'books.json')))['book']}
BOOKS.update({'PHB': "Player's Handbook (2014)", 'DMG': "Dungeon Master's Guide (2014)", 'XPHB': "Player's Handbook (2024)"})
SHORT = {
    'PHB': 'PHB 2014', 'DMG': 'DMG 2014', 'SCAG': 'SCAG', 'VGM': 'Volo', 'OGA': 'One Grung Above', 'XGE': 'Xanathar', 'MTF': 'Mordenkainen (Tome of Foes)',
    'GGR': 'Ravnica', 'AI': 'Acquisitions Inc.', 'ERLW': 'Eberron 2019', 'EGW': 'Wildemount', 'MOT': 'Theros', 'TCE': 'Tasha', 'VRGR': 'Van Richten (Ravenloft)',
    'FTD': 'Fizban', 'SCC': 'Strixhaven', 'MPMM': 'Monsters of the Multiverse', 'BGG': 'Bigby', 'DSotDQ': 'Dragonlance', 'LR': 'Locathah Rising', 'TTP': 'The Tortle Package',
    'WBtW': 'Witchlight', 'XPHB': 'PHB 2024', 'EFA': 'Eberron: Forge of the Artificer', 'FRHoF': 'Heroes of Faerûn', 'AU': 'Arcana Unleashed',
    'RHW': 'Ravenloft: The Horrors Within', 'ABH': "Astarion's Book of Hungers", 'LFL': 'Lorwyn: First Light',
}
PDF_SOURCES = {'PHB', 'DMG', 'SCAG', 'XGE', 'TCE', 'EGW', 'FTD', 'BGG', 'VRGR', 'DSotDQ', 'MPMM', 'OGA', 'LR', 'AI', 'MOT', 'GGR', 'SCC', 'VGM', 'MTF', 'EEPC', 'WBtW', 'TTP'}
NEW_SOURCES = {'EFA', 'FRHoF', 'AU', 'RHW', 'ABH', 'LFL'}


def slug(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn').lower()
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', s.replace("'", '').replace('’', '')))


def load(name):
    return json.load(open(os.path.join(DATA, name)))


# --- what the app already has -------------------------------------------------------------------
app = []
for f in glob.glob(os.path.join(REPO, 'assets/data/*.json')):
    if f.endswith(('spell-icons.json', 'external.json')):
        continue
    app += json.load(open(f))
# Only the hand-made indexes count as "already there", never this script's own output.
for f in ('phb2024.json', 'spells-official.json'):
    app += json.load(open(os.path.join(REPO, 'data/external', f)))
have = {(e['category'], slug(e['name']['en'])) for e in app}
have |= {(e['category'], slug(e['name']['en'].replace('-', ' '))) for e in app}


def in_app(cat, name):
    return (cat, slug(name)) in have or (cat, slug(name.replace('-', ' '))) in have


# --- link checking ------------------------------------------------------------------------------
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}


def ok(url):
    if url in cache:
        return cache[url]
    r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', '--max-time', '25', url], capture_output=True, text=True)
    cache[url] = r.stdout.strip() == '200'
    return cache[url]


def first_ok(cands):
    seen = []
    for c in cands:
        if c not in seen:
            seen.append(c)
    with cf.ThreadPoolExecutor(8) as ex:
        res = list(ex.map(ok, seen))
    for c, good in zip(seen, res):
        if good:
            return c
    return None


def google(site, q):
    from urllib.parse import quote_plus
    return 'https://www.google.com/search?q=' + quote_plus(f'site:{site} {q}')


PREFIXES = ['Path of the ', 'Path of ', 'College of the ', 'College of ', 'Circle of the ', 'Circle of ', 'Way of the ', 'Way of ', 'Oath of the ', 'Oath of ',
            'School of ', 'The ', 'Order of ', 'Warrior of the ', 'Warrior of ']


def subclass_links(cls, name, short, era):
    host = 'dnd5e' if era == '2014' else 'dnd2024'
    bases = [name, short or name]
    for p in PREFIXES:
        if name.startswith(p):
            bases.append(name[len(p):])
    for suf in [' Domain', ' Magic', ' Sorcery', ' Patron']:
        bases += [b[: -len(suf)] for b in list(bases) if b.endswith(suf)]
    cands = [f'https://{host}.wikidot.com/{cls}:{slug(b)}' for b in bases]
    w = first_ok(cands)
    return w


def page_link(host, kind, names):
    return first_ok([f'https://{host}.wikidot.com/{kind}:{slug(n)}' for n in names])


def links_for(entry_name_en, entry_name_es, wikidot):
    out = {}
    if wikidot:
        out['wikidot'] = wikidot
    else:
        out['wikidot'] = google('wikidot.com', entry_name_en)
    out['nivel20'] = google('nivel20.com', entry_name_es or entry_name_en)
    return out


legacy, new, report = [], [], {}

# --- classes / subclasses -----------------------------------------------------------------------
subs = {}
classes = {}
for f in sorted(glob.glob(os.path.join(DATA, 'class/class-*.json'))):
    d = json.load(open(f))
    for c in d.get('class', []):
        classes[(c['name'], c['source'])] = c
    for s in d.get('subclass', []):
        subs.setdefault((s['name'], s['className'], s['source']), s)

art = classes[('Artificer', 'EFA')]
art_entry = {
    'category': 'class', 'name': {'en': 'Artificer', 'es': 'Artífice'}, 'book': SHORT['EFA'], 'slugEn': 'artificer',
    'data': {'era': '2024', 'page': art.get('page'), 'hitDie': 8, 'saves': ['con', 'int'], 'primaryAbility': ['int'], 'casterType': 'half', 'spellAbility': 'int',
             'proficiencies': ['light-armor', 'medium-armor', 'shields', 'simple-weapons'],
             'skillChoices': [{'choose': 2, 'options': ['skill-' + slug(s) for s in art['startingProficiencies']['skills'][0]['choose']['from']]}],
             'tools': ["Thieves' Tools", "Tinker's Tools", "Artisan's Tools (1)"],
             'subclasses': []},
    'links': {'wikidot': 'https://dnd2024.wikidot.com/artificer:main', 'nivel20': google('nivel20.com', 'Artífice')},
}

pdf_subclasses = []  # report rows
for (name, cname, src), s in sorted(subs.items(), key=lambda x: (x[0][1], x[1].get('page') or 0)):
    cls = cname.lower()
    if cls not in CLASS_ES:
        continue
    era = '2024' if src in NEW_SOURCES or src == 'XPHB' else '2014'
    if src in PDF_SOURCES and src not in ('MPMM',):
        rep = (s.get('reprintedAs') or [None])[0]
        rep_name = rep_src = None
        if rep:
            parts = rep.split('|')
            rep_short, rep_src = parts[0], parts[3] if len(parts) > 3 else parts[2]
            full = next((k for k in subs if k[1] == cname and k[2] == rep_src and (subs[k].get('shortName') == rep_short or k[0] == rep_short)), None)
            rep_name = full[0] if full else rep_short
        pdf_subclasses.append({'cls': cls, 'en': name, 'es': SUBCLASS_ES.get((cls, name), name), 'src': src, 'page': s.get('page'),
                               'rep': rep_name, 'repSrc': rep_src, 'repEs': SUBCLASS_ES.get((cls, rep_name), rep_name) if rep_name else None})
        if not rep and not in_app('subclass', name):
            es = SUBCLASS_ES.get((cls, name))
            assert es, ('missing es', cls, name)
            w = subclass_links(cls, name, s.get('shortName'), '2014')
            legacy.append({'category': 'subclass', 'name': {'en': name, 'es': es}, 'book': SHORT[src], 'slugEn': f'{slug(name)}-2014' if in_app('subclass', name) else None,
                           'data': {'classId': cls, 'era': '2014', 'page': s.get('page'), 'legacy': True}, 'links': links_for(name, es, w)})
    elif src in NEW_SOURCES:
        if in_app('subclass', name) and src != 'EFA':
            continue
        es = SUBCLASS_ES.get((cls, name))
        assert es, ('missing es', cls, name)
        w = subclass_links(cls, name, s.get('shortName'), '2024')
        new.append({'category': 'subclass', 'name': {'en': name, 'es': es}, 'book': SHORT[src], 'slugEn': f'{cls}-{slug(name)}' if cls == 'artificer' else None,
                    'data': {'classId': cls, 'era': '2024', 'page': s.get('page'), 'casterType': None}, 'links': links_for(name, es, w)})
        if cls == 'artificer':
            art_entry['data']['subclasses'].append(f'ext-subclass-{cls}-{slug(name)}')
new.insert(0, art_entry)
report['subclasses'] = pdf_subclasses

# --- species ------------------------------------------------------------------------------------
races = load('races.json')['race']
SIZE = {'S': 'Small', 'M': 'Medium', 'L': 'Large', 'T': 'Tiny'}


def species_data(r, era):
    sz = r.get('size') or []
    size = ' or '.join(SIZE.get(x, x) for x in sz)
    sp = r.get('speed')
    speed = sp if isinstance(sp, int) else (sp or {}).get('walk') if isinstance(sp, dict) else None
    d = {'era': era, 'page': r.get('page'), 'size': size or None, 'speed': speed, 'darkvision': r.get('darkvision') or 0}
    return {k: v for k, v in d.items() if v is not None}


LEGACY_RACES = [('Aarakocra', 'MPMM'), ('Bugbear', 'MPMM'), ('Centaur', 'MPMM'), ('Deep Gnome', 'MPMM'), ('Duergar', 'MPMM'), ('Eladrin', 'MPMM'), ('Fairy', 'MPMM'),
                ('Firbolg', 'MPMM'), ('Genasi', 'MPMM'), ('Githyanki', 'MPMM'), ('Githzerai', 'MPMM'), ('Goblin', 'MPMM'), ('Harengon', 'MPMM'), ('Hobgoblin', 'MPMM'),
                ('Kenku', 'MPMM'), ('Kobold', 'MPMM'), ('Lizardfolk', 'MPMM'), ('Minotaur', 'MPMM'), ('Satyr', 'MPMM'), ('Sea Elf', 'MPMM'), ('Shadar-Kai', 'MPMM'),
                ('Tabaxi', 'MPMM'), ('Tortle', 'MPMM'), ('Triton', 'MPMM'), ('Yuan-Ti', 'MPMM'), ('Owlin', 'SCC'), ('Grung', 'OGA'), ('Locathah', 'LR'), ('Verdan', 'AI'),
                ('Leonin', 'MOT'), ('Loxodon', 'GGR'), ('Simic Hybrid', 'GGR'), ('Vedalken', 'GGR'), ('Half-Orc', 'PHB'), ('Half-Elf', 'PHB'), ('Dragonborn (Gem)', 'FTD')]
race_by = {(r['name'], r['source']): r for r in races}
for name, src in LEGACY_RACES:
    r = race_by[(name, src)]
    es = SPECIES_ES[name]
    w = page_link('dnd5e', 'lineage', [name, name.replace('(Gem)', '').strip(), name.split(' (')[0]])
    legacy.append({'category': 'species', 'name': {'en': name, 'es': es}, 'book': SHORT[src], 'data': {**species_data(r, '2014'), 'legacy': True}, 'links': links_for(name, es, w)})
for r in races:
    if r['source'] in NEW_SOURCES:
        name = r['name']
        disp = 'Elf (Lorwyn)' if name == 'Elf' else name
        es = SPECIES_ES[name]
        w = page_link('dnd2024', 'species', [name, f'{name}-lorwyn', disp])
        new.append({'category': 'species', 'name': {'en': disp, 'es': es}, 'book': SHORT[r['source']], 'data': species_data(r, '2024'), 'links': links_for(disp, es, w)})

# --- backgrounds --------------------------------------------------------------------------------
bgs = load('backgrounds.json')['background']
report['backgrounds'] = []
for b in bgs:
    if b['source'] in ('PHB', 'SCAG') and not b['name'].startswith(('Variant', 'Custom')):
        rep = (b.get('reprintedAs') or [None])[0]
        report['backgrounds'].append({'en': b['name'], 'src': b['source'], 'rep': rep.split('|')[0] if rep else None})
        if not rep and not in_app('background', b['name']):
            es = BACKGROUND_ES[b['name']]
            w = page_link('dnd5e', 'background', [b['name']])
            legacy.append({'category': 'background', 'name': {'en': b['name'], 'es': es}, 'book': SHORT[b['source']], 'data': {'era': '2014', 'page': b.get('page'), 'legacy': True},
                           'links': links_for(b['name'], es, w)})
    elif b['source'] in NEW_SOURCES and not in_app('background', b['name']):
        es = BACKGROUND_ES[b['name']]
        w = page_link('dnd2024', 'background', [b['name']])
        new.append({'category': 'background', 'name': {'en': b['name'], 'es': es}, 'book': SHORT[b['source']], 'data': {'era': '2024', 'page': b.get('page')}, 'links': links_for(b['name'], es, w)})

# --- feats --------------------------------------------------------------------------------------
FEAT_TYPE = {'O': 'origin', 'G': 'general', 'FS': 'fighting-style', 'EB': 'epic-boon', 'D': 'dragonmark', 'DG': 'dark-gift'}
feats = load('feats.json')['feat']
report['feats'] = []
for f in feats:
    name, src = f['name'], f['source']
    cat = (f.get('category') or '').split(':')[0]
    if src in ('PHB', 'XGE', 'TCE', 'FTD'):
        rep = (f.get('reprintedAs') or [None])[0]
        report['feats'].append({'en': name, 'src': src, 'rep': rep.split('|')[0] if rep else None})
        if not rep and not in_app('feat', name):
            es = FEAT_ES[name]
            w = page_link('dnd5e', 'feat', [name])
            pre = [p.get('race') for p in f.get('prerequisite', []) if p.get('race')]
            data = {'era': '2014', 'page': f.get('page'), 'legacy': True}
            if pre:
                data['racial'] = True
            legacy.append({'category': 'feat', 'name': {'en': name, 'es': es}, 'book': SHORT[src], 'data': data, 'links': links_for(name, es, w)})
    elif (src in NEW_SOURCES or src == 'XPHB') and not in_app('feat', name):
        es = FEAT_ES[name]
        w = page_link('dnd2024', 'feat', [name])
        new.append({'category': 'feat', 'name': {'en': name, 'es': es}, 'book': SHORT[src], 'data': {'era': '2024', 'page': f.get('page'), 'type': FEAT_TYPE.get(cat, cat or None)},
                    'links': links_for(name, es, w)})

json.dump(cache, open(CACHE, 'w'), indent=0)


def clean(lst):
    for e in lst:
        if not e.get('slugEn'):
            e.pop('slugEn', None)
    return lst


json.dump(clean(legacy), open(os.path.join(REPO, 'data/external/legacy-2014.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(clean(new), open(os.path.join(REPO, 'data/external/books-2024.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(report, open(REPORT, 'w'), ensure_ascii=False, indent=1)
from collections import Counter  # noqa: E402

print('legacy', len(legacy), Counter(e['category'] for e in legacy))
print('new', len(new), Counter(e['category'] for e in new))
print('wikidot verified', sum(1 for e in legacy + new if 'google' not in e['links']['wikidot']), 'of', len(legacy + new))
