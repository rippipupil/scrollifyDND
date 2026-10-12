import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  addCharacter,
  addEffect,
  addOther,
  applyCombatDamage,
  applyCombatHeal,
  emptyEncounter,
  nextTurn,
  orderedCombatants,
  patchCombatant,
  removeCombatant,
  removeEffect,
  rollEnemyInitiative,
  setCombatTemp,
  setInitiative,
  toggleCombatCondition,
} from '../../dm/encounter';
import type { Combatant } from '../../dm/types';
import { useT } from '../../i18n/useT';
import { formatMod } from '../../rules/core';
import { useCharacters } from '../../store/characters';
import { useDm } from '../../store/dm';
import { d20, useRolls } from '../../store/rolls';
import { useTheme } from '../../theme';
import { confirmAsync } from '../dialogs';
import { Badge, Button, Card, Chip, Field, NumberField, Row, Sheet, Txt } from '../ui';
import { AddEnemySheet } from './AddEnemySheet';
import { CONDITION_IDS, StatBlock, useDmLabels } from './StatBlock';

function HpSheet({ c, onClose }: { c: Combatant | null; onClose: () => void }) {
  const { t } = useT();
  const updateEncounter = useDm((s) => s.updateEncounter);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const apply = (fn: typeof applyCombatDamage) => {
    if (c && amount) updateEncounter((enc) => fn(enc, c.uid, amount));
    setAmount(undefined);
    onClose();
  };
  return (
    <Sheet visible={!!c} onClose={onClose} title={c ? `${c.name}: ${c.hp}/${c.hpMax}${c.temp ? ` (+${c.temp})` : ''}` : ''}>
      <NumberField label={t('sheet.amount')} value={amount} allowEmpty min={0} max={9999} onChange={setAmount} />
      <Row>
        <Button style={{ flex: 1 }} kind="danger" label={t('sheet.damage')} onPress={() => apply(applyCombatDamage)} testID="cmb-damage" />
        <Button style={{ flex: 1 }} label={t('sheet.heal')} onPress={() => apply(applyCombatHeal)} />
        <Button style={{ flex: 1 }} kind="secondary" label={t('sheet.temp')} onPress={() => apply(setCombatTemp)} />
      </Row>
    </Sheet>
  );
}

/** Adds one effect (Bless, Haste, grappled…) to one or more combatants for the rounds the DM sets. */
function EffectSheet({ preset, onClose }: { preset: string[] | null; onClose: () => void }) {
  const { t } = useT();
  const encounter = useDm((s) => s.encounter);
  const combatants = orderedCombatants(encounter);
  const updateEncounter = useDm((s) => s.updateEncounter);
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState<number | undefined>(10);
  const [picked, setPicked] = useState<string[]>([]);
  const [lastPreset, setLastPreset] = useState<string[] | null>(null);
  if (preset !== lastPreset) {
    setLastPreset(preset);
    if (preset) setPicked(preset);
  }
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <Sheet visible={!!preset} onClose={onClose} title={t('effects.add')}>
      <Field label={t('effects.name')} value={name} onChangeText={setName} placeholder={t('effects.namePlaceholder')} testID="effect-name" />
      <Row wrap>
        {t('effects.presets')
          .split(',')
          .map((p) => (
            <Chip key={p} label={p} active={name === p} onPress={() => setName(p)} />
          ))}
      </Row>
      <NumberField label={t('effects.rounds')} value={rounds} allowEmpty min={0} max={999} onChange={setRounds} placeholder="∞" testID="effect-rounds" />
      <Txt variant="small" muted>
        {t('effects.roundsHint')}
      </Txt>
      <Txt variant="small" muted>
        {t('effects.who')}
      </Txt>
      <Row wrap>
        {combatants.map((x) => (
          <Chip key={x.uid} label={x.name || t('dm.unnamed')} active={picked.includes(x.uid)} onPress={() => toggle(x.uid)} />
        ))}
      </Row>
      <Button
        label={t('common.add')}
        disabled={!name.trim() || !picked.length}
        testID="effect-add"
        onPress={() => {
          updateEncounter((enc) => addEffect(enc, picked, name, rounds));
          setName('');
          onClose();
        }}
      />
    </Sheet>
  );
}

function CombatantRow({ c, active, onHp, onEffect }: { c: Combatant; active: boolean; onHp: () => void; onEffect: () => void }) {
  const { t } = useT();
  const th = useTheme();
  const L = useDmLabels();
  const enemy = useDm((s) => (c.enemyId ? s.enemies[c.enemyId] : undefined));
  const updateEncounter = useDm((s) => s.updateEncounter);
  const roll = useRolls((s) => s.roll);
  const all = useDm((s) => s.encounter.combatants);
  const others = all.filter((x) => x.uid !== c.uid && x.kind !== 'other');
  const [open, setOpen] = useState(false);
  const down = c.kind === 'enemy' && c.hp <= 0;
  const pct = c.hpMax ? Math.max(0, Math.min(1, c.hp / c.hpMax)) : 0;
  return (
    <Card style={{ borderWidth: active ? 2 : 1, borderColor: active ? th.accent : th.border, opacity: down ? 0.6 : 1 }}>
      <Row>
        <View style={{ width: 64 }}>
          <NumberField value={c.initiative ?? undefined} allowEmpty min={-10} max={50} placeholder={formatMod(c.initBonus)} onChange={(n) => updateEncounter((enc) => setInitiative(enc, c.uid, n ?? null))} />
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(!open)} testID={`cmb-${c.name}`}>
          <Txt style={{ fontWeight: '700' }}>
            {active ? '▶ ' : ''}
            {c.name || t('dm.unnamed')}
          </Txt>
          <Row wrap>
            {c.kind !== 'other' ? <Txt variant="small" muted>{`${t('dm.ac')} ${c.ac}`}</Txt> : null}
            {down ? <Badge label={t('dm.defeated')} color={th.danger} /> : null}
            {c.conditions.map((x) => (
              <Badge key={x} label={L.condition(x)} />
            ))}
            {c.effects.map((x) => (
              <Badge key={x.uid} label={x.remaining === null ? x.name : `${x.name} · ${x.remaining}`} color={th.accent} />
            ))}
          </Row>
        </Pressable>
        {c.hpMax ? (
          <Pressable onPress={onHp} style={{ minWidth: 76, alignItems: 'flex-end' }} testID={`cmb-hp-${c.name}`}>
            <Txt style={{ fontWeight: '800', color: down ? th.danger : th.text }}>
              {c.hp}/{c.hpMax}
              {c.temp ? <Txt style={{ color: th.temp }}> +{c.temp}</Txt> : null}
            </Txt>
            <View style={{ height: 6, width: 70, backgroundColor: th.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pct > 0.5 ? th.success : pct > 0.25 ? th.warning : th.hp }} />
            </View>
          </Pressable>
        ) : null}
      </Row>
      {open ? (
        <View style={{ gap: 8 }}>
          <Row wrap>
            <Button small kind="secondary" label={`${t('dm.initiative')} ${formatMod(c.initBonus)}`} onPress={() => {
              const r = roll(`${c.name}: ${t('dm.initiative')}`, d20(c.initBonus));
              if (r) updateEncounter((enc) => setInitiative(enc, c.uid, r.result.total));
            }} />
            <Button small kind="danger" label={t('dm.remove')} onPress={() => updateEncounter((enc) => removeCombatant(enc, c.uid))} />
          </Row>
          <Row wrap>
            {CONDITION_IDS.map((x) => (
              <Chip key={x} label={L.condition(x)} active={c.conditions.includes(x)} onPress={() => updateEncounter((enc) => toggleCombatCondition(enc, c.uid, x))} />
            ))}
          </Row>
          <View style={{ gap: 4 }}>
            <Row>
              <Txt style={{ flex: 1, fontWeight: '700' }}>{t('effects.title')}</Txt>
              <Button small kind="secondary" label={`+ ${t('effects.effect')}`} onPress={onEffect} testID={`cmb-effect-${c.name}`} />
            </Row>
            {c.effects.map((x) => (
              <Row key={x.uid}>
                <Txt style={{ flex: 1 }}>{x.name}</Txt>
                <Txt variant="small" muted>
                  {x.remaining === null ? t('effects.untimed') : t('effects.left', { n: x.remaining })}
                </Txt>
                <Button small kind="ghost" label="✕" onPress={() => updateEncounter((enc) => removeEffect(enc, c.uid, x.uid))} />
              </Row>
            ))}
          </View>
          <Field label={t('dm.note')} value={c.note} onChangeText={(note) => updateEncounter((enc) => patchCombatant(enc, c.uid, { note }))} />
          {enemy ? (
            <StatBlock
              enemy={enemy}
              who={c.name}
              targets={others.map((x) => ({ uid: x.uid, name: x.name, ac: x.ac }))}
              onApplyDamage={(target, amount) => updateEncounter((enc) => applyCombatDamage(enc, target, amount))}
            />
          ) : null}
        </View>
      ) : c.note ? (
        <Txt variant="small" muted>
          {c.note}
        </Txt>
      ) : null}
    </Card>
  );
}

export function CombatView() {
  const { t } = useT();
  const th = useTheme();
  const encounter = useDm((s) => s.encounter);
  const updateEncounter = useDm((s) => s.updateEncounter);
  const characters = useCharacters((s) => s.characters);
  const [addingEnemy, setAddingEnemy] = useState(false);
  const [addingPc, setAddingPc] = useState(false);
  const [addingOther, setAddingOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [hpFor, setHpFor] = useState<string | null>(null);
  const [effectFor, setEffectFor] = useState<string[] | null>(null);
  const order = orderedCombatants(encounter);
  const hpTarget = encounter.combatants.find((c) => c.uid === hpFor) ?? null;
  const hasPc = encounter.combatants.some((c) => c.kind === 'pc');
  const inFight = new Set(encounter.combatants.map((c) => c.characterId).filter(Boolean));

  return (
    <View style={{ gap: 10 }}>
      <Card>
        <Txt variant="title" testID="dm-round">
          {encounter.round ? t('dm.round', { n: encounter.round }) : t('dm.notStarted')}
        </Txt>
        <Row wrap>
          <Button style={{ flex: 1 }} label={encounter.round ? t('dm.nextTurn') : t('dm.start')} disabled={!order.length} onPress={() => updateEncounter(nextTurn)} testID="next-turn" />
          <Button style={{ flex: 1 }} kind="secondary" label={t('dm.rollInit')} disabled={!encounter.combatants.some((c) => c.kind === 'enemy' && c.initiative === null)} onPress={() => updateEncounter((enc) => rollEnemyInitiative(enc))} testID="roll-init" />
        </Row>
        <Row wrap>
          <Button small kind="secondary" label={`+ ${t('dm.addEnemy')}`} onPress={() => setAddingEnemy(true)} testID="add-enemy" />
          <Button small kind="secondary" label={`+ ${t('dm.addCharacter')}`} onPress={() => setAddingPc(true)} />
          <Button small kind="secondary" label={`+ ${t('dm.addOther')}`} onPress={() => setAddingOther(true)} />
          {order.length ? <Button small kind="secondary" label={`+ ${t('effects.effect')}`} onPress={() => setEffectFor([])} testID="add-effect" /> : null}
          {order.length ? (
            <Button
              small
              kind="ghost"
              label={t('dm.endCombat')}
              onPress={async () => {
                if (await confirmAsync(t('dm.confirmEnd'), t('dm.endCombat'), t('common.cancel'))) updateEncounter(emptyEncounter);
              }}
            />
          ) : null}
        </Row>
      </Card>
      {encounter.expired.length ? (
        <Card style={{ borderColor: th.warning, borderWidth: 2 }}>
          <Row>
            <Txt style={{ flex: 1 }} testID="effects-expired">
              {t('effects.expired', { list: encounter.expired.map((x) => `${x.effect} (${x.who})`).join(', ') })}
            </Txt>
            <Button small kind="ghost" label="✕" onPress={() => updateEncounter((enc) => ({ ...enc, expired: [] }))} />
          </Row>
        </Card>
      ) : null}
      {!order.length ? <Txt muted>{t('dm.empty')}</Txt> : null}
      {hasPc ? (
        <Txt variant="small" muted>
          {t('dm.pcCopyHint')}
        </Txt>
      ) : null}
      {order.map((c) => (
        <CombatantRow key={c.uid} c={c} active={encounter.activeUid === c.uid} onHp={() => setHpFor(c.uid)} onEffect={() => setEffectFor([c.uid])} />
      ))}

      <HpSheet c={hpTarget} onClose={() => setHpFor(null)} />
      <EffectSheet preset={effectFor} onClose={() => setEffectFor(null)} />
      <AddEnemySheet visible={addingEnemy} onClose={() => setAddingEnemy(false)} />
      <Sheet visible={addingPc} onClose={() => setAddingPc(false)} title={t('dm.addCharacter')}>
        {Object.values(characters).length ? (
          Object.values(characters).map((ch) => (
            <Button
              key={ch.id}
              kind="secondary"
              label={ch.name || t('characters.untitled')}
              disabled={inFight.has(ch.id)}
              onPress={() => {
                updateEncounter((enc) => addCharacter(enc, ch));
                setAddingPc(false);
              }}
            />
          ))
        ) : (
          <Txt muted>{t('dm.noCharacters')}</Txt>
        )}
      </Sheet>
      <Sheet visible={addingOther} onClose={() => setAddingOther(false)} title={t('dm.addOther')}>
        <Field label={t('dm.otherName')} value={otherName} onChangeText={setOtherName} />
        <Button
          label={t('dm.add')}
          disabled={!otherName.trim()}
          onPress={() => {
            updateEncounter((enc) => addOther(enc, otherName.trim()));
            setOtherName('');
            setAddingOther(false);
          }}
        />
      </Sheet>
    </View>
  );
}
