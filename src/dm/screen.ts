import type { Loc } from '../rules/types';

/**
 * DM screen: quick rules from the SRD 5.2.1 (CC BY 4.0), summarized for the table.
 * Spanish uses the metric conversions of the Spanish edition (5 ft = 1,5 m; 1 mile = 1,5 km).
 */
export interface ScreenSection {
  id: string;
  title: Loc;
  body: Loc;
}

export const DM_SCREEN: ScreenSection[] = [
  {
    id: 'dc',
    title: { en: 'Typical DCs', es: 'CD típicas' },
    body: {
      es: '| Dificultad | CD |\n|---|---|\n| Muy fácil | 5 |\n| Fácil | 10 |\n| Media | 15 |\n| Difícil | 20 |\n| Muy difícil | 25 |\n| Casi imposible | 30 |\n\nPara **Influir** en un monstruo reacio, la CD por defecto es 15 o su Inteligencia, lo que sea mayor (ventaja si es Amistoso, desventaja si es Hostil).',
      en: '| Difficulty | DC |\n|---|---|\n| Very easy | 5 |\n| Easy | 10 |\n| Medium | 15 |\n| Hard | 20 |\n| Very hard | 25 |\n| Nearly impossible | 30 |\n\nTo **Influence** a hesitant monster, the default DC is 15 or its Intelligence, whichever is higher (advantage if Friendly, disadvantage if Hostile).',
    },
  },
  {
    id: 'actions',
    title: { en: 'Actions', es: 'Acciones' },
    body: {
      es: '| Acción | Qué hace |\n|---|---|\n| Atacar | Un ataque con arma o golpe sin armas |\n| Correr | Movimiento extra igual a tu velocidad este turno |\n| Destrabarse | Tu movimiento no provoca ataques de oportunidad este turno |\n| Esquivar | Hasta tu siguiente turno: ataques contra ti con desventaja y ventaja en salvaciones de Destreza |\n| Ayudar | Ayuda a una prueba o ataque de otro, o primeros auxilios |\n| Esconderse | Destreza (Sigilo) CD 15 estando muy oscurecido o con cobertura de ¾ o total |\n| Influir | Carisma (Engaño, Intimidación, Interpretación o Persuasión) o Sabiduría (Trato con Animales) |\n| Magia | Lanzar un conjuro, usar un objeto o rasgo mágico |\n| Preparar | Reservar una acción para un desencadenante |\n| Buscar | Sabiduría (Perspicacia, Medicina, Percepción o Supervivencia) |\n| Estudiar | Inteligencia (Arcanos, Historia, Investigación, Naturaleza o Religión) |\n| Usar | Usar un objeto no mágico |',
      en: '| Action | What it does |\n|---|---|\n| Attack | One weapon attack or Unarmed Strike |\n| Dash | Extra movement equal to your Speed this turn |\n| Disengage | Your movement doesn\'t provoke opportunity attacks this turn |\n| Dodge | Until your next turn: attacks against you have disadvantage, advantage on Dex saves |\n| Help | Aid another\'s check or attack, or give first aid |\n| Hide | DC 15 Dexterity (Stealth) while heavily obscured or behind ¾ or total cover |\n| Influence | Charisma (Deception, Intimidation, Performance or Persuasion) or Wisdom (Animal Handling) |\n| Magic | Cast a spell, use a magic item or feature |\n| Ready | Hold an action for a trigger |\n| Search | Wisdom (Insight, Medicine, Perception or Survival) |\n| Study | Intelligence (Arcana, History, Investigation, Nature or Religion) |\n| Utilize | Use a nonmagical object |',
    },
  },
  {
    id: 'cover',
    title: { en: 'Cover', es: 'Cobertura' },
    body: {
      es: '| Cobertura | Beneficio | La da… |\n|---|---|---|\n| Media | +2 a CA y salvaciones de Destreza | Otra criatura u objeto que tape al menos la mitad |\n| Tres cuartos | +5 a CA y salvaciones de Destreza | Un objeto que tape al menos ¾ |\n| Total | No se le puede elegir como objetivo directo | Un objeto que lo tape entero |\n\nNo se suman: cuenta solo la mejor.',
      en: '| Cover | Benefit | Given by… |\n|---|---|---|\n| Half | +2 to AC and Dex saves | Another creature or an object covering at least half |\n| Three-quarters | +5 to AC and Dex saves | An object covering at least ¾ |\n| Total | Can\'t be targeted directly | An object covering it fully |\n\nThey don\'t stack: only the best applies.',
    },
  },
  {
    id: 'light',
    title: { en: 'Light and vision', es: 'Luz y visión' },
    body: {
      es: '- **Luz brillante:** se ve con normalidad.\n- **Luz tenue** (penumbra, niebla ligera, follaje moderado): **ligeramente oscurecido**, desventaja en Sabiduría (Percepción) basada en la vista.\n- **Oscuridad** (noche, mazmorra sin luz, niebla densa): **muy oscurecido**, quien intente ver ahí queda Cegado.\n- **Visión en la oscuridad:** en su alcance, ves en luz tenue como si fuera brillante y en la oscuridad como si fuera tenue (en tonos de gris).',
      en: '- **Bright light:** normal sight.\n- **Dim light** (shadows, patchy fog, moderate foliage): **lightly obscured**, disadvantage on sight-based Wisdom (Perception).\n- **Darkness** (night, unlit dungeon, heavy fog): **heavily obscured**, you\'re Blinded when trying to see there.\n- **Darkvision:** within range, you see in dim light as if bright and in darkness as if dim (in shades of gray).',
    },
  },
  {
    id: 'travel',
    title: { en: 'Travel pace', es: 'Ritmo de viaje' },
    body: {
      es: '| Ritmo | Minuto | Hora | Día | Efecto |\n|---|---|---|---|---|\n| Rápido | 120 m | 6 km | 45 km | Desventaja en Percepción, Supervivencia y Sigilo |\n| Normal | 90 m | 4,5 km | 36 km | Desventaja en Sigilo |\n| Lento | 60 m | 3 km | 27 km | Ventaja en Percepción y Supervivencia |\n\nMontados se puede ir al doble durante 1 hora; luego las monturas necesitan descansar.',
      en: '| Pace | Minute | Hour | Day | Effect |\n|---|---|---|---|---|\n| Fast | 400 ft | 4 miles | 30 miles | Disadvantage on Perception, Survival and Stealth |\n| Normal | 300 ft | 3 miles | 24 miles | Disadvantage on Stealth |\n| Slow | 200 ft | 2 miles | 18 miles | Advantage on Perception and Survival |\n\nMounted, you can go double for 1 hour; then the mounts need a rest.',
    },
  },
  {
    id: 'hazards',
    title: { en: 'Falling, breath and other hazards', es: 'Caídas, asfixia y otros peligros' },
    body: {
      es: '- **Caída:** 1d6 contundente por cada 3 m (máx. 20d6) y queda Derribado si recibe daño. Al caer al agua: reacción y Fuerza (Atletismo) o Destreza (Acrobacias) CD 15 para recibir la mitad.\n- **Asfixia:** aguanta la respiración 1 + mod. de Constitución minutos (mín. 30 s). Después gana 1 nivel de Agotamiento al final de cada turno; al volver a respirar los pierde todos.\n- **Arder:** 1d4 fuego al inicio de cada turno. Se apaga con una acción tirándose al suelo (Derribado), o sumergiéndose.\n- **Deshidratación:** beber menos de la mitad del agua diaria (4 l para Pequeño o Mediano) = 1 nivel de Agotamiento al final del día.\n- **Desnutrición:** comer menos de la mitad (0,5 kg para Pequeño o Mediano) = salvación de Constitución CD 10 o 1 nivel; 5 días sin comer = 1 nivel ese día y otro cada día siguiente.',
      en: '- **Falling:** 1d6 bludgeoning per 10 ft (max 20d6) and Prone if damaged. Into water: reaction and DC 15 Strength (Athletics) or Dexterity (Acrobatics) to halve it.\n- **Suffocation:** hold your breath 1 + Con modifier minutes (min 30 s). Then gain 1 Exhaustion level at the end of each turn; breathing again removes them all.\n- **Burning:** 1d4 fire at the start of each turn. Put it out with an action by dropping Prone and rolling, or by submerging.\n- **Dehydration:** less than half the daily water (1 gallon for Small or Medium) = 1 Exhaustion level at day\'s end.\n- **Malnutrition:** less than half the food (1 lb for Small or Medium) = DC 10 Con save or 1 level; 5 days without food = 1 level that day and another each following day.',
    },
  },
  {
    id: 'exhaustion',
    title: { en: 'Exhaustion and concentration', es: 'Agotamiento y concentración' },
    body: {
      es: '- **Agotamiento:** cada nivel resta 2 a las pruebas de d20 y 1,5 m de velocidad. A nivel 6, muerte. Un descanso largo quita 1 nivel.\n- **Concentración:** al recibir daño, salvación de Constitución CD 10 o la mitad del daño (lo que sea mayor, máx. 30). Se pierde al quedar Incapacitado, al morir o al empezar otro efecto de concentración.',
      en: '- **Exhaustion:** each level subtracts 2 from D20 Tests and 5 ft of Speed. Level 6 is death. A long rest removes 1 level.\n- **Concentration:** on taking damage, Constitution save DC 10 or half the damage (higher, max 30). Lost when Incapacitated, dead, or starting another concentration effect.',
    },
  },
  {
    id: 'jumps',
    title: { en: 'Jumping', es: 'Saltos' },
    body: {
      es: '- **Salto largo:** hasta tu puntuación de Fuerza × 30 cm con 3 m de carrerilla; parado, la mitad. Al caer en terreno difícil, Destreza (Acrobacias) CD 10 o Derribado.\n- **Salto alto:** (3 + mod. de Fuerza) × 30 cm con carrerilla; parado, la mitad.\n- Cada metro saltado gasta movimiento.',
      en: '- **Long jump:** up to your Strength score in feet with a 10-ft run-up; standing, half. Landing in difficult terrain: DC 10 Dexterity (Acrobatics) or Prone.\n- **High jump:** 3 + Strength modifier feet with a run-up; standing, half.\n- Every foot jumped costs movement.',
    },
  },
  {
    id: 'objects',
    title: { en: 'Breaking objects', es: 'Romper objetos' },
    body: {
      es: '| CA | Material |\n|---|---|\n| 11 | Tela, papel, cuerda |\n| 13 | Cristal, vidrio, hielo |\n| 15 | Madera |\n| 17 | Piedra |\n| 19 | Hierro, acero |\n| 21 | Mithral |\n| 23 | Adamantina |\n\n| Tamaño | Frágil | Resistente |\n|---|---|---|\n| Diminuto (botella, cerradura) | 2 (1d4) | 5 (2d4) |\n| Pequeño (cofre, laúd) | 3 (1d6) | 10 (3d6) |\n| Mediano (barril, lámpara) | 4 (1d8) | 18 (4d8) |\n| Grande (carro, ventana) | 5 (1d10) | 27 (5d10) |',
      en: '| AC | Substance |\n|---|---|\n| 11 | Cloth, paper, rope |\n| 13 | Crystal, glass, ice |\n| 15 | Wood |\n| 17 | Stone |\n| 19 | Iron, steel |\n| 21 | Mithral |\n| 23 | Adamantine |\n\n| Size | Fragile | Resilient |\n|---|---|---|\n| Tiny (bottle, lock) | 2 (1d4) | 5 (2d4) |\n| Small (chest, lute) | 3 (1d6) | 10 (3d6) |\n| Medium (barrel, chandelier) | 4 (1d8) | 18 (4d8) |\n| Large (cart, window) | 5 (1d10) | 27 (5d10) |',
    },
  },
];
