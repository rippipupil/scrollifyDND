import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AddEnemySheet } from '../../components/dm/AddEnemySheet';
import { EnemyEditor } from '../../components/dm/EnemyEditor';
import { StatBlock } from '../../components/dm/StatBlock';
import { confirmAsync } from '../../components/dialogs';
import { Button, Row, Screen, Txt } from '../../components/ui';
import { newEnemy } from '../../dm/enemy';
import { useT } from '../../i18n/useT';
import { uid } from '../../rules/core';
import { useDm } from '../../store/dm';

export default function EnemyScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const enemy = useDm((s) => s.enemies[id]);
  const saveEnemy = useDm((s) => s.saveEnemy);
  const removeEnemy = useDm((s) => s.removeEnemy);
  const { t } = useT();
  const [editing, setEditing] = useState(edit === '1');
  const [adding, setAdding] = useState(false);
  if (!enemy) {
    return (
      <Screen>
        <Txt>{t('common.empty')}</Txt>
      </Screen>
    );
  }
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: enemy.name || t('dm.unnamed'),
          headerRight: () => <Button small kind={editing ? 'primary' : 'secondary'} label={editing ? t('dm.done') : t('dm.edit')} onPress={() => setEditing(!editing)} testID="enemy-edit-toggle" />,
        }}
      />
      {editing ? <EnemyEditor enemy={enemy} onChange={saveEnemy} /> : <StatBlock enemy={enemy} />}
      <Row wrap>
        <Button style={{ flex: 1 }} label={t('dm.addToCombat')} onPress={() => setAdding(true)} testID="enemy-to-combat" />
        <Button
          style={{ flex: 1 }}
          kind="secondary"
          label={t('dm.duplicate')}
          onPress={() => {
            const copy = newEnemy({ ...enemy, id: uid('enemy'), name: `${enemy.name} ${t('dm.copySuffix')}`.trim(), actions: enemy.actions.map((a) => ({ ...a, uid: uid('act') })) });
            saveEnemy(copy);
            router.replace({ pathname: '/dm/[id]', params: { id: copy.id, edit: '1' } });
          }}
        />
        <Button
          style={{ flex: 1 }}
          kind="danger"
          label={t('dm.delete')}
          onPress={async () => {
            if (await confirmAsync(t('dm.confirmDelete', { name: enemy.name || t('dm.unnamed') }), t('dm.delete'), t('common.cancel'))) {
              router.back();
              removeEnemy(enemy.id);
            }
          }}
        />
      </Row>
      <AddEnemySheet enemy={enemy} visible={adding} onClose={() => setAdding(false)} />
    </Screen>
  );
}
