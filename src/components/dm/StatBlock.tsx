import { View } from 'react-native';
import { getEntry } from '../../content';
import { crLabel, enemySave } from '../../dm/enemy';
import { ENEMY_ACTION_KINDS, type Enemy, type EnemyAction } from '../../dm/types';
import { useT } from '../../i18n/useT';
import { abilityMod, formatMod } from '../../rules/core';
import { ABILITIES } from '../../rules/types';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { useState } from 'react';
import { FullAttackSheet, type AttackTarget } from '../FullAttackSheet';
import { Button, Card, Chip, Row, Txt } from '../ui';

export const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
export const CONDITION_IDS = ['blinded', 'charmed', 'deafened', 'exhaustion', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious'];
const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

export function useDmLabels() {
  const { t, loc } = useT();
  return {
    damage: (x: string) => (DAMAGE_TYPES.includes(x) ? t(`damageTypes.${x}`) : x),
    condition: (x: string) => loc(getEntry(`condition:${x}`)?.name) || x,
    size: (x: string) => (SIZES.includes(x) ? t(`sizes.${x}`) : x),
  };
}

function Line({ label, value, color }: { label: string; value: string; color?: string }) {
  const { conv } = useT();
  if (!value) return null;
  return (
    <Txt>
      <Txt style={{ fontWeight: '700', color }}>{label}: </Txt>
      {conv(value)}
    </Txt>
  );
}

/**
 * Read-only stat block. Tapping a score, save, skill or attack rolls it; `who` prefixes roll labels.
 * In combat, `targets` and `onApplyDamage` let a full attack hit another combatant.
 */
export function StatBlock({ enemy: e, who, targets, onApplyDamage }: { enemy: Enemy; who?: string; targets?: AttackTarget[]; onApplyDamage?: (uid: string, amount: number) => void }) {
  const { t, conv } = useT();
  const th = useTheme();
  const L = useDmLabels();
  const roll = useRolls((s) => s.roll);
  const name = who || e.name || t('dm.unnamed');
  const saves = ABILITIES.filter((a) => e.saves[a] !== undefined);
  const [full, setFull] = useState<EnemyAction | null>(null);

  const actionRow = (a: EnemyAction) => (
    <View key={a.uid} style={{ gap: 4 }}>
      <Txt>
        <Txt style={{ fontWeight: '700', fontStyle: 'italic' }}>{a.name || '—'}. </Txt>
        {conv(a.text)}
      </Txt>
      {a.attackBonus !== undefined || a.damage || a.save ? (
        <Row wrap>
          {a.attackBonus !== undefined ? (
            <Button small label={t('dm.attackRoll', { bonus: formatMod(a.attackBonus) })} onPress={() => roll(`${name}: ${a.name}`, d20(a.attackBonus!))} />
          ) : null}
          {a.damage ? (
            <Button
              small
              kind="secondary"
              label={`${t('dm.damageRoll', { dice: a.damage })}${a.damageType ? ` ${L.damage(a.damageType)}` : ''}`}
              onPress={() => roll(`${name}: ${a.name} (${t('sheet.damage')})`, a.damage!)}
            />
          ) : null}
          {a.attackBonus !== undefined && a.damage ? <Button small kind="ghost" label={`⚔ ${t('attack.full')}`} onPress={() => setFull(a)} /> : null}
          {a.save ? <Txt muted>{t('dm.saveLabel', { ability: t(`abilities.short.${a.save.ability}`), dc: a.save.dc })}</Txt> : null}
        </Row>
      ) : null}
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      <Card>
        <Txt variant="title">{e.name || t('dm.unnamed')}</Txt>
        <Txt muted style={{ fontStyle: 'italic' }}>
          {[L.size(e.size), e.type, e.alignment].filter(Boolean).join(' · ')}
        </Txt>
        <Row wrap>
          <Chip label={`${t('dm.ac')} ${e.ac}${e.acNote ? ` (${e.acNote})` : ''}`} />
          <Chip label={`${t('dm.hp')} ${e.hpMax}${e.hpFormula ? ` (${e.hpFormula})` : ''}`} />
          {e.speed ? <Chip label={conv(e.speed)} /> : null}
          <Chip label={`${t('dm.cr')} ${crLabel(e.cr)}${e.xp ? ` · ${e.xp} ${t('dm.xp')}` : ''}`} />
        </Row>
        <Row wrap>
          {ABILITIES.map((a) => (
            <View key={a} style={{ alignItems: 'center', minWidth: 48, flex: 1 }}>
              <Txt variant="small" muted>
                {t(`abilities.short.${a}`)}
              </Txt>
              <Button small kind="secondary" label={`${e.abilities[a]} (${formatMod(abilityMod(e.abilities[a]))})`} onPress={() => roll(`${name}: ${t(`abilities.${a}`)}`, d20(abilityMod(e.abilities[a])))} />
            </View>
          ))}
        </Row>
        {saves.length ? (
          <Row wrap>
            <Txt style={{ fontWeight: '700' }}>{t('dm.saves')}:</Txt>
            {saves.map((a) => (
              <Chip key={a} label={`${t(`abilities.short.${a}`)} ${formatMod(enemySave(e, a))}`} onPress={() => roll(`${name}: ${t('dm.saveAbility')} ${t(`abilities.short.${a}`)}`, d20(enemySave(e, a)))} />
            ))}
          </Row>
        ) : null}
        {e.skills.length ? (
          <Row wrap>
            <Txt style={{ fontWeight: '700' }}>{t('dm.skills')}:</Txt>
            {e.skills.map((s) => (
              <Chip key={s.id} label={`${t(`skills.${s.id}`)} ${formatMod(s.bonus)}`} onPress={() => roll(`${name}: ${t(`skills.${s.id}`)}`, d20(s.bonus))} />
            ))}
          </Row>
        ) : null}
        <Line label={t('dm.vulnerabilities')} value={e.vulnerabilities.map(L.damage).join(', ')} color={th.danger} />
        <Line label={t('dm.resistances')} value={e.resistances.map(L.damage).join(', ')} />
        <Line label={t('dm.immunities')} value={e.immunities.map(L.damage).join(', ')} />
        <Line label={t('dm.conditionImmunities')} value={e.conditionImmunities.map(L.condition).join(', ')} />
        <Line label={t('dm.senses')} value={[e.senses, `${t('dm.passivePerception')} ${e.passivePerception}`].filter(Boolean).join(', ')} />
        <Line label={t('dm.languages')} value={e.languages} />
      </Card>
      {ENEMY_ACTION_KINDS.map((kind) => {
        const list = e.actions.filter((a) => a.kind === kind);
        return list.length ? (
          <Card key={kind} title={t(`dm.${kind}`)}>
            {list.map(actionRow)}
          </Card>
        ) : null;
      })}
      <FullAttackSheet
        visible={!!full}
        onClose={() => setFull(null)}
        label={`${name}: ${full?.name ?? ''}`}
        toHit={full?.attackBonus ?? 0}
        damage={full?.damage ?? ''}
        damageType={full?.damageType && DAMAGE_TYPES.includes(full.damageType) ? full.damageType : undefined}
        targets={targets}
        onApply={onApplyDamage}
      />
      {e.notes ? (
        <Card title={t('dm.notes')}>
          <Txt selectable>{e.notes}</Txt>
        </Card>
      ) : null}
    </View>
  );
}
