import { Pressable, View } from 'react-native';
import { useT } from '../../i18n/useT';
import { abilityMod, formatMod, mod, saveBonus, SKILL_IDS, SKILLS, skillBonus, d20Penalty } from '../../rules/core';
import { ABILITIES, type Character } from '../../rules/types';
import { cycleSkillProf, toggleSave } from '../../sheet/actions';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { Card, Row, Txt } from '../ui';
import type { Mutate } from './useCharacter';

export function MainTab({ c, mutate, editing }: { c: Character; mutate: Mutate; editing: boolean }) {
  const th = useTheme();
  const { t } = useT();
  const roll = useRolls((s) => s.roll);
  const dot = (lvl?: string) => (lvl === 'expertise' ? '◆' : lvl === 'prof' ? '●' : lvl === 'half' ? '◐' : '○');
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ABILITIES.map((a) => (
          <Pressable
            key={a}
            onPress={() => roll(`${t(`abilities.${a}`)}`, d20(mod(c, a) + d20Penalty(c)))}
            style={({ pressed }) => ({ width: '31%', flexGrow: 1, alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: th.border, backgroundColor: pressed ? th.surfaceAlt : th.surface })}
            testID={`ability-${a}`}
          >
            <Txt variant="small" muted>
              {t(`abilities.short.${a}`)}
            </Txt>
            <Txt variant="title">{formatMod(abilityMod(c.abilities[a]))}</Txt>
            <Txt variant="small">{c.abilities[a]}</Txt>
          </Pressable>
        ))}
      </View>
      <Card title={t('sheet.savingThrows')}>
        {ABILITIES.map((a) => (
          <Pressable key={a} onPress={() => (editing ? mutate((x) => toggleSave(x, a)) : roll(`${t('sheet.savingThrows')}: ${t(`abilities.${a}`)}`, d20(saveBonus(c, a))))}>
            <Row style={{ paddingVertical: 4 }}>
              <Txt style={{ width: 22, color: th.accent }}>{c.proficiencies.saves.includes(a) ? '●' : '○'}</Txt>
              <Txt style={{ flex: 1 }}>{t(`abilities.${a}`)}</Txt>
              <Txt style={{ fontWeight: '700' }}>{formatMod(saveBonus(c, a))}</Txt>
            </Row>
          </Pressable>
        ))}
      </Card>
      <Card title={t('sheet.skills')}>
        {SKILL_IDS.map((s) => (
          <Pressable key={s} onPress={() => (editing ? mutate((x) => cycleSkillProf(x, s)) : roll(t(`skills.${s}`), d20(skillBonus(c, s))))} testID={`skill-${s}`}>
            <Row style={{ paddingVertical: 4 }}>
              <Txt style={{ width: 22, color: th.accent }}>{dot(c.proficiencies.skills[s])}</Txt>
              <Txt style={{ flex: 1 }}>
                {t(`skills.${s}`)} <Txt variant="small" muted>({t(`abilities.short.${SKILLS[s]}`)})</Txt>
              </Txt>
              <Txt style={{ fontWeight: '700' }}>{formatMod(skillBonus(c, s))}</Txt>
            </Row>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
