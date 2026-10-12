import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DM_SCREEN } from '../../dm/screen';
import { useT } from '../../i18n/useT';
import { Markdown } from '../Markdown';
import { Card, Chip, Txt } from '../ui';

/** Quick rules for the DM, one section at a time. */
export function DmScreenView() {
  const { loc, t } = useT();
  const [id, setId] = useState(DM_SCREEN[0].id);
  const section = DM_SCREEN.find((s) => s.id === id) ?? DM_SCREEN[0];
  return (
    <View style={{ gap: 10 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {DM_SCREEN.map((s) => (
          <Chip key={s.id} label={loc(s.title)} active={s.id === id} onPress={() => setId(s.id)} />
        ))}
      </ScrollView>
      <Card title={loc(section.title)}>
        <Markdown text={loc(section.body)} />
      </Card>
      <Txt variant="small" muted>
        {t('screen.source')}
      </Txt>
    </View>
  );
}
