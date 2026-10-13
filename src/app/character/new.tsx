import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { notify } from '../../components/ImportSheet';
import { Markdown } from '../../components/Markdown';
import { Button, Card, Chip, Field, NumberField, Row, Screen, Stepper, Txt } from '../../components/ui';
import { entriesOf, getEntry, keyOf } from '../../content';
import type { ContentEntry } from '../../content/types';
import { useT } from '../../i18n/useT';
import { abilityMod, formatMod, SKILL_IDS } from '../../rules/core';
import { ABILITIES, type Ability, type SkillId } from '../../rules/types';
import { applyBackgroundAsi, buildCharacterFromWizard, classSkillChoice, emptyDraft, pointBuyCost, POINT_BUY_BUDGET, STANDARD_ARRAY, type WizardDraft } from '../../sheet/wizard';
import { useCharacters } from '../../store/characters';
import { useHomebrew } from '../../store/homebrew';

const STEPS = ['stepClass', 'stepSpecies', 'stepBackground', 'stepAbilities', 'stepSkills', 'stepEquipment', 'stepDetails'] as const;
const ALIGNMENTS = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];

export default function NewCharacterScreen() {
  const router = useRouter();
  const { t, loc, lang } = useT();
  const homebrew = useHomebrew((s) => s.entries);
  const add = useCharacters((s) => s.add);
  const [step, setStep] = useState(0);
  const [showLegacy, setShowLegacy] = useState(false);
  const [d, setD] = useState<WizardDraft>({ ...emptyDraft(), classes: [{ key: 'class:wizard', level: 1 }] });
  const set = (patch: Partial<WizardDraft>) => setD((x) => ({ ...x, ...patch }));

  // 2014 options stay out of the way unless asked for (or already picked).
  const visible = (list: ContentEntry[], picked: (string | undefined)[]) => list.filter((e) => showLegacy || e.data?.era !== '2014' || picked.includes(keyOf(e)));
  const classes = useMemo(() => entriesOf('class', homebrew), [homebrew]);
  // Subclass lists are short, so 2014 subclasses (Chronurgy, Hexblade…) are always offered, tagged ·2014.
  const subclasses = useMemo(() => entriesOf('subclass', homebrew), [homebrew]);
  const species = useMemo(() => visible(entriesOf('species', homebrew), [d.speciesKey]), [homebrew, showLegacy, d.speciesKey]);
  const backgrounds = useMemo(() => visible(entriesOf('background', homebrew), [d.backgroundKey]), [homebrew, showLegacy, d.backgroundKey]);
  const tag = (e: ContentEntry) => (e.source === 'homebrew' ? ' ·HB' : e.source !== 'external' ? '' : e.data?.era === '2014' ? ' ·2014' : e.book === 'PHB 2024' ? ' ·PHB' : ' ·2024');
  const legacyToggle = <Chip label={t('wizard.showLegacy')} active={showLegacy} onPress={() => setShowLegacy(!showLegacy)} />;

  const firstClass = getEntry(d.classes[0]?.key, homebrew);
  const speciesEntry = getEntry(d.speciesKey, homebrew);
  const bgEntry = getEntry(d.backgroundKey, homebrew);
  const bgAbilities: Ability[] = bgEntry?.data?.abilities?.length ? bgEntry.data.abilities : ABILITIES;
  const finalScores = applyBackgroundAsi(d.baseScores, bgAbilities, d.asi);
  const skillChoice = classSkillChoice(firstClass);
  const classSkillOptions: SkillId[] = skillChoice?.options ?? [];
  const bgSkills: SkillId[] = bgEntry?.data?.skills ?? [];

  const pickAll = (cat: ContentEntry[], current: string | undefined, onPick: (key: string | undefined) => void) => (
    <Row wrap>
      {cat.map((e) => (
        <Chip key={keyOf(e)} label={`${loc(e.name)}${tag(e)}`} active={current === keyOf(e)} onPress={() => onPick(current === keyOf(e) ? undefined : keyOf(e))} />
      ))}
    </Row>
  );

  const create = () => {
    if (!d.name.trim()) return notify(t('wizard.nameRequired'));
    const c = buildCharacterFromWizard(d, lang, homebrew);
    add(c);
    router.replace({ pathname: '/character/[id]', params: { id: c.id } });
  };

  const stepView = () => {
    switch (STEPS[step]) {
      case 'stepClass':
        return (
          <>
            <Txt muted>{t('wizard.chooseClass')}</Txt>
            {d.classes.map((k, idx) => {
              const ce = getEntry(k.key, homebrew);
              const subs = subclasses.filter((s) => s.data?.classId === ce?.id.replace(/^ext-class-/, ''));
              return (
                <Card key={idx} title={`${t('sheet.classes')} ${idx + 1}`} right={idx > 0 ? <Button small kind="ghost" label="✕" onPress={() => set({ classes: d.classes.filter((_, i) => i !== idx) })} /> : undefined}>
                  <Row wrap>
                    {classes.map((e) => (
                      <Chip key={keyOf(e)} label={`${loc(e.name)}${tag(e)}`} active={k.key === keyOf(e)} onPress={() =>
                          set({
                            classes: d.classes.map((x, i) => (i === idx ? { key: keyOf(e), level: x.level } : x)),
                            // A different first class means different skill and equipment options.
                            ...(idx === 0 && k.key !== keyOf(e) ? { skills: [], classEquipment: undefined } : {}),
                          })
                        } />
                    ))}
                  </Row>
                  <Row>
                    <Txt style={{ flex: 1 }}>{t('sheet.classLevel')}</Txt>
                    <Stepper value={k.level} min={1} max={20} onChange={(n) => set({ classes: d.classes.map((x, i) => (i === idx ? { ...x, level: n } : x)) })} />
                  </Row>
                  {subs.length ? (
                    <>
                      <Txt variant="small" muted>
                        {t('sheet.subclass')}
                      </Txt>
                      <Row wrap>
                        {subs.map((s) => (
                          <Chip key={keyOf(s)} label={`${loc(s.name)}${tag(s)}`} active={k.subclassKey === keyOf(s)} onPress={() => set({ classes: d.classes.map((x, i) => (i === idx ? { ...x, subclassKey: x.subclassKey === keyOf(s) ? undefined : keyOf(s) } : x)) })} />
                        ))}
                      </Row>
                    </>
                  ) : null}
                </Card>
              );
            })}
            {legacyToggle}
            <Button kind="secondary" label={t('sheet.addClass')} onPress={() => set({ classes: [...d.classes, { key: 'class:fighter', level: 1 }] })} />
          </>
        );
      case 'stepSpecies':
        return (
          <>
            <Txt muted>{t('wizard.chooseSpecies')}</Txt>
            {legacyToggle}
            {pickAll(species, d.speciesKey, (key) => set({ speciesKey: key, subspeciesId: undefined }))}
            {speciesEntry?.data?.subspecies?.length ? (
              <Card title={t('wizard.chooseSubspecies')}>
                <Row wrap>
                  {speciesEntry.data.subspecies.map((s: any) => (
                    <Chip key={s.id} label={loc(s.name)} active={d.subspeciesId === s.id} onPress={() => set({ subspeciesId: s.id })} />
                  ))}
                </Row>
              </Card>
            ) : null}
            {String(speciesEntry?.data?.size ?? '').includes(' or ') ? (
              <Row wrap>
                {['Small', 'Medium'].map((s) => (
                  <Chip key={s} label={t(`sizes.${s}`)} active={(d.size ?? 'Medium') === s} onPress={() => set({ size: s })} />
                ))}
              </Row>
            ) : null}
            {speciesEntry?.source === 'external' ? <Txt muted>{t('wizard.speciesExternal')}</Txt> : null}
            {speciesEntry?.data?.era === '2014' ? <Txt muted>{t('wizard.legacyPicked')}</Txt> : null}
            {!d.speciesKey ? <Field label={t('wizard.customSpecies')} value={d.customSpeciesName ?? ''} onChangeText={(v) => set({ customSpeciesName: v })} /> : null}
            {speciesEntry?.text ? (
              <Card>
                <Markdown text={loc(speciesEntry.text)} />
              </Card>
            ) : null}
          </>
        );
      case 'stepBackground':
        return (
          <>
            <Txt muted>{t('wizard.chooseBackground')}</Txt>
            {legacyToggle}
            {pickAll(backgrounds, d.backgroundKey, (key) => set({ backgroundKey: key, asi: { mode: '21' } }))}
            {!d.backgroundKey ? <Field label={t('wizard.customBackground')} value={d.customBackgroundName ?? ''} onChangeText={(v) => set({ customBackgroundName: v })} /> : null}
            <Card title={t('wizard.asiTitle')}>
              <Row wrap>
                <Chip label={t('wizard.asi21')} active={d.asi.mode === '21'} onPress={() => set({ asi: { mode: '21' } })} />
                {bgEntry?.data?.abilities?.length ? <Chip label={t('wizard.asi111')} active={d.asi.mode === '111'} onPress={() => set({ asi: { mode: '111' } })} /> : null}
              </Row>
              {d.asi.mode === '21' ? (
                <>
                  <Txt variant="small" muted>
                    +2
                  </Txt>
                  <Row wrap>
                    {bgAbilities.map((a) => (
                      <Chip key={a} label={t(`abilities.short.${a}`)} active={d.asi.plus2 === a} onPress={() => set({ asi: { ...d.asi, plus2: a } })} />
                    ))}
                  </Row>
                  <Txt variant="small" muted>
                    +1
                  </Txt>
                  <Row wrap>
                    {bgAbilities.map((a) => (
                      <Chip key={a} label={t(`abilities.short.${a}`)} active={d.asi.plus1 === a} onPress={() => set({ asi: { ...d.asi, plus1: a } })} />
                    ))}
                  </Row>
                </>
              ) : null}
            </Card>
            {bgEntry?.text ? (
              <Card>
                <Markdown text={loc(bgEntry.text)} />
              </Card>
            ) : null}
          </>
        );
      case 'stepAbilities': {
        const used = (a: Ability) => ABILITIES.filter((x) => x !== a).map((x) => d.baseScores[x]);
        return (
          <>
            <Row wrap>
              <Chip label={t('wizard.standardArray')} active={d.scoreMethod === 'standard'} onPress={() => set({ scoreMethod: 'standard', baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 } })} />
              <Chip label={t('wizard.pointBuy')} active={d.scoreMethod === 'pointbuy'} onPress={() => set({ scoreMethod: 'pointbuy', baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } })} />
              <Chip label={t('wizard.manual')} active={d.scoreMethod === 'manual'} onPress={() => set({ scoreMethod: 'manual' })} />
            </Row>
            {d.scoreMethod === 'standard' ? <Txt muted>{t('wizard.assign')}</Txt> : null}
            {d.scoreMethod === 'pointbuy' ? <Txt style={{ fontWeight: '700' }}>{t('wizard.pointsLeft', { n: POINT_BUY_BUDGET - pointBuyCost(d.baseScores) })}</Txt> : null}
            {ABILITIES.map((a) => (
              <Card key={a}>
                <Row>
                  <Txt style={{ flex: 1, fontWeight: '700' }}>{t(`abilities.${a}`)}</Txt>
                  <Txt muted>
                    {finalScores[a]} ({formatMod(abilityMod(finalScores[a]))})
                  </Txt>
                </Row>
                {d.scoreMethod === 'standard' ? (
                  <Row wrap>
                    {STANDARD_ARRAY.map((v) => {
                      const taken = used(a).includes(v);
                      return (
                        <Chip
                          key={v}
                          label={String(v)}
                          active={d.baseScores[a] === v}
                          onPress={() => {
                            const other = ABILITIES.find((x) => x !== a && d.baseScores[x] === v);
                            const next = { ...d.baseScores, [a]: v };
                            if (other && taken) next[other] = d.baseScores[a];
                            set({ baseScores: next });
                          }}
                        />
                      );
                    })}
                  </Row>
                ) : d.scoreMethod === 'pointbuy' ? (
                  <Stepper
                    value={d.baseScores[a]}
                    min={8}
                    max={15}
                    onChange={(n) => {
                      const next = { ...d.baseScores, [a]: n };
                      if (pointBuyCost(next) <= POINT_BUY_BUDGET) set({ baseScores: next });
                    }}
                  />
                ) : (
                  <NumberField value={d.baseScores[a]} min={1} max={30} onChange={(n) => set({ baseScores: { ...d.baseScores, [a]: n ?? 10 } })} />
                )}
              </Card>
            ))}
          </>
        );
      }
      case 'stepSkills':
        return (
          <>
            <Txt muted>{t('wizard.chooseSkills', { n: skillChoice?.choose ?? 0 })}</Txt>
            <Row wrap>
              {(classSkillOptions.length ? classSkillOptions : SKILL_IDS).map((s) => (
                <Chip
                  key={s}
                  label={t(`skills.${s}`)}
                  active={d.skills.includes(s)}
                  onPress={() => {
                    if (d.skills.includes(s)) set({ skills: d.skills.filter((x) => x !== s) });
                    else if (!skillChoice || d.skills.length < skillChoice.choose) set({ skills: [...d.skills, s] });
                  }}
                />
              ))}
            </Row>
            {bgSkills.length ? (
              <Card title={t('wizard.fromBackground')}>
                <Txt>{bgSkills.map((s) => t(`skills.${s}`)).join(', ')}</Txt>
              </Card>
            ) : null}
          </>
        );
      case 'stepEquipment': {
        const opts = (list: any[] | undefined, current: number | undefined, onPick: (i: number) => void) =>
          (list ?? []).map((o: any, i: number) => (
            <Chip
              key={i}
              label={`${String.fromCharCode(65 + i)}: ${o.items.length ? o.items.map((it: any) => `${it.qty > 1 ? `${it.qty}× ` : ''}${loc(getEntry(`equipment:${it.id}`)?.name) || it.name}`).join(', ') + ', ' : ''}${o.gold} po`}
              active={current === i}
              onPress={() => onPick(i)}
            />
          ));
        return (
          <>
            {firstClass ? (
              <Card title={loc(firstClass.name)}>
                <View style={{ gap: 6 }}>{opts(firstClass.data?.equipmentOptions, d.classEquipment, (i) => set({ classEquipment: i }))}</View>
              </Card>
            ) : null}
            {bgEntry?.data?.equipmentOptions ? (
              <Card title={loc(bgEntry.name)}>
                <View style={{ gap: 6 }}>{opts(bgEntry.data.equipmentOptions, d.backgroundEquipment, (i) => set({ backgroundEquipment: i }))}</View>
              </Card>
            ) : null}
          </>
        );
      }
      case 'stepDetails':
        return (
          <>
            <Field label={t('common.name')} value={d.name} onChangeText={(v) => set({ name: v })} testID="wizard-name" />
            <Field label={t('sheet.player')} value={d.player} onChangeText={(v) => set({ player: v })} />
            <Txt variant="small" muted>
              {t('sheet.alignment')}
            </Txt>
            <Row wrap>
              {ALIGNMENTS.map((a) => (
                <Chip key={a} label={t(`alignments.${a}`)} active={d.alignment === a} onPress={() => set({ alignment: a })} />
              ))}
            </Row>
            <Button label={t('wizard.create')} onPress={create} testID="wizard-create" />
          </>
        );
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('wizard.title') }} />
      <Row wrap>
        {STEPS.map((s, i) => (
          <Chip key={s} label={`${i + 1}. ${t(`wizard.${s}`)}`} active={i === step} onPress={() => setStep(i)} />
        ))}
      </Row>
      {stepView()}
      <Row>
        <Button style={{ flex: 1 }} kind="secondary" label={t('common.back')} disabled={step === 0} onPress={() => setStep((s) => s - 1)} />
        {step < STEPS.length - 1 ? <Button style={{ flex: 1 }} label={t('common.next')} onPress={() => setStep((s) => s + 1)} testID="wizard-next" /> : null}
      </Row>
    </Screen>
  );
}
