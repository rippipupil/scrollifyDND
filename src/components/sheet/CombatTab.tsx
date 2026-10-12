import { useState } from 'react';
import { View } from 'react-native';
import { getEntry } from '../../content';
import { useT } from '../../i18n/useT';
import { weaponAttacks } from '../../rules/combat';
import { formatMod, uid } from '../../rules/core';
import { canRest, hitDiceRemaining, longRest, shortRest } from '../../rules/health';
import type { Character, Resource } from '../../rules/types';
import { toggleCondition } from '../../sheet/actions';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { FullAttackSheet } from '../FullAttackSheet';
import { notify } from '../ImportSheet';
import { Button, Card, Chip, Field, NumberField, Row, Sheet, Stepper, Txt } from '../ui';
import type { Mutate } from './useCharacter';

const CONDITIONS = ['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious'];

export function CombatTab({ c, mutate }: { c: Character; mutate: Mutate }) {
  const th = useTheme();
  const { t, loc } = useT();
  const roll = useRolls((s) => s.roll);
  const [resting, setResting] = useState(false);
  const [spent, setSpent] = useState<{ classIndex: number; roll: number }[]>([]);
  const [newRes, setNewRes] = useState<Resource | null>(null);
  const attacks = weaponAttacks(c);
  const [full, setFull] = useState<(typeof attacks)[number] | null>(null);

  return (
    <View style={{ gap: 12 }}>
      <Card title={t('sheet.attacks')}>
        {attacks.map((a) => (
          <View key={a.id} style={{ borderTopWidth: 1, borderColor: th.border, paddingTop: 6, gap: 4 }}>
            <Txt style={{ fontWeight: '700' }}>{loc(a.name)}</Txt>
            <Row wrap>
              <Button small label={`${t('sheet.toHit')} ${formatMod(a.toHit)}`} onPress={() => roll(`${loc(a.name)} · ${t('sheet.toHit')}`, d20(a.toHit))} />
              <Button small kind="secondary" label={`${a.damage} ${t(`damageTypes.${a.damageType}`)}`} onPress={() => roll(`${loc(a.name)} · ${t('sheet.dmg')}`, a.damage, 'normal')} />
              {a.versatileDamage ? <Button small kind="secondary" label={`${t('sheet.versatile')}: ${a.versatileDamage}`} onPress={() => roll(`${loc(a.name)} · ${t('sheet.versatile')}`, a.versatileDamage!, 'normal')} /> : null}
              <Button small kind="ghost" label={`⚔ ${t('attack.full')}`} onPress={() => setFull(a)} testID={`full-attack-${a.id}`} />
            </Row>
            {a.mastery ? (
              <Txt variant="small" muted>
                {t('sheet.mastery')}: {loc(getEntry(`mastery:${a.mastery}`)?.name) || a.mastery}
              </Txt>
            ) : null}
          </View>
        ))}
      </Card>

      <Card title={t('sheet.conditions')}>
        <Row wrap>
          {CONDITIONS.map((id) => (
            <Chip key={id} label={loc(getEntry(`condition:${id}`)?.name) || id} active={c.conditions.includes(id)} onPress={() => mutate((x) => toggleCondition(x, id))} />
          ))}
        </Row>
        <Row>
          <Txt style={{ flex: 1 }}>{t('sheet.exhaustion')}</Txt>
          <Stepper value={c.exhaustion} min={0} max={6} onChange={(n) => mutate((x) => ({ ...x, exhaustion: n, dead: n >= 6 ? true : x.dead }))} />
        </Row>
      </Card>

      <Card title={t('sheet.resources')} right={<Button small kind="ghost" label="+" onPress={() => setNewRes({ uid: uid('res'), name: '', max: 1, used: 0, recharge: 'long' })} />}>
        {c.resources.length === 0 ? <Txt muted>{t('common.empty')}</Txt> : null}
        {c.resources.map((r) => (
          <Row key={r.uid}>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>{r.name}</Txt>
              <Txt variant="small" muted>
                {t(`recharge.${r.recharge}`)} · {r.max - r.used}/{r.max}
              </Txt>
            </View>
            <Button small kind="secondary" label="−" onPress={() => mutate((x) => ({ ...x, resources: x.resources.map((y) => (y.uid === r.uid ? { ...y, used: Math.min(y.max, y.used + 1) } : y)) }))} />
            <Button small kind="secondary" label="+" onPress={() => mutate((x) => ({ ...x, resources: x.resources.map((y) => (y.uid === r.uid ? { ...y, used: Math.max(0, y.used - 1) } : y)) }))} />
            <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, resources: x.resources.filter((y) => y.uid !== r.uid) }))} />
          </Row>
        ))}
      </Card>

      <Row>
        <Button style={{ flex: 1 }} kind="secondary" label={t('sheet.shortRest')} onPress={() => (canRest(c) ? (setSpent([]), setResting(true)) : notify(t('sheet.cannotRest')))} />
        <Button
          style={{ flex: 1 }}
          kind="secondary"
          label={t('sheet.longRest')}
          testID="btn-long-rest"
          onPress={() => {
            if (!canRest(c)) return notify(t('sheet.cannotRest'));
            mutate(longRest);
            notify(t('sheet.restDone'));
          }}
        />
      </Row>

      <FullAttackSheet visible={!!full} onClose={() => setFull(null)} label={full ? loc(full.name) : ''} toHit={full?.toHit ?? 0} damage={full?.damage ?? ''} damageType={full?.damageType} />

      <Sheet visible={resting} onClose={() => setResting(false)} title={t('sheet.shortRest')}>
        <Txt muted>{t('sheet.hitDice')}</Txt>
        {c.classes.map((k, i) => {
          const left = hitDiceRemaining(c)[i] - spent.filter((s) => s.classIndex === i).length;
          return (
            <Row key={i}>
              <Txt style={{ flex: 1 }}>
                {loc(k.name)}: d{k.hitDie} × {left}
              </Txt>
              <Button
                small
                label={t('sheet.spendHitDie')}
                disabled={left <= 0}
                onPress={() => {
                  const e = roll(`${t('sheet.hitDie')} d${k.hitDie}`, `1d${k.hitDie}`, 'normal');
                  if (e) setSpent((s) => [...s, { classIndex: i, roll: e.result.total }]);
                }}
              />
            </Row>
          );
        })}
        {spent.length ? <Txt>{spent.map((s) => s.roll).join(' + ')}</Txt> : null}
        <Button
          label={t('common.apply')}
          onPress={() => {
            mutate((x) => shortRest(x, spent));
            setResting(false);
            notify(t('sheet.restDone'));
          }}
        />
      </Sheet>

      <Sheet visible={!!newRes} onClose={() => setNewRes(null)} title={t('sheet.addResource')}>
        {newRes ? (
          <>
            <Field label={t('common.name')} value={newRes.name} onChangeText={(v) => setNewRes({ ...newRes, name: v })} />
            <NumberField label={t('sheet.max')} value={newRes.max} min={1} max={99} onChange={(n) => setNewRes({ ...newRes, max: n ?? 1 })} />
            <Row wrap>
              {(['short', 'long', 'none'] as const).map((r) => (
                <Chip key={r} label={t(`recharge.${r}`)} active={newRes.recharge === r} onPress={() => setNewRes({ ...newRes, recharge: r })} />
              ))}
            </Row>
            <Button
              label={t('common.add')}
              disabled={!newRes.name.trim()}
              onPress={() => {
                mutate((x) => ({ ...x, resources: [...x.resources, newRes] }));
                setNewRes(null);
              }}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
