export type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; rows: string[][] };

export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isListItem = (l: string) => /^\s*([-*•])\s+/.test(l);

/** Minimal markdown: paragraphs, ### headings, bullet lists and pipe tables. */
export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of src.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) continue;
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      const h = /^#{1,4}\s+(.*)$/.exec(l);
      if (h) {
        blocks.push({ type: 'h', text: h[1].trim() });
        i++;
      } else if (isTableRow(l)) {
        const rows: string[][] = [];
        while (i < lines.length && isTableRow(lines[i])) {
          const cells = lines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
          if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
          i++;
        }
        blocks.push({ type: 'table', rows });
      } else if (isListItem(l)) {
        const items: string[] = [];
        while (i < lines.length && isListItem(lines[i])) items.push(lines[i++].replace(/^\s*[-*•]\s+/, ''));
        blocks.push({ type: 'list', items });
      } else {
        const para: string[] = [];
        while (i < lines.length && !isTableRow(lines[i]) && !isListItem(lines[i]) && !/^#{1,4}\s/.test(lines[i])) para.push(lines[i++]);
        blocks.push({ type: 'p', lines: para });
      }
    }
  }
  return blocks;
}

/** Splits **bold**, _italic_ and *italic* runs. */
export function parseInline(s: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else out.push({ text: (m[2] ?? m[3]) as string, italic: true });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
