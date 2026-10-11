import { View } from 'react-native';
import { useT } from '../../i18n/useT';
import { uid } from '../../rules/core';
import type { Character } from '../../rules/types';
import { Button, Card, Field, Row, Txt } from '../ui';
import type { Mutate } from './useCharacter';

const FIELDS = ['traits', 'ideals', 'bonds', 'flaws', 'appearance', 'backstory'] as const;

export function NotesTab({ c, mutate }: { c: Character; mutate: Mutate }) {
  const { t } = useT();
  return (
    <View style={{ gap: 12 }}>
      <Card title={t('sheet.personality')}>
        {FIELDS.map((k) => (
          <Field key={k} label={t(`sheet.${k}`)} value={c.personality[k]} multiline onChangeText={(v) => mutate((x) => ({ ...x, personality: { ...x.personality, [k]: v } }))} />
        ))}
      </Card>
      <Card title={t('sheet.notes')} right={<Button small kind="ghost" label={t('sheet.newNote')} onPress={() => mutate((x) => ({ ...x, notes: [{ uid: uid('note'), date: Date.now(), text: '' }, ...x.notes] }))} />}>
        {c.notes.length === 0 ? <Txt muted>{t('common.empty')}</Txt> : null}
        {c.notes.map((n) => (
          <View key={n.uid} style={{ gap: 4 }}>
            <Row>
              <Txt variant="small" muted style={{ flex: 1 }}>
                {new Date(n.date).toLocaleString()}
              </Txt>
              <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, notes: x.notes.filter((y) => y.uid !== n.uid) }))} />
            </Row>
            <Field value={n.text} multiline style={{ minHeight: 70 }} onChangeText={(v) => mutate((x) => ({ ...x, notes: x.notes.map((y) => (y.uid === n.uid ? { ...y, text: v } : y)) }))} />
          </View>
        ))}
      </Card>
    </View>
  );
}
