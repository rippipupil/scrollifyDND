/** Parses SRD 5.2.1 spells.md into clean spell bodies keyed by slug. */
import * as fs from 'node:fs';

export interface MdSpell {
  name: string;
  text: string;
  higherLevel?: string;
}

const HEADER_LINE = /^_(?:Level \d+ \w+|\w+ Cantrip) \(.*\)_$/;

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Joins hard-wrapped lines inside paragraphs; keeps blank-line paragraphs, table rows and list items. */
export function joinSoftBreaks(s: string): string {
  const isBlock = (l: string) => /^\s*(\||[-*•] |\d+\. )/.test(l);
  return s
    .split(/\n{2,}/)
    .map((para) =>
      para
        .split('\n')
        .reduce<string[]>((acc, line) => {
          const prev = acc[acc.length - 1];
          if (prev !== undefined && !isBlock(line) && !isBlock(prev)) acc[acc.length - 1] = `${prev} ${line.trim()}`;
          else acc.push(line.trim());
          return acc;
        }, [])
        .join('\n'),
    )
    .join('\n\n');
}

export function parseSpellsMd(file: string): Map<string, MdSpell> {
  const md = fs.readFileSync(file, 'utf8');
  const out = new Map<string, MdSpell>();
  for (const part of md.split(/^#### /m).slice(1)) {
    const lines = part.split('\n');
    const name = lines[0].trim();
    const headerIdx = lines.findIndex((l, i) => i > 0 && l.trim() !== '');
    if (headerIdx < 0 || !HEADER_LINE.test(lines[headerIdx].trim())) continue;
    const durIdx = lines.findIndex((l) => l.startsWith('**Duration:**'));
    let body = lines
      .slice(durIdx + 1)
      .join('\n')
      .replace(/^#{1,3} .*$/gm, '')
      .trim();
    let higherLevel: string | undefined;
    const hl = /\n*_Using a Higher-Level Spell Slot\._\s*([\s\S]*)$/.exec(body);
    if (hl) {
      higherLevel = joinSoftBreaks(hl[1].trim());
      body = body.slice(0, hl.index).trim();
    }
    out.set(slug(name), { name, text: joinSoftBreaks(body.replace(/\n{3,}/g, '\n\n')), higherLevel });
  }
  return out;
}
