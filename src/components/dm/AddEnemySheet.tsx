import { useState } from 'react';
import { addEnemy } from '../../dm/encounter';
import { crLabel } from '../../dm/enemy';
import type { Enemy } from '../../dm/types';
import { useT } from '../../i18n/useT';
import { useDm } from '../../store/dm';
import { notify } from '../ImportSheet';
import { Button, Chip, Row, Sheet, Stepper, Txt } from '../ui';

/** Picks an enemy from the bestiary (unless one is given) and how many copies join the combat. */
export function AddEnemySheet({ enemy, visible, onClose }: { enemy?: Enemy; visible: boolean; onClose: () => void }) {
  const { t } = useT();
  const enemies = useDm((s) => s.enemies);
  const updateEncounter = useDm((s) => s.updateEncounter);
  const [picked, setPicked] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [rollHp, setRollHp] = useState(false);
  const chosen = enemy ?? (picked ? enemies[picked] : undefined);
  const close = () => (setPicked(null), setCount(1), onClose());
  const list = Object.values(enemies).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Sheet visible={visible} onClose={close} title={t('dm.addEnemy')}>
      {!enemy ? (
        list.length ? (
          <Row wrap>
            {list.map((e) => (
              <Chip key={e.id} label={`${e.name || t('dm.unnamed')} · ${t('dm.cr')} ${crLabel(e.cr)}`} active={picked === e.id} onPress={() => setPicked(e.id)} />
            ))}
          </Row>
        ) : (
          <Txt muted>{t('dm.noEnemies')}</Txt>
        )
      ) : null}
      {chosen ? (
        <>
          <Txt style={{ fontWeight: '700' }}>{chosen.name || t('dm.unnamed')}</Txt>
          <Row>
            <Txt style={{ flex: 1 }}>{t('dm.copies')}</Txt>
            <Stepper value={count} min={1} max={30} onChange={setCount} />
          </Row>
          {chosen.hpFormula ? <Chip label={t('dm.rollHp')} active={rollHp} onPress={() => setRollHp(!rollHp)} /> : null}
          <Button
            label={t('dm.add')}
            testID="confirm-add-enemy"
            onPress={() => {
              updateEncounter((enc) => addEnemy(enc, chosen, count, { rollHp }));
              notify(`${t('dm.addToCombat')}: ${count} × ${chosen.name || t('dm.unnamed')}`);
              close();
            }}
          />
        </>
      ) : null}
    </Sheet>
  );
}
