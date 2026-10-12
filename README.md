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

**Wiki**
- El SRD 5.2 completo sin conexión: 339 conjuros (traducidos al español), equipo, objetos mágicos, clases y progresión, subclases, especies, trasfondos, dotes, estados, maestrías, glosario de reglas y 341 monstruos con su bloque de estadísticas.
- Búsqueda en español o inglés, sin importar las tildes, con filtros de conjuros (nivel, clase, escuela, concentración, ritual).
- Índice del contenido que no está en el SRD (Aasimar, trasfondos, dotes y subclases del Manual del Jugador 2024, Silvery Barbs…) con enlaces a **AideDD**, **Wikidot** y **Nivel20**.
- «Añadir a personaje» desde cualquier conjuro, objeto o dote.

**DM**
- Bestiario propio: apunta tus enemigos con su ficha completa (CA, PG y fórmula, velocidad, características, salvaciones, habilidades, **vulnerabilidades/debilidades**, resistencias, inmunidades, sentidos, idiomas, rasgos, acciones, ataques, acciones adicionales, reacciones, acciones legendarias y notas).
- Créalos de cero o copia cualquiera de los 341 monstruos del SRD (también desde su página de la wiki) y edítalo.
- Toca un ataque para tirar el ataque y el daño; toca una característica, salvación o habilidad para tirarla.
- Combate: añade varios enemigos a la vez (numerados, PG fijos o tirados), personajes guardados y otros (PNJ, trampas); iniciativa, orden de turnos, rondas, daño/curación/PG temporales, estados y notas por combatiente.
- Exporta e importa el bestiario para no perderlo al cambiar de móvil.

**Homebrew**: crea especies, conjuros, objetos, dotes o rasgos propios y compártelos con el grupo como paquete.

## Instalar en Android

1. Ve a la pestaña **Actions** del repositorio en GitHub y abre la última ejecución verde de **CI**.
2. Descarga el artefacto **scrollify-dnd-apk** (un .zip con `app-release.apk`).
3. Pásalo al móvil y ábrelo. Android pedirá permitir la instalación desde esa fuente.

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
