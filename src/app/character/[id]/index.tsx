import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { ShareSheet } from '../../../components/ShareSheet';
import { CombatTab } from '../../../components/sheet/CombatTab';
import { EditPanel } from '../../../components/sheet/EditPanel';
import { FeaturesTab } from '../../../components/sheet/FeaturesTab';
import { HpPanel } from '../../../components/sheet/HpPanel';
import { InventoryTab } from '../../../components/sheet/InventoryTab';
import { MainTab } from '../../../components/sheet/MainTab';
import { NotesTab } from '../../../components/sheet/NotesTab';
import { SpellsTab } from '../../../components/sheet/SpellsTab';
import { useCharacter } from '../../../components/sheet/useCharacter';
import { Button, Chip, Row, Screen, Txt } from '../../../components/ui';
import { useT } from '../../../i18n/useT';

const TABS = ['main', 'combat', 'spells', 'inventory', 'features', 'notes'] as const;
type Tab = (typeof TABS)[number];

export default function CharacterSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, mutate } = useCharacter(id);
  const { t, loc } = useT();
  const [tab, setTab] = useState<Tab>('main');
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  if (!c) {
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
          title: c.name || t('characters.untitled'),
          headerRight: () => (
            <Row>
              <Button small kind="ghost" label={t('common.share')} onPress={() => setSharing(true)} />
              <Button small kind={editing ? 'primary' : 'ghost'} label={editing ? t('common.done') : t('common.edit')} onPress={() => setEditing(!editing)} testID="toggle-edit" />
            </Row>
          ),
        }}
      />
      <Txt muted>
        {[loc(c.species.name), loc(c.background.name), c.classes.map((k) => `${loc(k.name)} ${k.level}${k.subclassName ? ` (${loc(k.subclassName)})` : ''}`).join(' / '), c.alignment ? t(`alignments.${c.alignment}`) : '']
          .filter(Boolean)
          .join(' · ')}
      </Txt>
      {editing ? <EditPanel c={c} mutate={mutate} /> : null}
      <HpPanel c={c} mutate={mutate} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {TABS.map((k) => (
          <Chip key={k} label={t(`sheet.${k}`)} active={tab === k} onPress={() => setTab(k)} />
        ))}
      </ScrollView>
      {tab === 'main' ? <MainTab c={c} mutate={mutate} editing={editing} /> : null}
      {tab === 'combat' ? <CombatTab c={c} mutate={mutate} /> : null}
      {tab === 'spells' ? <SpellsTab c={c} mutate={mutate} /> : null}
      {tab === 'inventory' ? <InventoryTab c={c} mutate={mutate} /> : null}
      {tab === 'features' ? <FeaturesTab c={c} mutate={mutate} /> : null}
      {tab === 'notes' ? <NotesTab c={c} mutate={mutate} /> : null}
      <ShareSheet kind="character" payload={c} name={c.name} visible={sharing} onClose={() => setSharing(false)} />
    </Screen>
  );
}
