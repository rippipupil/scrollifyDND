import json, re, sys, unicodedata, subprocess, concurrent.futures as cf
src, cache_p = sys.argv[1], sys.argv[2]
def slug(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')
d = json.load(open(src))
try: cache = json.load(open(cache_p))
except Exception: cache = {}
def url(m):
    s = slug(m['name']['en'])
    return f'https://www.aidedd.org/dnd/monstres.php?vo={s}' if m['data']['era'] == '2014' else f'https://www.aidedd.org/monster/{s}'
def check(u):
    if u in cache: return u, cache[u]
    out = subprocess.run(['curl', '-s', '--max-time', '20', u], capture_output=True, text=True).stdout
    t = re.search(r'<title>([^<]*)', out)
    return u, bool(t and not t.group(1).startswith('Error') and 'Monsters' in t.group(1))
with cf.ThreadPoolExecutor(6) as ex:
    for u, ok in ex.map(check, [url(m) for m in d]): cache[u] = ok
json.dump(cache, open(cache_p, 'w'), indent=0)
bad = [m['name']['en'] + ' ' + m['data']['era'] for m in d if not cache[url(m)]]
print(len(d), 'bad', len(bad)); print(bad[:60])
# Monsters AideDD doesn't have get search links instead of a broken direct link.
import urllib.parse
g = lambda site, q: 'https://www.google.com/search?q=' + urllib.parse.quote(f'site:{site} {q}', safe='')
for m in d:
    if cache[url(m)]: m.pop('links', None)
    else: m['links'] = {'aidedd': g('aidedd.org', m['name']['en']), 'nivel20': g('nivel20.com', m['name']['en'])}
json.dump(d, open(src, 'w'), indent=1, ensure_ascii=False); open(src, 'a').write('\n')
