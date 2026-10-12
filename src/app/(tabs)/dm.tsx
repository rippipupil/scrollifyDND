import { useState } from 'react';
import { BestiaryView } from '../../components/dm/BestiaryView';
import { CombatView } from '../../components/dm/CombatView';
import { Chip, Row, Screen } from '../../components/ui';
import { useT } from '../../i18n/useT';
import { useDm } from '../../store/dm';

export default function DmScreen() {
  const { t } = useT();
  const fighting = useDm((s) => s.encounter.combatants.length > 0);
  const [view, setView] = useState<'enemies' | 'combat'>(fighting ? 'combat' : 'enemies');
  return (
    <Screen>
      <Row>
        <Chip label={t('dm.enemies')} active={view === 'enemies'} onPress={() => setView('enemies')} />
        <Chip label={t('dm.combat')} active={view === 'combat'} onPress={() => setView('combat')} />
      </Row>
      {view === 'enemies' ? <BestiaryView /> : <CombatView />}
    </Screen>
  );
}
