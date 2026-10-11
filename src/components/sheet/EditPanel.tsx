import { View } from 'react-native';
import { entriesOf, keyOf } from '../../content';
import { useT } from '../../i18n/useT';
import { totalLevel } from '../../rules/core';
import { ABILITIES, type CasterType, type Character } from '../../rules/types';
import { useHomebrew } from '../../store/homebrew';
import { Button, Card, Chip, Field, NumberField, Row, Stepper, Txt } from '../ui';
import type { Mutate } from './useCharacter';

const CASTER: CasterType[] = ['none', 'full', 'half', 'third', 'pact'];
const ALIGN = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];

export function EditPanel({ c, mutate }: { c: Character; mutate: Mutate }) {
  const { t, loc } = useT();
  const homebrew = useHomebrew((s) => s.entries);
  const classes = entriesOf('class', homebrew);
  const setK = (i: number, patch: Partial<Character['classes'][number]>) => mutate((x) => ({ ...x, classes: x.classes.map((k, j) => (j === i ? { ...k, ...patch } : k)) }));
  return (
    <View style={{ gap: 12 }}>
      <Card title={t('sheet.editMode')}>
        <Field label={t('common.name')} value={c.name} onChangeText={(v) => mutate((x) => ({ ...x, name: v }))} />
        <Field label={t('sheet.player')} value={c.player} onChangeText={(v) => mutate((x) => ({ ...x, player: v }))} />
        <Field label={t('sheet.species')} value={loc(c.species.name)} onChangeText={(v) => mutate((x) => ({ ...x, species: { ...x.species, name: { en: v, es: v } } }))} />
        <Field label={t('sheet.background')} value={loc(c.background.name)} onChangeText={(v) => mutate((x) => ({ ...x, background: { ...x.background, name: { en: v, es: v } } }))} />
        <Txt variant="small" muted>
          {t('sheet.alignment')}
        </Txt>
        <Row wrap>
          {ALIGN.map((a) => (
            <Chip key={a} label={t(`alignments.${a}`)} active={c.alignment === a} onPress={() => mutate((x) => ({ ...x, alignment: a }))} />
          ))}
        </Row>
        <NumberField label={`${t('sheet.speed')} (ft)`} value={c.speed} min={0} max={200} onChange={(n) => mutate((x) => ({ ...x, speed: n ?? 30 }))} />
      </Card>
      <Card title={t('sheet.abilityScore')}>
        <Row wrap>
          {ABILITIES.map((a) => (
            <View key={a} style={{ width: '30%', flexGrow: 1 }}>
              <NumberField label={t(`abilities.short.${a}`)} value={c.abilities[a]} min={1} max={30} onChange={(n) => mutate((x) => ({ ...x, abilities: { ...x.abilities, [a]: n ?? 10 } }))} />
            </View>
          ))}
        </Row>
      </Card>
      <Card title={`${t('sheet.classes')} · ${t('sheet.totalLevel')} ${totalLevel(c)}`}>
        {c.classes.map((k, i) => (
          <View key={i} style={{ gap: 6 }}>
            <Row>
              <Txt style={{ flex: 1, fontWeight: '700' }}>{loc(k.name)}</Txt>
              <Stepper value={k.level} min={1} max={20} onChange={(n) => setK(i, { level: n, hitDiceUsed: Math.min(k.hitDiceUsed, n) })} />
              <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, classes: x.classes.filter((_, j) => j !== i) }))} />
            </Row>
            <Row wrap>
              <Txt variant="small" muted>
                {t('sheet.hitDie')}
              </Txt>
              {[6, 8, 10, 12].map((d) => (
                <Chip key={d} label={`d${d}`} active={k.hitDie === d} onPress={() => setK(i, { hitDie: d })} />
              ))}
            </Row>
            <Row wrap>
              <Txt variant="small" muted>
                {t('sheet.casterType')}
              </Txt>
              {CASTER.map((ct) => (
                <Chip key={ct} label={t(`casterTypes.${ct}`)} active={k.casterType === ct} onPress={() => setK(i, { casterType: ct })} />
              ))}
            </Row>
            {k.casterType !== 'none' ? (
              <Row wrap>
                <Txt variant="small" muted>
                  {t('sheet.spellAbility')}
                </Txt>
                {(['int', 'wis', 'cha'] as const).map((a) => (
                  <Chip key={a} label={t(`abilities.short.${a}`)} active={k.spellAbility === a} onPress={() => setK(i, { spellAbility: a })} />
                ))}
              </Row>
            ) : null}
          </View>
        ))}
        <Txt variant="small" muted>
          {t('sheet.addClass')}
        </Txt>
        <Row wrap>
          {classes.map((e) => (
            <Chip
              key={keyOf(e)}
              label={`+ ${loc(e.name)}`}
              onPress={() =>
                mutate((x) => ({
                  ...x,
                  classes: [...x.classes, { classId: e.id, name: e.name, level: 1, hitDie: e.data?.hitDie ?? 8, hitDiceUsed: 0, casterType: e.data?.casterType ?? 'none', spellAbility: e.data?.spellAbility }],
                }))
              }
            />
          ))}
        </Row>
      </Card>
      <Card title={t('sheet.overrides')}>
        <NumberField label={t('sheet.hpMaxOverride')} value={c.hp.maxOverride} min={1} max={9999} allowEmpty onChange={(n) => mutate((x) => ({ ...x, hp: { ...x.hp, maxOverride: n } }))} />
        <NumberField label={t('sheet.hpBonusPerLevel')} value={c.hp.bonusPerLevel} min={-10} max={20} onChange={(n) => mutate((x) => ({ ...x, hp: { ...x.hp, bonusPerLevel: n ?? 0 } }))} />
        <NumberField label={t('sheet.acOverride')} value={c.overrides.ac} min={0} max={50} allowEmpty onChange={(n) => mutate((x) => ({ ...x, overrides: { ...x.overrides, ac: n } }))} />
        <NumberField label={t('sheet.initiativeBonus')} value={c.overrides.initiativeBonus} min={-20} max={20} allowEmpty onChange={(n) => mutate((x) => ({ ...x, overrides: { ...x.overrides, initiativeBonus: n } }))} />
        <NumberField label={t('sheet.spellDcBonus')} value={c.overrides.spellDcBonus} min={-20} max={20} allowEmpty onChange={(n) => mutate((x) => ({ ...x, overrides: { ...x.overrides, spellDcBonus: n } }))} />
        <NumberField label={t('sheet.spellAttackBonus')} value={c.overrides.spellAttackBonus} min={-20} max={20} allowEmpty onChange={(n) => mutate((x) => ({ ...x, overrides: { ...x.overrides, spellAttackBonus: n } }))} />
        <Chip label={t('sheet.mageArmor')} active={!!c.effects.mageArmor} onPress={() => mutate((x) => ({ ...x, effects: { ...x.effects, mageArmor: !x.effects.mageArmor } }))} />
      </Card>
    </View>
  );
}
