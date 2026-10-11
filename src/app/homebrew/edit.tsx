import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Chip, Field, NumberField, Row, Screen, Txt } from '../../components/ui';
import { getEntry } from '../../content';
import type { Category, ContentEntry } from '../../content/types';
import { useT } from '../../i18n/useT';
import { uid } from '../../rules/core';
import { useHomebrew } from '../../store/homebrew';

const CATS: Category[] = ['spell', 'species', 'feat', 'feature', 'background', 'equipment', 'magic-item', 'subclass', 'rule'];
const SCHOOLS = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];

export default function HomebrewEditScreen() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const router = useRouter();
  const { t } = useT();
  const entries = useHomebrew((s) => s.entries);
  const upsert = useHomebrew((s) => s.upsert);
  const existing = key ? getEntry(key, entries) : undefined;
  const [e, setE] = useState<ContentEntry>(existing ?? { id: uid('hb'), category: 'spell', name: { en: '', es: '' }, text: { en: '', es: '' }, source: 'homebrew', data: { level: 1, school: 'evocation', classes: [], concentration: false, ritual: false } });
  const d = e.data ?? {};
  const setData = (patch: Record<string, unknown>) => setE({ ...e, data: { ...d, ...patch } });
  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.homebrew') }} />
      <Card title={t('settings.category')}>
        <Row wrap>
          {CATS.map((c) => (
            <Chip key={c} label={t(`categories.${c}`)} active={e.category === c} onPress={() => setE({ ...e, category: c, data: c === 'spell' ? { level: 1, school: 'evocation', classes: [], concentration: false, ritual: false } : c === 'species' ? { speed: 30, size: 'Medium', traits: [] } : {} })} />
          ))}
        </Row>
      </Card>
      <Card>
        <Field label={t('settings.entryName')} value={e.name.es ?? ''} onChangeText={(v) => setE({ ...e, name: { ...e.name, es: v } })} />
        <Field label={t('settings.entryNameEn')} value={e.name.en} onChangeText={(v) => setE({ ...e, name: { ...e.name, en: v } })} />
        <Field label={t('settings.entryText')} value={e.text?.es ?? e.text?.en ?? ''} multiline style={{ minHeight: 160 }} onChangeText={(v) => setE({ ...e, text: { en: v, es: v } })} />
        <Txt variant="small" muted>
          Markdown: **negrita**, _cursiva_, - listas, | tablas |
        </Txt>
      </Card>
      {e.category === 'spell' ? (
        <Card>
          <NumberField label={t('settings.spellLevel')} value={d.level} min={0} max={9} onChange={(n) => setData({ level: n ?? 0 })} />
          <Row wrap>
            {SCHOOLS.map((s) => (
              <Chip key={s} label={t(`schools.${s}`)} active={d.school === s} onPress={() => setData({ school: s })} />
            ))}
          </Row>
          <Row wrap>
            {['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'].map((k) => (
              <Chip key={k} label={t(`classNames.${k}`)} active={(d.classes ?? []).includes(k)} onPress={() => setData({ classes: (d.classes ?? []).includes(k) ? d.classes.filter((x: string) => x !== k) : [...(d.classes ?? []), k] })} />
            ))}
          </Row>
          <Row wrap>
            <Chip label={t('wiki.concentration')} active={!!d.concentration} onPress={() => setData({ concentration: !d.concentration })} />
            <Chip label={t('wiki.ritual')} active={!!d.ritual} onPress={() => setData({ ritual: !d.ritual })} />
          </Row>
          <Field label={t('wiki.castingTime')} value={d.castingTime?.es ?? ''} onChangeText={(v) => setData({ castingTime: { en: v, es: v } })} />
          <Field label={t('wiki.range')} value={d.range?.es ?? ''} onChangeText={(v) => setData({ range: { en: v, es: v } })} />
          <Field label={t('wiki.duration')} value={d.duration?.es ?? ''} onChangeText={(v) => setData({ duration: { en: v, es: v } })} />
        </Card>
      ) : null}
      {e.category === 'species' ? (
        <Card>
          <NumberField label={`${t('sheet.speed')} (ft)`} value={d.speed} min={0} max={120} onChange={(n) => setData({ speed: n ?? 30 })} />
          <Row wrap>
            {['Small', 'Medium', 'Large'].map((s) => (
              <Chip key={s} label={t(`sizes.${s}`)} active={d.size === s} onPress={() => setData({ size: s })} />
            ))}
          </Row>
        </Card>
      ) : null}
      {e.category === 'equipment' || e.category === 'magic-item' ? (
        <Card>
          <NumberField label={t('sheet.weight')} value={d.weight} min={0} max={9999} onChange={(n) => setData({ weight: n ?? 0 })} />
          {e.category === 'magic-item' ? <Chip label={t('wiki.attunement')} active={!!d.attunement} onPress={() => setData({ attunement: !d.attunement })} /> : null}
        </Card>
      ) : null}
      <Button
        label={t('common.save')}
        disabled={!e.name.en.trim() && !e.name.es?.trim()}
        onPress={() => {
          // The English name falls back to the Spanish one only at save time.
          upsert({ ...e, name: { ...e.name, en: e.name.en.trim() || e.name.es?.trim() || '' } });
          router.back();
        }}
      />
    </Screen>
  );
}
