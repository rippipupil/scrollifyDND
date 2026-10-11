import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useT } from '../../i18n/useT';
import { formatMod, uid } from '../../rules/core';
import { spellcastingStats, spellSlots } from '../../rules/spellcasting';
import type { Character, KnownSpell } from '../../rules/types';
import { availableSlots, castSpell } from '../../sheet/actions';
import { entryToSpell } from '../../sheet/adapters';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { EntryPicker } from '../EntryPicker';
import { notify } from '../ImportSheet';
import { Badge, Button, Card, Chip, Field, NumberField, Row, Sheet, Txt } from '../ui';
import type { Mutate } from './useCharacter';

function Pips({ total, used, onToggle }: { total: number; used: number; onToggle: (i: number) => void }) {
  const th = useTheme();
  return (
    <Row wrap>
      {Array.from({ length: total }, (_, i) => (
        <Pressable key={i} onPress={() => onToggle(i)} hitSlop={6}>
          <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: th.accent, backgroundColor: i < total - used ? th.accent : 'transparent' }} />
        </Pressable>
      ))}
    </Row>
  );
}

export function SpellsTab({ c, mutate }: { c: Character; mutate: Mutate }) {
  const th = useTheme();
  const router = useRouter();
  const { t, loc } = useT();
  const roll = useRolls((s) => s.roll);
  const [casting, setCasting] = useState<KnownSpell | null>(null);
  const [picking, setPicking] = useState(false);
  const [custom, setCustom] = useState<KnownSpell | null>(null);
  const stats = spellcastingStats(c);
  const slots = spellSlots(c);
  const avail = availableSlots(c);
  const casterClasses = c.classes.filter((k) => k.casterType !== 'none').map((k) => k.classId);

  const doCast = (s: KnownSpell, slot: number | 'pact' | 'ritual') => {
    const r = castSpell(c, s.uid, slot);
    if (!r.ok) return notify(t('sheet.noSlots'));
    mutate(() => r.character);
    if (r.replacedConcentration) notify(t('sheet.concentrationLost'));
    setCasting(null);
  };

  const levels = [...new Set(c.spellcasting.spells.map((s) => s.level))].sort((a, b) => a - b);

  return (
    <View style={{ gap: 12 }}>
      {stats.length === 0 && c.spellcasting.spells.length === 0 ? <Txt muted>{t('sheet.noSpells')}</Txt> : null}
      {stats.map((s) => (
        <Card key={s.classId}>
          <Row>
            <Txt style={{ flex: 1, fontWeight: '700' }}>
              {loc(s.className)} · {t(`abilities.${s.ability}`)}
            </Txt>
          </Row>
          <Row>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Txt variant="title">{s.dc}</Txt>
              <Txt variant="small" muted>
                {t('sheet.spellDC')}
              </Txt>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Button kind="secondary" label={formatMod(s.attack)} onPress={() => roll(t('sheet.spellAttack'), d20(s.attack))} />
              <Txt variant="small" muted>
                {t('sheet.spellAttack')}
              </Txt>
            </View>
          </Row>
        </Card>
      ))}
      {slots.slots.some((n) => n > 0) || slots.pact ? (
        <Card title={t('sheet.slots')}>
          {slots.slots.map((max, i) =>
            max > 0 ? (
              <Row key={i}>
                <Txt style={{ width: 70 }}>{t('sheet.slotLevel', { n: i + 1 })}</Txt>
                <Pips
                  total={max}
                  used={c.spellcasting.slotsUsed[i]}
                  onToggle={(p) =>
                    mutate((x) => {
                      const used = [...x.spellcasting.slotsUsed];
                      used[i] = p < max - used[i] ? used[i] + 1 : Math.max(0, used[i] - 1);
                      return { ...x, spellcasting: { ...x.spellcasting, slotsUsed: used } };
                    })
                  }
                />
              </Row>
            ) : null,
          )}
          {slots.pact ? (
            <Row>
              <Txt style={{ width: 150 }}>{t('sheet.pactSlots', { n: slots.pact.level })}</Txt>
              <Pips
                total={slots.pact.count}
                used={c.spellcasting.pactUsed}
                onToggle={(p) => mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, pactUsed: p < slots.pact!.count - x.spellcasting.pactUsed ? x.spellcasting.pactUsed + 1 : Math.max(0, x.spellcasting.pactUsed - 1) } }))}
              />
            </Row>
          ) : null}
        </Card>
      ) : null}

      {levels.map((lvl) => (
        <Card key={lvl} title={lvl === 0 ? t('sheet.cantrips') : t('sheet.slotLevel', { n: lvl })}>
          {c.spellcasting.spells
            .filter((s) => s.level === lvl)
            .map((s) => (
              <View key={s.uid} style={{ borderTopWidth: 1, borderColor: th.border, paddingTop: 6 }}>
                <Row>
                  <Pressable style={{ flex: 1 }} onPress={() => s.ref && router.push({ pathname: '/wiki/[key]', params: { key: s.ref } })}>
                    <Txt style={{ fontWeight: '600', color: s.prepared || s.always ? th.text : th.textMuted }}>{loc(s.name)}</Txt>
                    <Row wrap style={{ gap: 4 }}>
                      {s.concentration ? <Badge label="C" /> : null}
                      {s.ritual ? <Badge label="R" /> : null}
                      {s.always ? <Badge label={t('sheet.alwaysPrepared')} /> : null}
                    </Row>
                  </Pressable>
                  {lvl > 0 && !s.always ? <Chip label={t('sheet.prepared')} active={s.prepared} onPress={() => mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, spells: x.spellcasting.spells.map((y) => (y.uid === s.uid ? { ...y, prepared: !y.prepared } : y)) } }))} /> : null}
                  <Button small label={t('sheet.cast')} onPress={() => (lvl === 0 ? doCast(s, 0) : setCasting(s))} testID={`cast-${s.name.en}`} />
                  <Button small kind="ghost" label="✕" onPress={() => mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, spells: x.spellcasting.spells.filter((y) => y.uid !== s.uid) } }))} />
                </Row>
              </View>
            ))}
        </Card>
      ))}

      <Row>
        <Button style={{ flex: 1 }} label={t('sheet.addSpell')} onPress={() => setPicking(true)} testID="add-spell" />
      </Row>

      <Sheet visible={!!casting} onClose={() => setCasting(null)} title={casting ? `${t('sheet.cast')}: ${loc(casting.name)}` : ''}>
        {casting ? (
          <>
            <Txt muted>{t('sheet.castAt')}</Txt>
            <Row wrap>
              {avail.slots.map((n, i) =>
                i + 1 >= casting.level && slots.slots[i] > 0 ? <Button key={i} small kind={n > 0 ? 'primary' : 'secondary'} disabled={n <= 0} label={`${t('sheet.slotLevel', { n: i + 1 })} (${n})`} onPress={() => doCast(casting, i + 1)} testID={`slot-${i + 1}`} /> : null,
              )}
              {avail.pact && avail.pact.level >= casting.level ? <Button small label={`${t('sheet.pactSlots', { n: avail.pact.level })} (${avail.pact.count})`} disabled={avail.pact.count <= 0} onPress={() => doCast(casting, 'pact')} /> : null}
            </Row>
            {casting.ritual ? <Button kind="secondary" label={t('sheet.ritualCast')} onPress={() => doCast(casting, 'ritual')} /> : null}
          </>
        ) : null}
      </Sheet>

      <EntryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        title={t('sheet.addSpell')}
        categories={['spell']}
        filters={casterClasses.length === 1 ? { spellClass: casterClasses[0] } : undefined}
        onPick={(e) => {
          const caster = c.classes.find((k) => k.casterType !== 'none' && (!e.data?.classes || e.data.classes.includes(k.classId)));
          mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, spells: [...x.spellcasting.spells, entryToSpell(e, caster?.classId)] } }));
          setPicking(false);
        }}
        onCustom={() => {
          setPicking(false);
          setCustom({ uid: uid('spell'), name: { en: '', es: '' }, level: 1, prepared: true });
        }}
      />

      <Sheet visible={!!custom} onClose={() => setCustom(null)} title={t('sheet.customSpell')}>
        {custom ? (
          <>
            <Field label={t('common.name')} value={custom.name.es ?? ''} onChangeText={(v) => setCustom({ ...custom, name: { en: v, es: v } })} />
            <NumberField label={t('common.level')} value={custom.level} min={0} max={9} onChange={(n) => setCustom({ ...custom, level: n ?? 0 })} />
            <Row wrap>
              <Chip label={t('wiki.concentration')} active={!!custom.concentration} onPress={() => setCustom({ ...custom, concentration: !custom.concentration })} />
              <Chip label={t('wiki.ritual')} active={!!custom.ritual} onPress={() => setCustom({ ...custom, ritual: !custom.ritual })} />
            </Row>
            <Field label={t('sheet.notes')} value={custom.notes ?? ''} onChangeText={(v) => setCustom({ ...custom, notes: v })} multiline />
            <Button
              label={t('common.add')}
              disabled={!custom.name.en.trim()}
              onPress={() => {
                mutate((x) => ({ ...x, spellcasting: { ...x.spellcasting, spells: [...x.spellcasting.spells, { ...custom, always: custom.level === 0 || undefined }] } }));
                setCustom(null);
              }}
            />
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
