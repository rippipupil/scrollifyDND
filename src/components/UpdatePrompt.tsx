import { useEffect, useState } from 'react';
import { Linking, Modal, Platform, View } from 'react-native';
import { useT } from '../i18n/useT';
import { useUpdate } from '../store/update';
import { useTheme } from '../theme';
import { currentVersion, downloadAndInstall } from '../update/updater';
import { Button, Txt } from './ui';

const forced = () => {
  try {
    return Platform.OS === 'web' && typeof localStorage !== 'undefined' && localStorage.getItem('scrollify.forceUpdateCheck') === '1';
  } catch {
    return false;
  }
};

/** Checks for a newer APK on launch and offers to download and install it in place. */
export function UpdatePrompt() {
  const th = useTheme();
  const { t } = useT();
  const { available, postponed, check, postpone } = useUpdate();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if ((Platform.OS === 'android' && !__DEV__) || forced()) void check();
  }, [check]);

  const visible = !!available && postponed !== available.versionCode;
  if (!available) return null;

  const install = async () => {
    setError(false);
    setProgress(0);
    try {
      await downloadAndInstall(available, setProgress);
    } catch {
      setError(true);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={postpone}>
      <View style={{ flex: 1, backgroundColor: th.overlay, justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: th.surface, borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: th.border }} testID="update-prompt">
          <Txt variant="title">{t('update.title')}</Txt>
          <Txt>{t('update.versions', { next: available.versionName, current: currentVersion() })}</Txt>
          {available.notes ? (
            <Txt muted style={{ fontStyle: 'italic' }}>
              {available.notes}
            </Txt>
          ) : null}
          <Txt variant="small" muted>
            {t('update.keepsData')}
          </Txt>
          {progress !== null ? (
            <View style={{ gap: 4 }}>
              <View style={{ height: 8, backgroundColor: th.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: th.accent }} />
              </View>
              <Txt variant="small" muted>
                {t('update.downloading', { pct: Math.round(progress * 100) })}
              </Txt>
            </View>
          ) : null}
          {error ? (
            <>
              <Txt style={{ color: th.danger }}>{t('update.failed')}</Txt>
              <Button kind="secondary" label={t('update.openBrowser')} onPress={() => Linking.openURL(available.apk)} />
            </>
          ) : null}
          <Button label={t('update.now')} disabled={progress !== null} onPress={install} testID="update-now" />
          <Button kind="ghost" label={t('update.later')} disabled={progress !== null} onPress={postpone} testID="update-later" />
        </View>
      </View>
    </Modal>
  );
}
