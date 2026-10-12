import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { crLabel, enemyFromMonster, newEnemy } from '../../dm/enemy';
import { useT } from '../../i18n/useT';
import { useDm } from '../../store/dm';
import { normalize } from '../../wiki/search';
import { EntryPicker } from '../EntryPicker';
import { ImportSheet } from '../ImportSheet';
import { ShareSheet } from '../ShareSheet';
import { Badge, Button, Card, Field, Row, Txt } from '../ui';

const open = (id: string, edit = false) => router.push({ pathname: '/dm/[id]', params: edit ? { id, edit: '1' } : { id } });

export function BestiaryView() {
  const { t, lang } = useT();
  const enemies = useDm((s) => s.enemies);
  const saveEnemy = useDm((s) => s.saveEnemy);
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const list = useMemo(() => {
    const nq = normalize(q);
    return Object.values(enemies)
      .filter((e) => !nq || normalize(`${e.name} ${e.type}`).includes(nq))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enemies, q]);
  const all = Object.values(enemies);

  return (
    <View style={{ gap: 10 }}>
      <Row wrap>
        <Button
          style={{ flex: 1 }}
          label={t('dm.newEnemy')}
          testID="new-enemy"
          onPress={() => {
            const e = newEnemy();
            saveEnemy(e);
            open(e.id, true);
          }}
        />
        <Button style={{ flex: 1 }} kind="secondary" label={t('dm.fromSrd')} onPress={() => setPicking(true)} testID="enemy-from-srd" />
      </Row>
      {all.length > 4 ? <Field placeholder={t('dm.search')} value={q} onChangeText={setQ} /> : null}
      {!all.length ? <Txt muted>{t('dm.noEnemies')}</Txt> : null}
      {list.map((e) => (
        <Pressable key={e.id} onPress={() => open(e.id)} testID={`enemy-${e.id}`}>
          <Card>
            <Row>
              <Txt style={{ flex: 1, fontWeight: '700' }}>{e.name || t('dm.unnamed')}</Txt>
              <Badge label={`${t('dm.cr')} ${crLabel(e.cr)}`} />
            </Row>
            <Txt muted variant="small">
              {[`${t('dm.ac')} ${e.ac}`, `${t('dm.hp')} ${e.hpMax}`, e.type, e.vulnerabilities.length ? `⚠ ${e.vulnerabilities.length}` : ''].filter(Boolean).join(' · ')}
            </Txt>
          </Card>
        </Pressable>
      ))}
      <Row wrap>
        <Button small kind="secondary" label={t('dm.exportBestiary')} disabled={!all.length} onPress={() => setExporting(true)} />
        <Button small kind="secondary" label={t('dm.importBestiary')} onPress={() => setImporting(true)} />
      </Row>
      <EntryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        title={t('dm.fromSrd')}
        categories={['monster']}
        onPick={(entry) => {
          const e = enemyFromMonster(entry, lang);
          saveEnemy(e);
          setPicking(false);
          open(e.id);
        }}
      />
      <ShareSheet kind="enemies" payload={all} name={t('dm.bestiary')} visible={exporting} onClose={() => setExporting(false)} />
      <ImportSheet visible={importing} onClose={() => setImporting(false)} />
    </View>
  );
}
