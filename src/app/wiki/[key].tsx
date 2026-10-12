import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AddToCharacter } from '../../components/AddToCharacter';
import { Button, Screen, Txt } from '../../components/ui';
import { EntryDetail, useEntry } from '../../components/wiki/EntryDetail';
import { keyOf } from '../../content';
import { useT } from '../../i18n/useT';
import { enemyFromMonster } from '../../dm/enemy';
import { canAddToCharacter } from '../../sheet/adapters';
import { useDm } from '../../store/dm';
import { useWikiUser } from '../../store/wiki';

export default function WikiEntryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const entry = useEntry(key);
  const { loc, t, lang } = useT();
  const saveEnemy = useDm((s) => s.saveEnemy);
  const [adding, setAdding] = useState(false);
  const fav = useWikiUser((s) => !!entry && s.favorites.includes(keyOf(entry)));
  const toggleFavorite = useWikiUser((s) => s.toggleFavorite);
  if (!entry) {
    return (
      <Screen>
        <Txt>{t('common.empty')}</Txt>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: loc(entry.name),
          headerRight: () => <Button small kind="ghost" label={fav ? '★' : '☆'} onPress={() => toggleFavorite(keyOf(entry))} testID="toggle-favorite" />,
        }}
      />
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
