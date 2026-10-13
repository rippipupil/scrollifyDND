import { spellFacts } from '../spellFacts';

const silvery = {
  level: 1,
  castingTime: { n: 1, unit: 'reaction' },
  range: { kind: 'feet', amount: 60 },
  components: { v: true, s: false, m: false },
  duration: { kind: 'instant' },
};

test('Spanish facts use metric distances and Spanish units', () => {
  expect(spellFacts(silvery, 'es')).toEqual({ castingTime: '1 reacción', range: '18 m', components: 'V', duration: 'Instantánea' });
});

test('English facts keep feet', () => {
  expect(spellFacts(silvery, 'en')).toEqual({ castingTime: '1 reaction', range: '60 ft', components: 'V', duration: 'Instantaneous' });
});

test('the units setting overrides the language default', () => {
  expect(spellFacts(silvery, 'es', 'ft').range).toBe('60 pies');
  expect(spellFacts(silvery, 'en', 'm').range).toBe('18 m');
});

test('areas, costly materials, concentration and plural units', () => {
  const f = spellFacts(
    {
      castingTime: { n: 10, unit: 'minute' },
      range: { kind: 'self', area: { shape: 'cone', size: 15, unit: 'feet' } },
      components: { v: true, s: true, m: true, costGp: 100, consumed: true },
      duration: { kind: 'timed', amount: 1, unit: 'hour', concentration: true },
    },
    'es',
  );
  expect(f).toEqual({ castingTime: '10 minutos', range: 'Personal (cono de 4,5 m)', components: 'V, S, M (100 po, se consume)', duration: 'Concentración, hasta 1 hora' });
  expect(spellFacts({ range: { kind: 'touch' }, duration: { kind: 'permanent' } }, 'es')).toMatchObject({ range: 'Toque', duration: 'Hasta que se disipe' });
  expect(spellFacts({ range: { kind: 'miles', amount: 1 } }, 'es').range).toBe('1,5 km');
});

test('missing facts give empty strings, never crash', () => {
  expect(spellFacts({}, 'es')).toEqual({ castingTime: '', range: '', components: '', duration: '' });
});
