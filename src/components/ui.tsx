import { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { fonts, useTheme } from '../theme';

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: c.bg }, style]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={[{ padding: 12, paddingBottom: 48, gap: 12 }, style]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, title, right }: { children?: ReactNode; style?: StyleProp<ViewStyle>; title?: string; right?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 }, style]}>
      {title ? (
        <View style={styles.row}>
          <Txt variant="heading" style={{ flex: 1 }}>
            {title}
          </Txt>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

type Variant = 'title' | 'heading' | 'body' | 'small';

export function Txt({ children, variant = 'body', muted, style, numberOfLines, selectable, testID }: { children?: ReactNode; variant?: Variant; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number; selectable?: boolean; testID?: string }) {
  const c = useTheme();
  return (
    <Text testID={testID} selectable={selectable} numberOfLines={numberOfLines} style={[fonts[variant], { color: muted ? c.textMuted : c.text }, style]}>
      {children}
    </Text>
  );
}

export function Button({ label, onPress, kind = 'primary', small, disabled, style, testID }: { label: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'danger' | 'ghost'; small?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'danger' ? c.danger : kind === 'secondary' ? c.surfaceAlt : 'transparent';
  const fg = kind === 'primary' || kind === 'danger' ? c.accentText : c.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.75 : 1, borderRadius: 10, paddingVertical: small ? 6 : 10, paddingHorizontal: small ? 10 : 14, alignItems: 'center', justifyContent: 'center', borderWidth: kind === 'ghost' || kind === 'secondary' ? 1 : 0, borderColor: c.border },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, style, testID }: { label: string; active?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; testID?: string }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      testID={testID}
      style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: active ? c.accent : c.chip, borderWidth: 1, borderColor: active ? c.accent : c.border }, style]}
    >
      <Text style={{ color: active ? c.accentText : c.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Txt variant="small" muted>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={c.textMuted}
        style={[{ borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: c.text, backgroundColor: c.surfaceAlt, fontSize: 15 }, style]}
        {...props}
      />
    </View>
  );
}

export function NumberField({ label, value, onChange, min = -999, max = 9999, placeholder, allowEmpty, testID }: { label?: string; value: number | undefined; onChange: (n: number | undefined) => void; min?: number; max?: number; placeholder?: string; allowEmpty?: boolean; testID?: string }) {
  return (
    <Field
      label={label}
      keyboardType="number-pad"
      placeholder={placeholder}
      testID={testID}
      value={value === undefined ? '' : String(value)}
      onChangeText={(txt) => {
        if (txt.trim() === '' || txt === '-') return onChange(allowEmpty ? undefined : min > 0 ? min : 0);
        const n = Math.trunc(Number(txt));
        if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
      }}
    />
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const c = useTheme();
  return (
    <View style={[styles.row, { gap: 6 }]}>
      <Button small kind="secondary" label="−" onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={{ color: c.text, minWidth: 24, textAlign: 'center', fontWeight: '700' }}>{value}</Text>
      <Button small kind="secondary" label="+" onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const c = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} />
      <View style={{ maxHeight: '85%', backgroundColor: c.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderColor: c.border, borderWidth: 1 }}>
        <View style={[styles.row, { padding: 12, borderBottomWidth: 1, borderColor: c.border }]}>
          <Txt variant="heading" style={{ flex: 1 }}>{title}</Txt>
          <Pressable accessibilityRole="button" accessibilityLabel="close" onPress={onClose} hitSlop={12}>
            <Text style={{ color: c.text, fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function Row({ children, style, wrap }: { children: ReactNode; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[styles.row, wrap && { flexWrap: 'wrap' }, { gap: 8 }, style]}>{children}</View>;
}

export function Badge({ label, color }: { label: string; color?: string }) {
  const c = useTheme();
  return (
    <View style={{ backgroundColor: color ?? c.surfaceAlt, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color: color ? '#fff' : c.textMuted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Divider() {
  const c = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border, marginVertical: 4 }} />;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
