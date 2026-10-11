import { useState } from 'react';
import { View } from 'react-native';
import { useT } from '../../i18n/useT';
import { armorClass } from '../../rules/combat';
import { charProf, formatMod, initiative, passive } from '../../rules/core';
import { applyDamage, applyHealing, currentSpeed, maxHp, revive, rollDeathSave, setTempHp } from '../../rules/health';
import type { Character } from '../../rules/types';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { notify } from '../ImportSheet';
import { Button, Chip, NumberField, Row, Sheet, Txt } from '../ui';
import type { Mutate } from './useCharacter';

function Stat({ label, value, onPress, testID }: { label: string; value: string; onPress?: () => void; testID?: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 64 }}>
      <Button kind="secondary" label={value} onPress={onPress} small testID={testID} />
      <Txt variant="small" muted style={{ textAlign: 'center', marginTop: 2, color: c.textMuted }}>
        {label}
      </Txt>
    </View>
  );
}

export function HpPanel({ c, mutate }: { c: Character; mutate: Mutate }) {
  const th = useTheme();
  const { t, lang } = useT();
  const roll = useRolls((s) => s.roll);
  const mode = useRolls((s) => s.mode);
  const setMode = useRolls((s) => s.setMode);
  const [action, setAction] = useState<null | 'damage' | 'heal' | 'temp'>(null);
  const [amount, setAmount] = useState<number | undefined>();
  const [crit, setCrit] = useState(false);
  const max = maxHp(c);
  const pct = Math.max(0, Math.min(1, c.hp.current / max));
  const speed = currentSpeed(c);

  const apply = () => {
    const n = amount ?? 0;
    if (action === 'damage') {
      const r = applyDamage(c, n, { critical: crit });
      mutate(() => r.character);
      const msgs = r.events.map((e) => (e === 'concentrationCheck' ? t('sheet.concentrationCheck', { dc: r.concentrationDC ?? 10 }) : t(`sheet.${e}`)));
      if (msgs.length) notify(msgs.join('\n'));
    } else if (action === 'heal') mutate((x) => applyHealing(x, n));
    else if (action === 'temp') mutate((x) => setTempHp(x, n));
    setAction(null);
    setAmount(undefined);
    setCrit(false);
  };

  return (
    <View style={{ gap: 10 }}>
      <Row>
        <Stat label={t('sheet.ac')} value={String(armorClass(c))} />
        <Stat label={t('sheet.initiative')} value={formatMod(initiative(c))} onPress={() => roll(t('sheet.initiative'), d20(initiative(c)))} testID="roll-initiative" />
        <Stat label={t('sheet.speed')} value={lang === 'es' ? `${String(Math.round(speed * 0.3 * 10) / 10).replace('.', ',')} m` : `${speed} ft`} />
        <Stat label={t('sheet.prof')} value={formatMod(charProf(c))} />
        <Stat label={t('sheet.passivePerception')} value={String(passive(c, 'perception'))} />
      </Row>
      <View style={{ backgroundColor: th.surface, borderColor: th.border, borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }}>
        <Row>
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('sheet.hp')}
          </Txt>
          <Txt variant="title" style={{ color: th.hp }} testID="hp-value">
            {c.hp.current}
          </Txt>
          <Txt muted> / {max}</Txt>
          {c.hp.temp > 0 ? <Txt style={{ color: th.temp, fontWeight: '700' }}> +{c.hp.temp}</Txt> : null}
        </Row>
        <View style={{ height: 10, backgroundColor: th.surfaceAlt, borderRadius: 5, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pct > 0.5 ? th.success : pct > 0.25 ? th.warning : th.hp }} />
        </View>
        <Row>
          <Button style={{ flex: 1 }} kind="danger" label={t('sheet.damage')} onPress={() => setAction('damage')} testID="btn-damage" />
          <Button style={{ flex: 1 }} label={t('sheet.heal')} onPress={() => setAction('heal')} testID="btn-heal" />
          <Button style={{ flex: 1 }} kind="secondary" label={t('sheet.temp')} onPress={() => setAction('temp')} />
        </Row>
        {c.dead ? (
          <View style={{ gap: 6 }}>
            <Txt style={{ color: th.danger, fontWeight: '800', textAlign: 'center' }}>{t('sheet.dead')}</Txt>
            <Button kind="secondary" label={t('sheet.revive')} onPress={() => mutate(revive)} testID="btn-revive" />
          </View>
        ) : null}
        {!c.dead && c.hp.current === 0 ? (
          <View style={{ gap: 6 }}>
            <Txt style={{ fontWeight: '700' }}>{t('sheet.deathSaves')}</Txt>
            <Row>
              <Txt style={{ color: th.success }}>
                {t('sheet.successes')}: {'●'.repeat(c.deathSaves.successes)}
                {'○'.repeat(3 - c.deathSaves.successes)}
              </Txt>
              <Txt style={{ color: th.danger }}>
                {t('sheet.failures')}: {'●'.repeat(c.deathSaves.failures)}
                {'○'.repeat(3 - c.deathSaves.failures)}
              </Txt>
            </Row>
            <Button
              kind="secondary"
              label={t('sheet.rollDeathSave')}
              onPress={() => {
                const e = roll(t('sheet.deathSaves'), '1d20', 'normal');
                if (e) mutate((x) => rollDeathSave(x, e.result.parts[0].kept[0]));
              }}
            />
          </View>
        ) : null}
      </View>
      <Row wrap>
        <Chip label={t('sheet.inspiration')} active={c.inspiration} onPress={() => mutate((x) => ({ ...x, inspiration: !x.inspiration }))} />
        <Chip label={t('dice.advantage')} active={mode === 'adv'} onPress={() => setMode(mode === 'adv' ? 'normal' : 'adv')} />
        <Chip label={t('dice.disadvantage')} active={mode === 'dis'} onPress={() => setMode(mode === 'dis' ? 'normal' : 'dis')} />
      </Row>
      {c.spellcasting.concentratingOn ? (
        <Row style={{ backgroundColor: th.surfaceAlt, padding: 8, borderRadius: 10 }}>
          <Txt style={{ flex: 1 }}>{t('sheet.concentrating', { spell: c.spellcasting.concentratingOn })}</Txt>
          <Button small kind="ghost" label={t('sheet.endConcentration')} onPress={() => mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, concentratingOn: null } }))} />
        </Row>
      ) : null}
      <Sheet visible={!!action} onClose={() => setAction(null)} title={action ? t(`sheet.${action === 'temp' ? 'tempHp' : action}`) : ''}>
        <NumberField label={t('sheet.amount')} value={amount} min={0} max={9999} allowEmpty onChange={setAmount} />
        {action === 'damage' ? <Chip label={t('sheet.critical')} active={crit} onPress={() => setCrit(!crit)} /> : null}
        <Row wrap>
          {[1, 2, 3, 5, 8, 10].map((n) => (
            <Chip key={n} label={`+${n}`} onPress={() => setAmount((a) => (a ?? 0) + n)} />
          ))}
        </Row>
        <Button label={t('common.apply')} onPress={apply} testID="apply-hp" />
      </Sheet>
    </View>
  );
}
