import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { useT } from '../i18n/useT';
import { decodeBundle, prepareCharacterImport, type Decoded } from '../share/codec';
import { pickBundleText } from '../share/io';
import { useCharacters } from '../store/characters';
import { useHomebrew } from '../store/homebrew';
import { Button, Field, Sheet, Txt } from './ui';

export function notify(msg: string) {
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert(msg);
}

/** Applies a decoded bundle to the stores and returns a user-facing message. */
export function useApplyBundle() {
  const { t } = useT();
  const add = useCharacters((s) => s.add);
  const importMany = useHomebrew((s) => s.importMany);
  return (d: Decoded): string => {
    if (!d.ok) return t('share.invalid');
    if (d.kind === 'character') {
      const ids = new Set(Object.keys(useCharacters.getState().characters));
      const c = prepareCharacterImport(d.payload, ids);
      add(c);
      return t('share.imported', { name: c.name });
    }
    importMany(d.payload);
    return t('share.imported', { name: `${d.payload.length} homebrew` });
  };
}

export function ImportSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useT();
  const apply = useApplyBundle();
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [perm, requestPerm] = useCameraPermissions();

  const finish = (raw: string) => {
    const msg = apply(decodeBundle(raw));
    notify(msg);
    if (!msg.startsWith(t('share.invalid'))) {
      setText('');
      setScanning(false);
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={() => (setScanning(false), onClose())} title={t('common.import')}>
      <Button
        label={t('share.importFromFile')}
        onPress={async () => {
          const raw = await pickBundleText();
          if (raw) finish(raw);
        }}
      />
      <Field label={t('share.importFromText')} placeholder={t('share.pasteHere')} value={text} onChangeText={setText} multiline style={{ minHeight: 80 }} />
      <Button kind="secondary" label={t('common.import')} disabled={!text.trim()} onPress={() => finish(text)} />
      {Platform.OS !== 'web' ? (
        scanning ? (
          perm?.granted ? (
            <View style={{ height: 300, borderRadius: 12, overflow: 'hidden' }}>
              <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => finish(data)} />
            </View>
          ) : (
            <Txt muted>{t('share.cameraDenied')}</Txt>
          )
        ) : (
          <Button
            kind="secondary"
            label={t('share.importFromQr')}
            onPress={async () => {
              if (!perm?.granted) await requestPerm();
              setScanning(true);
            }}
          />
        )
      ) : null}
    </Sheet>
  );
}
