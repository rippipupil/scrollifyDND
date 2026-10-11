import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useT } from '../../i18n/useT';
import { carriedWeight, carryingCapacity } from '../../rules/combat';
import { uid } from '../../rules/core';
import type { Character, Currency, InventoryItem, ItemKind } from '../../rules/types';
import { entryToItem } from '../../sheet/adapters';
import { useTheme } from '../../theme';
import { EntryPicker } from '../EntryPicker';
import { Button, Card, Chip, Field, NumberField, Row, Sheet, Stepper, Txt } from '../ui';
import type { Mutate } from './useCharacter';

const COINS: (keyof Currency)[] = ['pp', 'gp', 'ep', 'sp', 'cp'];
const COIN_LABEL: Record<keyof Currency, string> = { pp: 'pp', gp: 'po', ep: 'pe', sp: 'pa', cp: 'pc' };

export function InventoryTab({ c, mutate }: { c: Character; mutate: Mutate }) {
  const th = useTheme();
  const router = useRouter();
  const { t, loc } = useT();
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState<InventoryItem | null>(null);
  const setItem = (u: string, fn: (i: InventoryItem) => InventoryItem) => mutate((x) => ({ ...x, inventory: x.inventory.map((i) => (i.uid === u ? fn(i) : i)) }));
  const w = carriedWeight(c);
  const cap = carryingCapacity(c);

  return (
    <View style={{ gap: 12 }}>
      <Card title={t('sheet.currency')}>
        <Row>
          {COINS.map((k) => (
            <View key={k} style={{ flex: 1 }}>
              <NumberField label={COIN_LABEL[k]} value={c.currency[k]} min={0} max={9999999} onChange={(n) => mutate((x) => ({ ...x, currency: { ...x.currency, [k]: n ?? 0 } }))} />
            </View>
          ))}
        </Row>
        <Txt variant="small" muted style={{ color: w > cap ? th.danger : th.textMuted }}>
          {t('sheet.carrying', { w, max: cap })}
        </Txt>
      </Card>
      <Card title={t('sheet.inventory')}>
        {c.inventory.length === 0 ? <Txt muted>{t('common.empty')}</Txt> : null}
        {c.inventory.map((i) => (
          <View key={i.uid} style={{ borderTopWidth: 1, borderColor: th.border, paddingTop: 6, gap: 4 }}>
            <Row>
              <Pressable style={{ flex: 1 }} onPress={() => i.ref && router.push({ pathname: '/wiki/[key]', params: { key: i.ref } })}>
                <Txt style={{ fontWeight: '600' }}>{loc(i.name)}</Txt>
                <Txt variant="small" muted>
                  {i.weight ? `${i.weight} lb` : ''}
                  {i.notes ? ` · ${i.notes}` : ''}
                </Txt>
              </Pressable>
              <Stepper value={i.qty} min={0} max={9999} onChange={(n) => setItem(i.uid, (x) => ({ ...x, qty: n }))} />
            </Row>
            <Row wrap>
              {i.kind === 'weapon' || i.kind === 'armor' || i.kind === 'shield' || i.kind === 'magic' ? <Chip label={t('sheet.equipped')} active={i.equipped} onPress={() => setItem(i.uid, (x) => ({ ...x, equipped: !x.equipped }))} /> : null}
              {i.requiresAttunement || i.kind === 'magic' ? <Chip label={t('sheet.attuned')} active={i.attuned} onPress={() => setItem(i.uid, (x) => ({ ...x, attuned: !x.attuned }))} /> : null}
              <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, inventory: x.inventory.filter((y) => y.uid !== i.uid) }))} />
            </Row>
          </View>
        ))}
      </Card>
      <Button label={t('sheet.addItem')} onPress={() => setPicking(true)} testID="add-item" />
      <EntryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        title={t('sheet.addItem')}
        categories={['equipment', 'magic-item']}
        onPick={(e) => {
          mutate((x) => ({ ...x, inventory: [...x.inventory, entryToItem(e)] }));
          setPicking(false);
        }}
        onCustom={() => {
          setPicking(false);
          setCustom({ uid: uid('item'), name: { en: '' }, kind: 'gear', qty: 1, weight: 0, equipped: false, attuned: false });
        }}
      />
      <Sheet visible={!!custom} onClose={() => setCustom(null)} title={t('sheet.customItem')}>
        {custom ? (
          <>
            <Field label={t('common.name')} value={custom.name.en} onChangeText={(v) => setCustom({ ...custom, name: { en: v, es: v } })} />
            <Row wrap>
              {(['gear', 'weapon', 'armor', 'shield', 'magic', 'other'] as ItemKind[]).map((k) => (
                <Chip key={k} label={t(`itemKinds.${k}`)} active={custom.kind === k} onPress={() => setCustom({ ...custom, kind: k, weapon: k === 'weapon' ? custom.weapon ?? { damage: '1d6', damageType: 'slashing', properties: [], ranged: false, martial: false } : undefined, armor: k === 'armor' ? custom.armor ?? { type: 'light', base: 11 } : undefined, shieldBonus: k === 'shield' ? 2 : undefined })} />
              ))}
            </Row>
            {custom.weapon ? <Field label={t('sheet.dmg')} value={custom.weapon.damage} onChangeText={(v) => setCustom({ ...custom, weapon: { ...custom.weapon!, damage: v } })} /> : null}
            {custom.armor ? <NumberField label={t('sheet.ac')} value={custom.armor.base} min={0} max={30} onChange={(n) => setCustom({ ...custom, armor: { ...custom.armor!, base: n ?? 10 } })} /> : null}
            <NumberField label={t('sheet.weight')} value={custom.weight} min={0} max={9999} onChange={(n) => setCustom({ ...custom, weight: n ?? 0 })} />
            <Field label={t('sheet.notes')} value={custom.notes ?? ''} onChangeText={(v) => setCustom({ ...custom, notes: v })} />
            <Button
              label={t('common.add')}
              disabled={!custom.name.en.trim()}
              onPress={() => {
                mutate((x) => ({ ...x, inventory: [...x.inventory, custom] }));
                setCustom(null);
              }}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
