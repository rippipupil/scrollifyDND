import { useUpdate } from '../../store/update';
import { currentVersion } from '../../update/updater';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { confirmAsync } from '../../components/dialogs';
import { ImportSheet, notify } from '../../components/ImportSheet';
import { ShareSheet } from '../../components/ShareSheet';
import { Button, Card, Chip, Row, Screen, Txt } from '../../components/ui';
import { EntryRow } from '../../components/wiki/EntryRow';
import { keyOf } from '../../content';
import { useT } from '../../i18n/useT';
import { useHomebrew } from '../../store/homebrew';
import { useSettings } from '../../store/settings';

export default function SettingsScreen() {
  const checking = useUpdate((x) => x.checking);
  const checkUpdate = useUpdate((x) => x.check);
  const router = useRouter();
  const { t } = useT();
  const { lang, theme, setLang, setTheme } = useSettings();
  const entries = useHomebrew((s) => s.entries);
  const remove = useHomebrew((s) => s.remove);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  return (
    <Screen>
      <Card title={t('settings.language')}>
        <Row>
          <Chip label="Español" active={lang === 'es'} onPress={() => setLang('es')} />
          <Chip label="English" active={lang === 'en'} onPress={() => setLang('en')} />
        </Row>
      </Card>
      <Card title={t('settings.theme')}>
        <Row wrap>
          {(['system', 'light', 'dark'] as const).map((k) => (
            <Chip key={k} label={t(`settings.${k}`)} active={theme === k} onPress={() => setTheme(k)} />
          ))}
        </Row>
      </Card>
      <Card title={t('settings.homebrew')}>
        <Txt muted>{t('settings.homebrewHint')}</Txt>
        <Row wrap>
          <Button small label={t('settings.newEntry')} onPress={() => router.push('/homebrew/edit')} />
          <Button small kind="secondary" label={t('settings.exportPack')} disabled={!entries.length} onPress={() => setExporting(true)} />
          <Button small kind="secondary" label={t('settings.importPack')} onPress={() => setImporting(true)} />
        </Row>
        {entries.map((e) => (
          <View key={keyOf(e)}>
            <EntryRow entry={e} onPress={() => router.push({ pathname: '/homebrew/edit', params: { key: keyOf(e) } })} />
            <Row style={{ justifyContent: 'flex-end' }}>
              <Button
                small
                kind="ghost"
                label={t('common.delete')}
                onPress={async () => {
                  if (await confirmAsync(t('common.confirmDelete', { name: e.name.es ?? e.name.en }), t('common.delete'), t('common.cancel'))) remove(e.id);
                }}
              />
            </Row>
          </View>
        ))}
      </Card>
      <Card title={t('settings.about')}>
        <Txt muted>{t('update.version', { v: currentVersion() })}</Txt>
        <Button
          kind="secondary"
          label={checking ? t('update.checking') : t('update.check')}
          disabled={checking}
          onPress={async () => {
            await checkUpdate();
            const r = useUpdate.getState().lastResult;
            if (r !== 'available') notify(t(r === 'upToDate' ? 'update.upToDate' : 'update.offline'));
          }}
          testID="check-update"
        />
        <Button kind="secondary" label={t('settings.credits')} onPress={() => router.push('/credits')} />
      </Card>
      <ShareSheet kind="homebrew" payload={entries} name="homebrew" visible={exporting} onClose={() => setExporting(false)} />
      <ImportSheet visible={importing} onClose={() => setImporting(false)} />
    </Screen>
  );
}
