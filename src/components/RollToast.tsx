import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useT } from '../i18n/useT';
import { useRolls } from '../store/rolls';
import { useTheme } from '../theme';

export function rollDetail(e: { result: { parts: { term: string; rolls: number[]; kept: number[]; sign: number }[]; modifier: number } }): string {
  const parts = e.result.parts.map((p) => `${p.sign < 0 ? '−' : ''}${p.term}[${p.rolls.map((r) => (p.kept.length < p.rolls.length && !p.kept.includes(r) ? `~${r}~` : r)).join(',')}]`);
  if (e.result.modifier) parts.push(`${e.result.modifier > 0 ? '+' : '−'}${Math.abs(e.result.modifier)}`);
  return parts.join(' ');
}

export function RollToast() {
  const c = useTheme();
  const { t } = useT();
  const last = useRolls((s) => s.last);
  const dismiss = useRolls((s) => s.dismiss);
  useEffect(() => {
    if (!last) return;
    const id = setTimeout(dismiss, 4500);
    return () => clearTimeout(id);
  }, [last, dismiss]);
  if (!last) return null;
  const nat = last.result.natural;
  const color = nat === 20 ? c.success : nat === 1 ? c.danger : c.accent;
  return (
    <Pressable onPress={dismiss} style={{ position: 'absolute', left: 12, right: 12, bottom: 90, zIndex: 50 }} testID="roll-toast">
      <View style={{ backgroundColor: c.surface, borderColor: color, borderWidth: 2, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 }}>
        <Text style={{ fontSize: 34, fontWeight: '800', color, minWidth: 56, textAlign: 'center' }}>{last.result.total}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700' }}>
            {last.label}
            {last.mode !== 'normal' ? ` · ${t(last.mode === 'adv' ? 'dice.advantage' : 'dice.disadvantage')}` : ''}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{rollDetail(last)}</Text>
          {nat === 20 ? <Text style={{ color: c.success, fontWeight: '700' }}>{t('dice.natural20')}</Text> : null}
          {nat === 1 ? <Text style={{ color: c.danger, fontWeight: '700' }}>{t('dice.natural1')}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
