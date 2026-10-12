import { parseInline, parseMarkdown } from '../markdown';

test('paragraphs, headings, lists and tables become blocks', () => {
  const blocks = parseMarkdown('Intro line\n\n### Frenzy (3)\n\n- one\n- two\n\n| A | B |\n| 1 | 2 |');
  expect(blocks.map((b) => b.type)).toEqual(['p', 'h', 'list', 'table']);
  expect(blocks[2]).toMatchObject({ items: ['one', 'two'] });
  expect(blocks[3]).toMatchObject({ rows: [['A', 'B'], ['1', '2']] });
});

test('single newlines inside a paragraph become separate lines', () => {
  const [b] = parseMarkdown('**Can\'t See.** You can\'t see.\n**Attacks.** Advantage.');
  expect(b).toMatchObject({ type: 'p', lines: ["**Can't See.** You can't see.", '**Attacks.** Advantage.'] });
});

test('bullets with • are lists', () => {
  expect(parseMarkdown('• a\n• b')[0]).toMatchObject({ type: 'list', items: ['a', 'b'] });
});

test('inline bold and italics', () => {
  expect(parseInline('**Bold.** then _it_ and *also*')).toEqual([
    { text: 'Bold.', bold: true },
    { text: ' then ' },
    { text: 'it', italic: true },
    { text: ' and ' },
    { text: 'also', italic: true },
  ]);
});

test('nested and numbered list items keep their level and marker', () => {
  const [list] = parseMarkdown('- **Área:** cubo\n  - *Uno:* a\n  1. b\n- fin');
  expect(list).toMatchObject({ type: 'list', items: ['**Área:** cubo', '*Uno:* a', 'b', 'fin'], depths: [0, 1, 1, 0], markers: ['•', '•', '1.', '•'] });
});
