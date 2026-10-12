import { useState } from 'react';
import { BestiaryView } from '../../components/dm/BestiaryView';
import { CombatView } from '../../components/dm/CombatView';
import { DmScreenView } from '../../components/dm/DmScreenView';
import { JournalView } from '../../components/dm/JournalView';
import { Chip, Row, Screen } from '../../components/ui';
import { useT } from '../../i18n/useT';
import { useDm } from '../../store/dm';

export default function DmScreen() {
  const { t } = useT();
  const fighting = useDm((s) => s.encounter.combatants.length > 0);
  const [view, setView] = useState<'enemies' | 'combat' | 'journal' | 'screen'>(fighting ? 'combat' : 'enemies');
  return (
    <Screen>
      <Row wrap>
        <Chip label={t('dm.enemies')} active={view === 'enemies'} onPress={() => setView('enemies')} />
        <Chip label={t('dm.combat')} active={view === 'combat'} onPress={() => setView('combat')} />
        <Chip label={t('journal.title_tab')} active={view === 'journal'} onPress={() => setView('journal')} />
        <Chip label={t('screen.title')} active={view === 'screen'} onPress={() => setView('screen')} />
      </Row>
      {view === 'enemies' ? <BestiaryView /> : view === 'combat' ? <CombatView /> : view === 'journal' ? <JournalView /> : <DmScreenView />}
    </Screen>
  );
}
