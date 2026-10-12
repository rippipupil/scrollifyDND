import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FullAttackSheet } from '../../../components/FullAttackSheet';
import { Avatar } from '../../../components/Portrait';
import { HpPanel } from '../../../components/sheet/HpPanel';
import { useCharacter } from '../../../components/sheet/useCharacter';
import { Card, Row, Screen, Txt } from '../../../components/ui';
import { getEntry } from '../../../content';
import { useT } from '../../../i18n/useT';
import { weaponAttacks } from '../../../rules/combat';
import { formatMod, saveBonus } from '../../../rules/core';
import { spellcastingStats, spellSlots } from '../../../rules/spellcasting';
import { ABILITIES } from '../../../rules/types';
import { spendPactSlot, spendSlot } from '../../../sheet/actions';
import { d20, useRolls } from '../../../store/rolls';
import { useTheme } from '../../../theme';

const KEEP_AWAKE_TAG = 'scrollify-table-mode';

/** Big button: value on top, label below. */
function Big({ value, label, onPress, color }: { value: string; label: string; onPress?: () => void; color?: string }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ flexGrow: 1, flexBasis: '30%', alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: pressed ? c.surfaceAlt : c.surface })}>
      <Text style={{ fontSize: 30, fontWeight: '800', color: color ?? c.text }}>{value}</Text>
      <Text style={{ fontSize: 13, color: c.textMuted }}>{label}</Text>
    </Pressable>
  );
}

/** Table mode: the screen stays on and the essentials are big, for playing at the table. */
export default function TableModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, mutate } = useCharacter(id);
  const { t, loc } = useT();
  const th = useTheme();
  const roll = useRolls((s) => s.roll);
  const [full, setFull] = useState<ReturnType<typeof weaponAttacks>[number] | null>(null);

  useEffect(() => {
    // Not every browser supports the wake lock; the screen just behaves normally there.
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  if (!c) {
    return (
      <Screen>
        <Txt>{t('common.empty')}</Txt>
      </Screen>
    );
  }
  const slots = spellSlots(c);
  const casting = spellcastingStats(c);
  const prepared = c.spellcasting.spells.filter((s) => s.level > 0 && (s.prepared || s.always)).sort((a, b) => a.level - b.level || loc(a.name).localeCompare(loc(b.name)));
  const cantrips = c.spellcasting.spells.filter((s) => s.level === 0);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${t('table.title')} · ${c.name || t('characters.untitled')}` }} />
      <Row>
        <Avatar uri={c.portraitUri} name={c.name} size={64} />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{c.name || t('characters.untitled')}</Txt>
          <Txt variant="small" muted>
            {t('table.awake')}
          </Txt>
        </View>
      </Row>
      <HpPanel c={c} mutate={mutate} />

      <Card title={t('sheet.savingThrows')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ABILITIES.map((a) => (
            <Big
              key={a}
              value={formatMod(saveBonus(c, a))}
              label={`${t(`abilities.short.${a}`)}${c.proficiencies.saves.includes(a) ? ' ●' : ''}`}
              onPress={() => roll(`${t('sheet.savingThrows')}: ${t(`abilities.${a}`)}`, d20(saveBonus(c, a)))}
            />
          ))}
        </View>
      </Card>

      {weaponAttacks(c).length ? (
        <Card title={t('sheet.attacks')}>
          {weaponAttacks(c).map((a) => (
            <Pressable key={a.id} onPress={() => setFull(a)} style={({ pressed }) => ({ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: th.border, backgroundColor: pressed ? th.surfaceAlt : th.surface })}>
              <Row>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: th.text }}>{loc(a.name)}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: th.accent }}>{formatMod(a.toHit)}</Text>
                <Text style={{ fontSize: 16, color: th.textMuted }}>
                  {a.damage} {t(`damageTypes.${a.damageType}`)}
                </Text>
              </Row>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {casting.length ? (
        <Card title={t('sheet.spells')}>
          <Row wrap>
            {casting.map((s) => (
              <Txt key={s.classId} style={{ fontSize: 18 }}>
                {t('sheet.spellDC')} <Txt style={{ fontWeight: '800', fontSize: 22 }}>{s.dc}</Txt> · {t('sheet.spellAttack')} <Txt style={{ fontWeight: '800', fontSize: 22 }}>{formatMod(s.attack)}</Txt>
              </Txt>
            ))}
          </Row>
          <Txt variant="small" muted>
            {t('table.slotsHint')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slots.slots.map((max, i) =>
              max > 0 ? (
                <Pressable
                  key={i}
                  onPress={() => mutate((x) => spendSlot(x, i + 1, 1))}
                  onLongPress={() => mutate((x) => spendSlot(x, i + 1, -1))}
                  style={{ padding: 8, borderRadius: 12, borderWidth: 1, borderColor: th.border, backgroundColor: th.surface, alignItems: 'center', minWidth: 64 }}
                  testID={`table-slot-${i + 1}`}
                >
                  <Text style={{ fontSize: 13, color: th.textMuted }}>{t('sheet.slotLevel', { n: i + 1 })}</Text>
                  <Text style={{ fontSize: 22, color: th.accent, letterSpacing: 2 }}>
                    {'●'.repeat(Math.max(0, max - (c.spellcasting.slotsUsed[i] ?? 0)))}
                    {'○'.repeat(Math.min(max, c.spellcasting.slotsUsed[i] ?? 0))}
                  </Text>
                </Pressable>
              ) : null,
            )}
            {slots.pact ? (
              <Pressable
                onPress={() => mutate((x) => spendPactSlot(x, 1))}
                onLongPress={() => mutate((x) => spendPactSlot(x, -1))}
                style={{ padding: 8, borderRadius: 12, borderWidth: 1, borderColor: th.border, backgroundColor: th.surface, alignItems: 'center', minWidth: 64 }}
              >
                <Text style={{ fontSize: 13, color: th.textMuted }}>{t('sheet.pactSlots', { n: slots.pact.level })}</Text>
                <Text style={{ fontSize: 22, color: th.accent, letterSpacing: 2 }}>
                  {'●'.repeat(Math.max(0, slots.pact.count - c.spellcasting.pactUsed))}
                  {'○'.repeat(Math.min(slots.pact.count, c.spellcasting.pactUsed))}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {cantrips.length ? (
            <Txt style={{ fontSize: 17 }}>
              <Txt style={{ fontWeight: '700', fontSize: 17 }}>{t('sheet.cantrips')}: </Txt>
              {cantrips.map((s) => loc(s.name)).join(', ')}
            </Txt>
          ) : null}
          {prepared.map((s) => (
            <Row key={s.uid}>
              <Text style={{ width: 28, fontSize: 18, fontWeight: '800', color: th.accent }}>{s.level}</Text>
              <Text style={{ flex: 1, fontSize: 18, color: th.text }}>{loc(s.name)}</Text>
              {s.concentration ? <Text style={{ color: th.textMuted }}>C</Text> : null}
              {s.ritual ? <Text style={{ color: th.textMuted }}>R</Text> : null}
            </Row>
          ))}
        </Card>
      ) : null}

      {c.conditions.length || c.exhaustion ? (
        <Card title={t('sheet.conditions')}>
          <Txt style={{ fontSize: 18 }}>
            {[...c.conditions.map((x) => loc(getEntry(`condition:${x}`)?.name) || x), c.exhaustion ? t('sheet.exhaustionLevel', { n: c.exhaustion }) : ''].filter(Boolean).join(' · ')}
          </Txt>
        </Card>
      ) : null}

      <FullAttackSheet visible={!!full} onClose={() => setFull(null)} label={full ? loc(full.name) : ''} toHit={full?.toHit ?? 0} damage={full?.damage ?? ''} damageType={full?.damageType} />
    </Screen>
  );
}
