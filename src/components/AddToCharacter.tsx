import { Alert, Platform } from 'react-native';
import type { ContentEntry } from '../content/types';
import { useT } from '../i18n/useT';
import { addEntryToCharacter } from '../sheet/adapters';
import { useCharacters } from '../store/characters';
import { Button, Sheet, Txt } from './ui';

export function AddToCharacter({ entry, visible, onClose }: { entry: ContentEntry; visible: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const characters = useCharacters((s) => s.characters);
  const update = useCharacters((s) => s.update);
  const list = Object.values(characters).sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <Sheet visible={visible} onClose={onClose} title={t('wiki.chooseCharacter')}>
      {list.length === 0 ? <Txt muted>{t('characters.empty')}</Txt> : null}
      {list.map((c) => (
        <Button
          key={c.id}
          kind="secondary"
          label={c.name || t('characters.untitled')}
          onPress={() => {
            update(c.id, (x) => addEntryToCharacter(x, entry, lang));
            onClose();
            const msg = t('wiki.added', { name: c.name });
            if (Platform.OS === 'web') console.log(msg);
            else Alert.alert(msg);
          }}
        />
      ))}
    </Sheet>
  );
}
