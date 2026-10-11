"""Dev helper: print compact English source for translation. Usage: dump.py <file> <start> <count> [fields]"""
import json, sys
f, start, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fields = sys.argv[4].split(',') if len(sys.argv) > 4 else ['name', 'text']
d = json.load(open(f))
for e in d[start:start + count]:
    out = {'id': e['id']}
    for k in fields:
        if k in ('name', 'text'):
            v = e.get(k) or {}
            out[k] = v.get('en')
        else:
            v = (e.get('data') or {}).get(k)
            out[k] = v.get('en') if isinstance(v, dict) and 'en' in v else v
    print(json.dumps({k: v for k, v in out.items() if v not in (None, '')}, ensure_ascii=False))
print(f'# total {len(d)}', file=sys.stderr)
