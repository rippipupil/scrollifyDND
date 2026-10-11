import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useT } from '../../i18n/useT';
import { uid } from '../../rules/core';
import type { Character, Feature } from '../../rules/types';
import { entryToFeature } from '../../sheet/adapters';
import { useTheme } from '../../theme';
import { EntryPicker } from '../EntryPicker';
import { Markdown } from '../Markdown';
import { Button, Card, Field, Row, Sheet, Txt } from '../ui';
import type { Mutate } from './useCharacter';

const LISTS = ['armor', 'weapons', 'tools', 'languages'] as const;

export function FeaturesTab({ c, mutate }: { c: Character; mutate: Mutate }) {
  const th = useTheme();
  const { t, lang } = useT();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState<Feature | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <Card title={t('sheet.features')}>
        {c.features.length === 0 ? <Txt muted>{t('common.empty')}</Txt> : null}
        {c.features.map((f) => (
          <View key={f.uid} style={{ borderTopWidth: 1, borderColor: th.border, paddingTop: 6, gap: 4 }}>
            <Row>
              <Pressable style={{ flex: 1 }} onPress={() => setOpen((o) => ({ ...o, [f.uid]: !o[f.uid] }))}>
                <Txt style={{ fontWeight: '600' }}>
                  {open[f.uid] ? '▾' : '▸'} {f.name}
                </Txt>
              </Pressable>
              <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, features: x.features.filter((y) => y.uid !== f.uid) }))} />
            </Row>
            {open[f.uid] && f.text ? <Markdown text={f.text} /> : null}
          </View>
        ))}
      </Card>
      <Button label={t('sheet.addFeature')} onPress={() => setPicking(true)} />
      <Card title={t('sheet.proficiencies')}>
        {LISTS.map((k) => (
          <Field
            key={k}
            label={t(`sheet.${k}`)}
            value={c.proficiencies[k].join(', ')}
            onChangeText={(v) => mutate((x) => ({ ...x, proficiencies: { ...x.proficiencies, [k]: v.split(',').map((s) => s.trim()).filter(Boolean) } }))}
          />
        ))}
      </Card>
      <EntryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        title={t('sheet.addFeature')}
        categories={['feat', 'feature', 'subclass', 'species', 'background']}
        onPick={(e) => {
          mutate((x) => ({ ...x, features: [...x.features, entryToFeature(e, lang)] }));
          setPicking(false);
        }}
        onCustom={() => {
          setPicking(false);
          setCustom({ uid: uid('feat'), name: '', text: '' });
        }}
      />
      <Sheet visible={!!custom} onClose={() => setCustom(null)} title={t('sheet.addFeature')}>
        {custom ? (
          <>
            <Field label={t('common.name')} value={custom.name} onChangeText={(v) => setCustom({ ...custom, name: v })} />
            <Field label={t('common.description')} value={custom.text} onChangeText={(v) => setCustom({ ...custom, text: v })} multiline style={{ minHeight: 120 }} />
            <Button
              label={t('common.add')}
              disabled={!custom.name.trim()}
              onPress={() => {
                mutate((x) => ({ ...x, features: [...x.features, custom] }));
                setCustom(null);
              }}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
