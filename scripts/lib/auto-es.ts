/** Rule-based Spanish for the formulaic spell fields (casting time, range, duration). */

export function feetToMeters(ft: number): string {
  if (ft >= 5280) return `${fmt((ft / 5280) * 1.5)} km`;
  return `${fmt(ft * 0.3)} m`;
}

function fmt(n: number): string {
  const r = Math.round(n * 10) / 10;
  return String(r).replace('.', ',');
}

const UNITS: Record<string, [string, string]> = {
  round: ['asalto', 'asaltos'],
  minute: ['minuto', 'minutos'],
  hour: ['hora', 'horas'],
  day: ['día', 'días'],
};

const FIXED: Record<string, string> = {
  action: 'Acción',
  'bonus action': 'Acción adicional',
  reaction: 'Reacción',
  instantaneous: 'Instantánea',
  'until dispelled': 'Hasta que se disipe',
  'until dispelled or triggered': 'Hasta que se disipe o se active',
  self: 'Personal',
  touch: 'Toque',
  sight: 'Vista',
  unlimited: 'Ilimitado',
  special: 'Especial',
  ritual: 'ritual',
};

const SHAPES: Record<string, string> = {
  cone: 'cono',
  cube: 'cubo',
  line: 'línea',
  sphere: 'esfera',
  emanation: 'emanación',
  cylinder: 'cilindro',
};

function time(s: string): string | undefined {
  const m = /^(\d+) (round|minute|hour|day)s?$/.exec(s);
  if (!m) return undefined;
  const n = Number(m[1]);
  return `${n} ${UNITS[m[2]][n === 1 ? 0 : 1]}`;
}

function distance(s: string): string | undefined {
  const ft = /^(\d[\d,]*) feet$/.exec(s);
  if (ft) return feetToMeters(Number(ft[1].replace(/,/g, '')));
  const mi = /^(\d+) miles?$/.exec(s);
  if (mi) return `${fmt(Number(mi[1]) * 1.5)} km`;
  return undefined;
}

export function autoEs(raw: string): string | undefined {
  const s = raw.replace(/\s+Component:.*$/i, '').trim();
  const lower = s.toLowerCase();
  if (FIXED[lower]) return FIXED[lower];

  const conc = /^(?:concentration,? )?up to (.+)$/i.exec(s);
  if (conc) {
    const t = time(conc[1]);
    return t ? `Concentración, hasta ${t}` : undefined;
  }

  const area = /^Self \((\d+)-foot(-radius)? (\w+)\)$/i.exec(s);
  if (area) {
    const shape = SHAPES[area[3].toLowerCase()];
    if (!shape) return undefined;
    const m = feetToMeters(Number(area[1]));
    return area[2] ? `Personal (${shape} de ${m} de radio)` : `Personal (${shape} de ${m})`;
  }

  const or = /^(.+) or (.+)$/.exec(s);
  if (or) {
    const a = autoEs(or[1]);
    const b = autoEs(or[2]);
    return a && b ? `${a} o ${b.charAt(0).toLowerCase()}${b.slice(1)}` : undefined;
  }

  return time(s) ?? distance(s);
}
