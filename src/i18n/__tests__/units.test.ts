import { convertDistances, formatDistance, formatMiles, resolveUnit } from '../units';

test('auto follows the language', () => {
  expect(resolveUnit('auto', 'es')).toBe('m');
  expect(resolveUnit(undefined, 'en')).toBe('ft');
  expect(resolveUnit('ft', 'es')).toBe('ft');
  expect(resolveUnit('m', 'en')).toBe('m');
});

test('numeric distances use the Spanish books conversion (5 ft = 1,5 m)', () => {
  expect(formatDistance(30, 'es', 'm')).toBe('9 m');
  expect(formatDistance(5, 'es', 'm')).toBe('1,5 m');
  expect(formatDistance(5, 'en', 'm')).toBe('1.5 m');
  expect(formatDistance(30, 'es', 'ft')).toBe('30 pies');
  expect(formatDistance(30, 'en', 'ft')).toBe('30 ft');
  expect(formatMiles(1, 'es', 'm')).toBe('1,5 km');
  expect(formatMiles(1, 'es', 'ft')).toBe('1 milla');
  expect(formatMiles(3, 'en', 'ft')).toBe('3 miles');
});

test('Spanish texts in metres can be read in feet', () => {
  expect(convertDistances('Una esfera de 6 metros de radio a 45 m de ti.', 'es', 'ft')).toBe('Una esfera de 20 pies de radio a 150 pies de ti.');
  expect(convertDistances('Te mueves 1,5 m. Alcance 24/96 m.', 'es', 'ft')).toBe('Te mueves 5 pies. Alcance 80/320 pies.');
  expect(convertDistances('Viajas 1,5 km por hora.', 'es', 'ft')).toBe('Viajas 1 milla por hora.');
  // Words that only start with m, and minutes, stay as they are.
  expect(convertDistances('Dura 10 minutos y 1 min más; 3 mapas.', 'es', 'ft')).toBe('Dura 10 minutos y 1 min más; 3 mapas.');
});

test('English texts in feet can be read in metres', () => {
  expect(convertDistances('a 20-foot-radius Sphere within 150 feet', 'en', 'm')).toBe('a 6-meter-radius Sphere within 45 m');
  expect(convertDistances('Speed 30 ft., fly 60 ft. Range 80/320 ft.', 'en', 'm')).toBe('Speed 9 m, fly 18 m. Range 24/96 m.');
  expect(convertDistances('up to 1,000 feet away or 2 miles', 'en', 'm')).toBe('up to 300 m away or 3 km');
  // English fallback text shown in Spanish uses the decimal comma.
  expect(convertDistances('within 5 feet of you', 'es', 'm')).toBe('within 1,5 m of you');
});

test('texts already in the reader\'s units are left alone', () => {
  expect(convertDistances('Una línea de 18 m.', 'es', 'm')).toBe('Una línea de 18 m.');
  expect(convertDistances('A 60-foot line.', 'en', 'ft')).toBe('A 60-foot line.');
});
