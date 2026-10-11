import { Stack } from 'expo-router';
import { Markdown } from '../components/Markdown';
import { Card, Screen } from '../components/ui';
import { useT } from '../i18n/useT';

const TEXT = `**Scrollify D&D** es una app de fichas y consulta para D&D 5.5 (reglas 2024).

**Atribución SRD.** This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

**Datos.**
- Datos estructurados del SRD 5.2: 5e-bits/5e-database (licencia MIT).
- Texto del SRD 5.2.1 en Markdown: downfallx/dnd-5e-srd-markdown (CC-BY-4.0).
- Traducción al español elaborada para esta app a partir del SRD 5.2.1 (CC-BY-4.0).

**Contenido fuera del SRD.** El índice externo solo contiene datos factuales (nombre, nivel, escuela, clases) y enlaces a AideDD, Wikidot y Nivel20. El texto completo pertenece a sus titulares.

Dungeons & Dragons es una marca de Wizards of the Coast. Esta app no está afiliada ni respaldada por Wizards of the Coast.`;

export default function CreditsScreen() {
  const { t } = useT();
  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.credits') }} />
      <Card>
        <Markdown text={TEXT} />
      </Card>
    </Screen>
  );
}
