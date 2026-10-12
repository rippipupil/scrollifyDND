import { useState } from 'react';
import { View } from 'react-native';
import { ENEMY_ACTION_KINDS, type Enemy, type EnemyAction, type EnemyActionKind } from '../../dm/types';
import { useT } from '../../i18n/useT';
import { abilityMod, SKILLS, uid } from '../../rules/core';
import { ABILITIES, type Ability, type SkillId } from '../../rules/types';
import { Button, Card, Chip, Field, NumberField, Row, Txt } from '../ui';
import { CONDITION_IDS, DAMAGE_TYPES, useDmLabels } from './StatBlock';

const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
const CR_PRESETS = [0, 0.125, 0.25, 0.5];

/** Text field with its own text state: every keystroke is saved, and what you type is never reformatted under you. */
function LazyField({ label, value, onCommit, multiline, placeholder }: { label?: string; value: string; onCommit: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  const [text, setText] = useState(value);
  return (
    <Field
      label={label}
      value={text}
      onChangeText={(v) => (setText(v), onCommit(v))}
      multiline={multiline}
      placeholder={placeholder}
      style={multiline ? { minHeight: 70, textAlignVertical: 'top' } : undefined}
    />
  );
}

/** Damage types as chips plus a free-text box for anything else ("from nonmagical attacks"…). */
function DamageList({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useT();
  const L = useDmLabels();
  const extra = value.filter((x) => !DAMAGE_TYPES.includes(x));
  return (
    <View style={{ gap: 4 }}>
      <Txt style={{ fontWeight: '700' }}>{label}</Txt>
      <Row wrap>
        {DAMAGE_TYPES.map((d) => (
          <Chip key={d} label={L.damage(d)} active={value.includes(d)} onPress={() => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d])} />
        ))}
      </Row>
      <LazyField
        placeholder={t('dm.otherText')}
        value={extra.join(', ')}
        onCommit={(v) => onChange([...value.filter((x) => DAMAGE_TYPES.includes(x)), ...v.split(',').map((s) => s.trim()).filter(Boolean)])}
      />
    </View>
  );
}

function ActionEditor({ a, onChange, onDelete }: { a: EnemyAction; onChange: (a: EnemyAction) => void; onDelete: () => void }) {
  const { t } = useT();
  const L = useDmLabels();
  return (
    <View style={{ gap: 6, paddingVertical: 6, borderTopWidth: 1, borderColor: '#8884' }}>
      <Row>
        <View style={{ flex: 1 }}>
          <LazyField label={t('dm.actionName')} value={a.name} onCommit={(name) => onChange({ ...a, name })} />
        </View>
        <Button small kind="ghost" label="✕" onPress={onDelete} />
      </Row>
      <LazyField label={t('dm.actionText')} value={a.text} multiline onCommit={(text) => onChange({ ...a, text })} />
      <Row>
        <View style={{ flex: 1 }}>
          <NumberField label={t('dm.attackBonus')} value={a.attackBonus} allowEmpty min={-20} max={40} onChange={(n) => onChange({ ...a, attackBonus: n })} />
        </View>
        <View style={{ flex: 1 }}>
          <LazyField label={t('dm.damage')} value={a.damage ?? ''} placeholder="2d6+3" onCommit={(v) => onChange({ ...a, damage: v.replace(/\s+/g, '') || undefined })} />
        </View>
      </Row>
      {a.damage ? (
        <Row wrap>
          {DAMAGE_TYPES.map((d) => (
            <Chip key={d} label={L.damage(d)} active={a.damageType === d} onPress={() => onChange({ ...a, damageType: a.damageType === d ? undefined : d })} />
          ))}
        </Row>
      ) : null}
      <Row wrap>
        <Txt muted>{t('dm.saveAbility')}:</Txt>
        {ABILITIES.map((ab) => (
          <Chip
            key={ab}
            label={t(`abilities.short.${ab}`)}
            active={a.save?.ability === ab}
            onPress={() => onChange({ ...a, save: a.save?.ability === ab ? undefined : { ability: ab, dc: a.save?.dc ?? 12 } })}
          />
        ))}
      </Row>
      {a.save ? <NumberField label={t('dm.saveDc')} value={a.save.dc} min={1} max={40} onChange={(n) => onChange({ ...a, save: { ...a.save!, dc: n ?? 10 } })} /> : null}
    </View>
  );
}

export function EnemyEditor({ enemy: e, onChange }: { enemy: Enemy; onChange: (e: Enemy) => void }) {
  const { t } = useT();
  const L = useDmLabels();
  const set = (patch: Partial<Enemy>) => onChange({ ...e, ...patch });
  const setAction = (a: EnemyAction) => set({ actions: e.actions.map((x) => (x.uid === a.uid ? a : x)) });
  const addAction = (kind: EnemyActionKind) => set({ actions: [...e.actions, { uid: uid('act'), kind, name: '', text: '' }] });
  const toggleSave = (a: Ability) => {
    const saves = { ...e.saves };
    if (saves[a] === undefined) saves[a] = abilityMod(e.abilities[a]) + 2;
    else delete saves[a];
    set({ saves });
  };
  const skillOf = (id: SkillId) => e.skills.find((s) => s.id === id);
  const toggleSkill = (id: SkillId) =>
    set({ skills: skillOf(id) ? e.skills.filter((s) => s.id !== id) : [...e.skills, { id, bonus: abilityMod(e.abilities[SKILLS[id]]) + 2 }] });

  return (
    <View style={{ gap: 10 }}>
      <Card>
        <LazyField label={t('dm.name')} value={e.name} onCommit={(name) => set({ name })} />
        <Txt muted>{t('dm.size')}</Txt>
        <Row wrap>
          {SIZES.map((s) => (
            <Chip key={s} label={L.size(s)} active={e.size === s} onPress={() => set({ size: s })} />
          ))}
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <LazyField label={t('dm.type')} value={e.type} onCommit={(type) => set({ type })} />
          </View>
          <View style={{ flex: 1 }}>
            <LazyField label={t('dm.alignment')} value={e.alignment} onCommit={(alignment) => set({ alignment })} />
          </View>
        </Row>
        <Txt muted>{t('dm.cr')}</Txt>
        <Row wrap>
          {CR_PRESETS.map((cr) => (
            <Chip key={cr} label={cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : '0'} active={e.cr === cr} onPress={() => set({ cr })} />
          ))}
          <View style={{ width: 90 }}>
            <NumberField value={e.cr >= 1 ? e.cr : undefined} allowEmpty min={1} max={30} placeholder="1–30" onChange={(n) => set({ cr: n ?? 0 })} />
          </View>
          <View style={{ width: 110 }}>
            <NumberField label={t('dm.xp')} value={e.xp} min={0} max={999999} onChange={(n) => set({ xp: n ?? 0 })} />
          </View>
        </Row>
      </Card>

      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <NumberField label={t('dm.ac')} value={e.ac} min={0} max={40} onChange={(n) => set({ ac: n ?? 10 })} />
          </View>
          <View style={{ flex: 2 }}>
            <LazyField label={t('dm.acNote')} value={e.acNote} onCommit={(acNote) => set({ acNote })} />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <NumberField label={t('dm.hpMax')} value={e.hpMax} min={1} max={9999} onChange={(n) => set({ hpMax: n ?? 1 })} />
          </View>
          <View style={{ flex: 2 }}>
            <LazyField label={t('dm.hpFormula')} value={e.hpFormula} onCommit={(hpFormula) => set({ hpFormula: hpFormula.replace(/\s+/g, '') })} />
          </View>
        </Row>
        <LazyField label={t('dm.speed')} value={e.speed} onCommit={(speed) => set({ speed })} />
      </Card>

      <Card title={t('dm.abilities')}>
        <Row wrap>
          {ABILITIES.map((a) => (
            <View key={a} style={{ width: 90 }}>
              <NumberField label={t(`abilities.short.${a}`)} value={e.abilities[a]} min={1} max={30} onChange={(n) => set({ abilities: { ...e.abilities, [a]: n ?? 10 } })} />
            </View>
          ))}
        </Row>
      </Card>

      <Card title={t('dm.saves')}>
        <Txt variant="small" muted>
          {t('dm.savesHint')}
        </Txt>
        <Row wrap>
          {ABILITIES.map((a) => (
            <Chip key={a} label={t(`abilities.short.${a}`)} active={e.saves[a] !== undefined} onPress={() => toggleSave(a)} />
          ))}
        </Row>
        <Row wrap>
          {ABILITIES.filter((a) => e.saves[a] !== undefined).map((a) => (
            <View key={a} style={{ width: 90 }}>
              <NumberField label={t(`abilities.short.${a}`)} value={e.saves[a]} min={-10} max={30} onChange={(n) => set({ saves: { ...e.saves, [a]: n ?? 0 } })} />
            </View>
          ))}
        </Row>
      </Card>

      <Card title={t('dm.skills')}>
        <Row wrap>
          {(Object.keys(SKILLS) as SkillId[]).map((id) => (
            <Chip key={id} label={t(`skills.${id}`)} active={!!skillOf(id)} onPress={() => toggleSkill(id)} />
          ))}
        </Row>
        <Row wrap>
          {e.skills.map((s) => (
            <View key={s.id} style={{ width: 130 }}>
              <NumberField label={t(`skills.${s.id}`)} value={s.bonus} min={-10} max={30} onChange={(n) => set({ skills: e.skills.map((x) => (x.id === s.id ? { ...x, bonus: n ?? 0 } : x)) })} />
            </View>
          ))}
        </Row>
      </Card>

      <Card>
        <DamageList label={t('dm.vulnerabilities')} value={e.vulnerabilities} onChange={(vulnerabilities) => set({ vulnerabilities })} />
        <DamageList label={t('dm.resistances')} value={e.resistances} onChange={(resistances) => set({ resistances })} />
        <DamageList label={t('dm.immunities')} value={e.immunities} onChange={(immunities) => set({ immunities })} />
        <Txt style={{ fontWeight: '700' }}>{t('dm.conditionImmunities')}</Txt>
        <Row wrap>
          {CONDITION_IDS.map((c) => (
            <Chip
              key={c}
              label={L.condition(c)}
              active={e.conditionImmunities.includes(c)}
              onPress={() => set({ conditionImmunities: e.conditionImmunities.includes(c) ? e.conditionImmunities.filter((x) => x !== c) : [...e.conditionImmunities, c] })}
            />
          ))}
        </Row>
      </Card>

      <Card>
        <LazyField label={t('dm.senses')} value={e.senses} placeholder="darkvision 60 ft." onCommit={(senses) => set({ senses })} />
        <NumberField label={t('dm.passivePerception')} value={e.passivePerception} min={0} max={40} onChange={(n) => set({ passivePerception: n ?? 10 })} />
        <LazyField label={t('dm.languages')} value={e.languages} onCommit={(languages) => set({ languages })} />
      </Card>

      {ENEMY_ACTION_KINDS.map((kind) => (
        <Card key={kind} title={t(`dm.${kind}`)} right={<Button small kind="secondary" label={`+ ${t('dm.addAction')}`} onPress={() => addAction(kind)} testID={`add-${kind}`} />}>
          {e.actions
            .filter((a) => a.kind === kind)
            .map((a) => (
              <ActionEditor key={a.uid} a={a} onChange={setAction} onDelete={() => set({ actions: e.actions.filter((x) => x.uid !== a.uid) })} />
            ))}
        </Card>
      ))}

      <Card title={t('dm.notes')}>
        <LazyField value={e.notes} multiline onCommit={(notes) => set({ notes })} />
      </Card>
    </View>
  );
}
