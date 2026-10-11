import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AddToCharacter } from '../../components/AddToCharacter';
import { Screen, Txt } from '../../components/ui';
import { EntryDetail, useEntry } from '../../components/wiki/EntryDetail';
import { useT } from '../../i18n/useT';
import { canAddToCharacter } from '../../sheet/adapters';

export default function WikiEntryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const entry = useEntry(key);
  const { loc, t } = useT();
  const [adding, setAdding] = useState(false);
  if (!entry) {
    return (
      <Screen>
        <Txt>{t('common.empty')}</Txt>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: loc(entry.name) }} />
      <Txt variant="title">{loc(entry.name)}</Txt>
      <EntryDetail entry={entry} onAdd={canAddToCharacter(entry) ? () => setAdding(true) : undefined} />
      <AddToCharacter entry={entry} visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
