import { useState } from 'react';
import { View } from 'react-native';
import { rollDetail } from '../../components/RollToast';
import { Button, Card, Chip, Field, Row, Screen, Stepper, Txt } from '../../components/ui';
import { useT } from '../../i18n/useT';
import { parseDice } from '../../rules/dice';
import { useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';

const DICE = [4, 6, 8, 10, 12, 20, 100];

export default function DiceScreen() {
  const th = useTheme();
  const { t } = useT();
  const roll = useRolls((s) => s.roll);
  const history = useRolls((s) => s.history);
  const clear = useRolls((s) => s.clear);
  const mode = useRolls((s) => s.mode);
  const setMode = useRolls((s) => s.setMode);
  const [count, setCount] = useState(1);
  const [bonus, setBonus] = useState(0);
  const [expr, setExpr] = useState('');
  const valid = !expr.trim() || parseDice(expr).ok;
  const exprFor = (sides: number) => `${count}d${sides}${bonus ? (bonus > 0 ? `+${bonus}` : bonus) : ''}`;

  return (
    <Screen>
      <Card>
        <Row>
          <Txt style={{ flex: 1 }}>{t('common.quantity')}</Txt>
          <Stepper value={count} min={1} max={20} onChange={setCount} />
        </Row>
        <Row>
          <Txt style={{ flex: 1 }}>{t('sheet.modifier')}</Txt>
          <Stepper value={bonus} min={-20} max={20} onChange={setBonus} />
        </Row>
        <Row wrap>
          <Chip label={t('dice.advantage')} active={mode === 'adv'} onPress={() => setMode(mode === 'adv' ? 'normal' : 'adv')} />
          <Chip label={t('dice.disadvantage')} active={mode === 'dis'} onPress={() => setMode(mode === 'dis' ? 'normal' : 'dis')} />
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DICE.map((d) => (
            <Button key={d} style={{ width: '30%', flexGrow: 1 }} label={`d${d}`} onPress={() => roll(exprFor(d), exprFor(d))} testID={`die-${d}`} />
          ))}
        </View>
      </Card>
      <Card>
        <Field label={t('dice.expression')} value={expr} onChangeText={setExpr} autoCapitalize="none" autoCorrect={false} />
        {!valid ? <Txt style={{ color: th.danger }}>{t('dice.invalid')}</Txt> : null}
        <Button label={t('dice.roll')} disabled={!expr.trim() || !valid} onPress={() => roll(expr.trim(), expr.trim())} />
      </Card>
      <Card title={t('dice.history')} right={history.length ? <Button small kind="ghost" label={t('dice.clear')} onPress={clear} /> : undefined}>
        {history.length === 0 ? <Txt muted>{t('common.empty')}</Txt> : null}
        {history.map((h) => (
          <Row key={h.id} style={{ borderTopWidth: 1, borderColor: th.border, paddingTop: 6 }}>
            <Txt variant="title" style={{ width: 56, textAlign: 'center', color: h.result.natural === 20 ? th.success : h.result.natural === 1 ? th.danger : th.accent }}>
              {h.result.total}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontWeight: '600' }}>{h.label}</Txt>
              <Txt variant="small" muted>
                {rollDetail(h)}
                {h.mode !== 'normal' ? ` · ${t(h.mode === 'adv' ? 'dice.advantage' : 'dice.disadvantage')}` : ''}
              </Txt>
            </View>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
