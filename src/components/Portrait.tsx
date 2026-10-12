import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useT } from '../i18n/useT';
import { pickPortrait } from '../sheet/portrait';
import { useTheme } from '../theme';
import { notify } from './ImportSheet';
import { Button, Sheet } from './ui';

/** Round portrait; shows the initial when there's no picture. */
export function Avatar({ uri, name, size = 48, onPress, testID }: { uri?: string; name: string; size?: number; onPress?: () => void; testID?: string }) {
  const c = useTheme();
  const [broken, setBroken] = useState(false);
  const show = !!uri && !broken;
  return (
    <Pressable onPress={onPress} disabled={!onPress} testID={testID} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: c.surfaceAlt, borderWidth: 2, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        {show ? (
          <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setBroken(true)} />
        ) : (
          <Text style={{ color: c.accent, fontWeight: '800', fontSize: size * 0.42 }}>{(name.trim()[0] ?? '?').toUpperCase()}</Text>
        )}
      </View>
    </Pressable>
  );
}

/** Sheet to take, pick or remove a character portrait. */
export function PortraitSheet({ visible, onClose, onChange, hasPortrait }: { visible: boolean; onClose: () => void; onChange: (uri: string | undefined) => void; hasPortrait: boolean }) {
  const { t } = useT();
  const pick = async (source: 'camera' | 'library') => {
    try {
      const uri = await pickPortrait(source);
      if (uri) {
        onChange(uri);
        onClose();
      }
    } catch (e) {
      notify(`${t('portrait.failed')} ${String(e)}`);
    }
  };
  return (
    <Sheet visible={visible} onClose={onClose} title={t('sheet.portrait')}>
      <Button label={t('portrait.camera')} onPress={() => pick('camera')} />
      <Button kind="secondary" label={t('portrait.library')} onPress={() => pick('library')} testID="portrait-library" />
      {hasPortrait ? (
        <Button
          kind="ghost"
          label={t('portrait.remove')}
          onPress={() => {
            onChange(undefined);
            onClose();
          }}
        />
      ) : null}
    </Sheet>
  );
}
