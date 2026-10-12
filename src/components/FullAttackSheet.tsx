import { useState } from 'react';
import { View } from 'react-native';
import { useT } from '../i18n/useT';
import { fullAttack, type FullAttack } from '../rules/attack';
import { formatMod } from '../rules/core';
import { useRolls, type RollMode } from '../store/rolls';
import { useTheme } from '../theme';
import { rollDetail } from './RollToast';
import { Button, Card, Chip, NumberField, Row, Sheet, Txt } from './ui';

export interface AttackTarget {
  uid: string;
  name: string;
  ac: number;
}

/** Rolls attack and damage together against a target AC; in combat the damage can be applied to the target. */
export function FullAttackSheet({
  visible,
  onClose,
  label,
  toHit,
  damage,
  damageType,
  targets,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  toHit: number;
  damage: string;
  damageType?: string;
  targets?: AttackTarget[];
  onApply?: (uid: string, amount: number) => void;
}) {
  const { t } = useT();
  const c = useTheme();
  const lastAc = useRolls((s) => s.targetAc);
  const setLastAc = useRolls((s) => s.setTargetAc);
  const push = useRolls((s) => s.push);
  const [mode, setMode] = useState<RollMode>('normal');
  const [target, setTarget] = useState<string | undefined>();
  const [result, setResult] = useState<FullAttack | null>(null);
  const [applied, setApplied] = useState(false);
  const picked = targets?.find((x) => x.uid === target);
  const ac = picked ? picked.ac : lastAc;

  const go = () => {
    const r = fullAttack({ toHit, damage, targetAc: ac, mode });
    if (!r) return;
    setResult(r);
    setApplied(false);
    push(`${label} · ${t('attack.full')}${picked ? ` → ${picked.name}` : ''}`, r.attack, mode);
  };
  const close = () => {
    setResult(null);
    onClose();
  };
  const verdict = !result ? '' : result.crit ? t('attack.crit') : result.fumble ? t('attack.fumble') : result.hit === null ? t('attack.noAc') : result.hit ? t('attack.hit') : t('attack.miss');
  const color = !result ? c.text : result.hit === false ? c.danger : result.hit ? c.success : c.text;

  return (
    <Sheet visible={visible} onClose={close} title={`${label} · ${t('attack.full')}`}>
      <Txt muted>
        {t('sheet.toHit')} {formatMod(toHit)} · {t('sheet.dmg')} {damage}
        {damageType ? ` ${t(`damageTypes.${damageType}`)}` : ''}
      </Txt>
      {targets?.length ? (
        <>
          <Txt variant="small" muted>
            {t('attack.target')}
          </Txt>
          <Row wrap>
            {targets.map((x) => (
              <Chip key={x.uid} label={`${x.name} (${t('dm.ac')} ${x.ac})`} active={target === x.uid} onPress={() => setTarget(target === x.uid ? undefined : x.uid)} />
            ))}
          </Row>
        </>
      ) : null}
      {!picked ? <NumberField label={t('attack.targetAc')} value={lastAc} allowEmpty min={0} max={40} onChange={setLastAc} placeholder="—" /> : null}
      <Row wrap>
        {(['normal', 'adv', 'dis'] as const).map((m) => (
          <Chip key={m} label={m === 'normal' ? t('attack.normal') : t(m === 'adv' ? 'dice.advantage' : 'dice.disadvantage')} active={mode === m} onPress={() => setMode(m)} />
        ))}
      </Row>
      <Button label={t('common.roll')} onPress={go} testID="full-attack-roll" />
      {result ? (
        <Card style={{ borderColor: color, borderWidth: 2 }}>
          <Row>
            <Txt variant="title" style={{ color, minWidth: 56, textAlign: 'center' }} testID="full-attack-total">
              {result.attack.total}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '800', color }}>
                {verdict}
                {ac !== undefined ? ` (${t('dm.ac')} ${ac})` : ''}
              </Txt>
              <Txt variant="small" muted>
                {rollDetail({ result: result.attack })}
              </Txt>
            </View>
          </Row>
          {result.damage ? (
            <Row>
              <Txt variant="title" style={{ minWidth: 56, textAlign: 'center' }} testID="full-attack-damage">
                {result.damage.total}
              </Txt>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontWeight: '700' }}>
                  {t('sheet.dmg')}
                  {damageType ? ` ${t(`damageTypes.${damageType}`)}` : ''}
                  {result.crit ? ` · ${t('attack.critDice')}` : ''}
                </Txt>
                <Txt variant="small" muted>
                  {rollDetail({ result: result.damage })}
                </Txt>
              </View>
            </Row>
          ) : null}
          {picked && onApply && result.damage && result.hit ? (
            <Button
              kind="danger"
              disabled={applied}
              label={applied ? t('attack.applied') : t('attack.apply', { n: result.damage.total, name: picked.name })}
              onPress={() => {
                onApply(picked.uid, result.damage!.total);
                setApplied(true);
              }}
            />
          ) : null}
        </Card>
      ) : null}
    </Sheet>
  );
}
