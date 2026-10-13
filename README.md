# Scrollify D&D

Fichas de personaje funcionales y wiki para **D&D 5.5 (reglas 2024)**, en **español e inglés**, para Android (y iOS).

## Qué hace

**Fichas**
- Asistente de creación paso a paso: clase(s) y nivel, subclase, especie y linaje, trasfondo con mejoras +2/+1 o +1/+1/+1, características (serie estándar, compra por puntos o manual), habilidades, equipo inicial y detalles.
- Multiclase con espacios de conjuro combinados según las reglas 2024 (Magia del pacto aparte).
- Todo se calcula solo: modificadores, competencia, salvaciones, habilidades, CA (armaduras, escudo, Armadura de mago, Defensa sin armadura), iniciativa, CD y ataque de conjuros, ataques con armas y maestrías, carga.
- Vida: daño (primero PG temporales), curación, PG temporales, muerte instantánea, salvaciones contra muerte, aviso de concentración (CD automática).
- Descanso corto (gastar dados de golpe) y largo (recupera todo y reduce el Agotamiento).
- Conjuros: preparar, lanzar gastando espacios (o como ritual), concentración, conjuros propios.
- Inventario con monedas, peso, equipar y sintonizar; estados, Agotamiento 2024, recursos con recarga, rasgos, personalidad y notas.
- Toca cualquier número para tirar el d20 (con ventaja o desventaja).
- Modo edición para cambiarlo todo a mano (CA fija, PG máximos, bonificadores…).
- Compartir fichas: archivo, código para copiar o QR. Importar desde archivo, código o escaneando el QR.
- Retrato del personaje (cámara o galería), opciones 2014 (legado) en el asistente y subclases de libros fuera del SRD (Cronurgia, Artífice…).
- **Ataque completo**: un botón tira ataque y daño, compara con la CA del objetivo y dobla los dados en crítico.
- **Modo mesa**: pantalla grande que no se apaga con PG, CA, espacios de conjuro y ataques a mano.

**Wiki**
- El SRD 5.2 completo sin conexión: 339 conjuros (traducidos al español), equipo, objetos mágicos, clases y progresión, subclases, especies, trasfondos, dotes, estados, maestrías, glosario de reglas y 341 monstruos con su bloque de estadísticas.
- Monstruos con sus rasgos y acciones en español (traducción del SRD 5.2) y los tipos de criatura traducidos.
- Búsqueda en español o inglés, sin importar las tildes, con filtros de conjuros (nivel, clase, escuela, concentración, ritual) y de edición (5.5/2024 o 5e/2014).
- Índice del contenido que no está en el SRD (especies, subclases, trasfondos, dotes y conjuros de los libros 2024 y de los de 2014 que siguen siendo válidos, y 620 monstruos oficiales) con sus datos básicos y enlaces a **AideDD**, **Wikidot** y **Nivel20**. Los conjuros fuera del SRD traen una ficha de reglas resumida con palabras propias.
- Notas propias en cada entrada y **favoritos** (★).
- «Añadir a personaje» desde cualquier conjuro, objeto o dote.

**DM**
- Bestiario propio: apunta tus enemigos con su ficha completa (CA, PG y fórmula, velocidad, características, salvaciones, habilidades, **vulnerabilidades/debilidades**, resistencias, inmunidades, sentidos, idiomas, rasgos, acciones, ataques, acciones adicionales, reacciones, acciones legendarias y notas).
- Créalos de cero o copia cualquiera de los 341 monstruos del SRD (también desde su página de la wiki) y edítalo.
- Toca un ataque para tirar el ataque y el daño; toca una característica, salvación o habilidad para tirarla.
- Combate: añade varios enemigos a la vez (numerados, PG fijos o tirados), personajes guardados y otros (PNJ, trampas); iniciativa, orden de turnos, rondas, daño/curación/PG temporales, estados y notas por combatiente.
- **Efectos con duración** en rondas (la pone el DM): se descuentan al empezar el turno del afectado y avisan al terminar.
- **Diario de campaña**: sesiones, misiones, PNJ y lugares enlazados con [[Nombre]], con «Mencionado en».
- **Pantalla del DM**: CD típicas, acciones, cobertura, luz, viaje, peligros, Agotamiento, saltos y objetos (SRD 5.2.1).
- Exporta e importa el bestiario para no perderlo al cambiar de móvil.

**Buscar en todo**: la lupa de arriba busca a la vez en personajes, enemigos, diario, tus notas y la wiki.

**Copia de seguridad**: en Ajustes, un solo archivo con todo (personajes con retrato, enemigos, combate, homebrew, diario, notas y favoritos). Al restaurar se combina con lo que hay y se conserva siempre lo más reciente.

**Homebrew**: crea especies, conjuros, objetos, dotes o rasgos propios y compártelos con el grupo como paquete.

## Instalar en Android

1. Desde el móvil, abre **https://github.com/rippipupil/scrollifyDND/releases/latest/download/scrollify-dnd.apk** (descarga directa).
2. Abre el archivo descargado. Android pedirá permitir la instalación desde el navegador: acéptalo.
3. Para tu grupo: pásales ese enlace o el propio `scrollify-dnd.apk` por WhatsApp, Telegram o Drive.

**Actualizaciones:** a partir de la versión 1.0.20, la app comprueba al abrirse si hay una versión nueva y muestra una
pantalla para **actualizar directamente** (descarga el APK e instala encima, sin perder personajes ni enemigos).
También puedes comprobarlo en Ajustes → Buscar actualizaciones. Para que funcione, el repositorio debe ser público.

## iPhone

Sin cuenta de desarrollador de Apple, la forma más sencilla es **Expo Go**: en un ordenador ejecuta `npx expo start` y escanea el QR con la app Expo Go. También puedes usar la versión web: `npx expo start --web`.

## Desarrollo

```bash
npm install
npm test              # tests (motor de reglas, datos, búsqueda, importación…)
npm run typecheck
npx expo start        # Expo Go / emulador / navegador
npm run build-data    # regenera assets/data a partir de data/
```

- `src/rules/`: motor de reglas puro (TypeScript, sin interfaz).
- `src/app/`: pantallas (Expo Router).
- `scripts/`: genera la wiki a partir del SRD y de las traducciones de `data/i18n/es/`.
- Diseño: `docs/superpowers/specs/` · Plan: `docs/superpowers/plans/`.

## Licencia del contenido

Incluye material del System Reference Document 5.2.1 de Wizards of the Coast LLC, con licencia CC-BY-4.0. Consulta `data/NOTICE.md`. Dungeons & Dragons es una marca de Wizards of the Coast; esta app no está afiliada a ella.
