import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirmAsync } from '../../components/dialogs';
import { ImportSheet } from '../../components/ImportSheet';
import { ShareSheet } from '../../components/ShareSheet';
import { Button, Card, Row, Screen, Sheet, Txt } from '../../components/ui';
import { useT } from '../../i18n/useT';
import { armorClass } from '../../rules/combat';
import { totalLevel, uid } from '../../rules/core';
import { maxHp } from '../../rules/health';
import type { Character } from '../../rules/types';
import { useCharacters } from '../../store/characters';
import { useTheme } from '../../theme';

function HpBar({ c }: { c: Character }) {
  const th = useTheme();
  const max = maxHp(c);
  const pct = Math.max(0, Math.min(1, c.hp.current / max));
  return (
    <View style={{ height: 8, backgroundColor: th.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pct > 0.5 ? th.success : pct > 0.25 ? th.warning : th.hp }} />
    </View>
  );
}

export default function CharactersScreen() {
  const router = useRouter();
  const { t, loc } = useT();
  const characters = useCharacters((s) => s.characters);
  const add = useCharacters((s) => s.add);
  const remove = useCharacters((s) => s.remove);
  const [importing, setImporting] = useState(false);
  const [menu, setMenu] = useState<Character | null>(null);
  const [sharing, setSharing] = useState<Character | null>(null);
  const list = Object.values(characters).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Screen>
      <Row>
        <Button style={{ flex: 1 }} label={t('characters.create')} onPress={() => router.push('/character/new')} testID="create-character" />
        <Button kind="secondary" label={t('characters.import')} onPress={() => setImporting(true)} />
      </Row>
      {list.length === 0 ? <Txt muted>{t('characters.empty')}</Txt> : null}
      {list.map((c) => (
        <Pressable key={c.id} onPress={() => router.push({ pathname: '/character/[id]', params: { id: c.id } })} onLongPress={() => setMenu(c)} testID={`character-${c.name}`}>
          <Card>
            <Row>
              <View style={{ flex: 1 }}>
                <Txt variant="heading">{c.name || t('characters.untitled')}</Txt>
                <Txt muted variant="small">
                  {[loc(c.species.name), c.classes.map((k) => `${loc(k.name)} ${k.level}`).join(' / ')].filter(Boolean).join(' · ')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt variant="small" muted>
                  {t('sheet.level', { n: totalLevel(c) })}
                </Txt>
                <Txt variant="small" muted>
                  {t('sheet.ac')} {armorClass(c)} · {t('sheet.hpShort')} {c.hp.current}/{maxHp(c)}
                </Txt>
              </View>
              <Button small kind="ghost" label="⋯" onPress={() => setMenu(c)} />
            </Row>
            <HpBar c={c} />
          </Card>
        </Pressable>
      ))}
      <ImportSheet visible={importing} onClose={() => setImporting(false)} />
      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        <Button
          kind="secondary"
          label={t('common.share')}
          onPress={() => {
            setSharing(menu);
            setMenu(null);
          }}
        />
        <Button
          kind="secondary"
          label={t('characters.duplicate')}
          onPress={() => {
            if (menu) add({ ...menu, id: uid('char'), name: `${menu.name} (2)`, createdAt: Date.now(), updatedAt: Date.now() });
            setMenu(null);
          }}
        />
        <Button
          kind="danger"
          label={t('common.delete')}
          onPress={async () => {
            const target = menu;
            setMenu(null);
            if (target && (await confirmAsync(t('common.confirmDelete', { name: target.name }), t('common.delete'), t('common.cancel')))) remove(target.id);
          }}
        />
      </Sheet>
      {sharing ? <ShareSheet kind="character" payload={sharing} name={sharing.name} visible onClose={() => setSharing(null)} /> : null}
    </Screen>
  );
}
