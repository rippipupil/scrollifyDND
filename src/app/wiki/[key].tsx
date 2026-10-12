import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AddToCharacter } from '../../components/AddToCharacter';
import { Button, Screen, Txt } from '../../components/ui';
import { EntryDetail, useEntry } from '../../components/wiki/EntryDetail';
import { useT } from '../../i18n/useT';
import { enemyFromMonster } from '../../dm/enemy';
import { canAddToCharacter } from '../../sheet/adapters';
import { useDm } from '../../store/dm';

export default function WikiEntryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const entry = useEntry(key);
  const { loc, t, lang } = useT();
  const saveEnemy = useDm((s) => s.saveEnemy);
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
      {entry.category === 'monster' ? (
        <Button
          kind="secondary"
          label={t('dm.copyToBestiary')}
          onPress={() => {
            const e = enemyFromMonster(entry, lang);
            saveEnemy(e);
            router.push({ pathname: '/dm/[id]', params: { id: e.id } });
          }}
        />
      ) : null}
      <AddToCharacter entry={entry} visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
