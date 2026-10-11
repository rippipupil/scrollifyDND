import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildAll } from './lib/build.ts';

const root = process.cwd();
const out = path.join(root, 'assets', 'data');
fs.mkdirSync(out, { recursive: true });

const all = buildAll({
  srd: path.join(root, 'data', 'srd-2024-en'),
  md: path.join(root, 'data', 'srd-md'),
  i18n: path.join(root, 'data', 'i18n', 'es'),
  external: path.join(root, 'data', 'external'),
});

for (const [name, entries] of Object.entries(all)) {
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(entries));
  const es = entries.filter((e) => e.name.es).length;
  console.log(`${name.padEnd(18)} ${String(entries.length).padStart(4)} entries, ${es} with Spanish name`);
}
