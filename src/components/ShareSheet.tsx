import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useState } from 'react';
import { useT } from '../i18n/useT';
import { encodeBundle, type BundleKind } from '../share/codec';
import { copyText, QR_MAX_CHARS, shareBundleFile } from '../share/io';
import { notify } from './ImportSheet';
import { Button, Sheet, Txt } from './ui';

export function ShareSheet({ kind, payload, name, visible, onClose }: { kind: BundleKind; payload: unknown; name: string; visible: boolean; onClose: () => void }) {
  const { t } = useT();
  const [showQr, setShowQr] = useState(false);
  const code = visible ? encodeBundle(kind, payload) : '';
  // A portrait doesn't fit in a QR code: the QR carries the sheet without it (file and code keep it).
  const qr = visible && kind === 'character' && (payload as { portraitUri?: string }).portraitUri ? encodeBundle(kind, { ...(payload as object), portraitUri: undefined }) : code;
  return (
    <Sheet visible={visible} onClose={() => (setShowQr(false), onClose())} title={`${t('share.title')}: ${name}`}>
      <Button label={t('share.shareFile')} onPress={() => shareBundleFile(kind, payload, name).catch((e) => notify(String(e)))} />
      <Button
        kind="secondary"
        label={t('share.copyCode')}
        onPress={async () => {
          await copyText(code);
          notify(t('common.copied'));
        }}
      />
      {qr.length <= QR_MAX_CHARS ? (
        showQr ? (
          <View style={{ alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12 }}>
            <QRCode value={qr} size={260} />
          </View>
        ) : (
          <Button kind="secondary" label={t('share.showQr')} onPress={() => setShowQr(true)} />
        )
      ) : (
        <Txt muted>{t('share.qrTooBig')}</Txt>
      )}
    </Sheet>
  );
}
