import { autoEs, feetToMeters } from '../lib/auto-es';

test.each([
  [5, '1,5 m'],
  [10, '3 m'],
  [15, '4,5 m'],
  [30, '9 m'],
  [60, '18 m'],
  [90, '27 m'],
  [120, '36 m'],
  [150, '45 m'],
  [500, '150 m'],
  [5280, '1,5 km'],
])('%i ft -> %s', (ft, m) => expect(feetToMeters(ft)).toBe(m));

test.each([
  ['Action', 'Acción'],
  ['Bonus Action', 'Acción adicional'],
  ['Reaction', 'Reacción'],
  ['1 minute', '1 minuto'],
  ['10 minutes', '10 minutos'],
  ['1 hour', '1 hora'],
  ['8 hours', '8 horas'],
  ['24 hours', '24 horas'],
  ['10 days', '10 días'],
  ['Instantaneous', 'Instantánea'],
  ['Until dispelled', 'Hasta que se disipe'],
  ['Until dispelled or triggered', 'Hasta que se disipe o se active'],
  ['up to 1 minute', 'Concentración, hasta 1 minuto'],
  ['up to 1 hour', 'Concentración, hasta 1 hora'],
  ['Self', 'Personal'],
  ['Touch', 'Toque'],
  ['Sight', 'Vista'],
  ['Unlimited', 'Ilimitado'],
  ['Special', 'Especial'],
  ['90 feet', '27 m'],
  ['1 mile', '1,5 km'],
  ['500 miles', '750 km'],
  ['Self (15-foot Cone)', 'Personal (cono de 4,5 m)'],
  ['Self (30-foot Emanation)', 'Personal (emanación de 9 m)'],
  ['Self (100-foot Line)', 'Personal (línea de 30 m)'],
  ['Self (10-foot-radius Sphere)', 'Personal (esfera de 3 m de radio)'],
  ['Bonus Action or Ritual', 'Acción adicional o ritual'],
])('"%s" -> "%s"', (en, es) => expect(autoEs(en)).toBe(es));

test('unknown phrase returns undefined', () => {
  expect(autoEs('Something odd')).toBeUndefined();
});
