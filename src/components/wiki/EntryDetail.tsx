import { SpellIcon } from '../SpellIcon';
import { useRouter } from 'expo-router';
import { Linking, Platform, View } from 'react-native';
import { abilityMod, formatMod } from '../../rules/core';
import { getEntry, keyOf } from '../../content';
import type { ContentEntry } from '../../content/types';
import { isFallback } from '../../i18n';
import { spellFacts } from '../../wiki/spellFacts';
import { useT } from '../../i18n/useT';
import { useHomebrew } from '../../store/homebrew';
import { useTheme } from '../../theme';
import { Markdown } from '../Markdown';
import { Badge, Button, Card, Chip, Row, Txt } from '../ui';

function Meta({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null;
  return (
    <Row>
      <Txt variant="small" muted style={{ width: 130 }}>
        {label}
      </Txt>
      <Txt style={{ flex: 1 }}>{String(value)}</Txt>
    </Row>
  );
}

function SpellMeta({ e }: { e: ContentEntry }) {
  const { t, loc } = useT();
  const d = e.data;
  const comps = (d.components ?? []).join(', ') + (d.material ? ` (${loc(d.material)})` : '');
  return (
    <Card>
      <Txt muted style={{ fontStyle: 'italic' }}>
        {d.level === 0 ? `${t('wiki.cantrip')} · ${t(`schools.${d.school}`)}` : `${t('wiki.level')} ${d.level} · ${t(`schools.${d.school}`)}`}
        {d.classes?.length ? ` (${d.classes.map((k: string) => t(`classNames.${k}`)).join(', ')})` : ''}
      </Txt>
      <Meta label={t('wiki.castingTime')} value={loc(d.castingTime) + (d.ritual ? ` · ${t('wiki.ritual')}` : '')} />
      <Meta label={t('wiki.range')} value={loc(d.range)} />
      <Meta label={t('wiki.components')} value={comps} />
      <Meta label={t('wiki.duration')} value={loc(d.duration)} />
    </Card>
  );
}

function ExternalSpellMeta({ e }: { e: ContentEntry }) {
  const { t, lang } = useT();
  const d = e.data ?? {};
  const f = spellFacts(d, lang);
  return (
    <Card>
      <Txt muted style={{ fontStyle: 'italic' }}>
        {d.level === 0 ? `${t('wiki.cantrip')} · ${t(`schools.${d.school}`)}` : `${t('wiki.level')} ${d.level} · ${t(`schools.${d.school}`)}`}
        {d.classes?.length ? ` (${d.classes.map((k: string) => t(`classNames.${k}`)).join(', ')})` : ''}
      </Txt>
      <Meta label={t('wiki.castingTime')} value={f.castingTime + (d.ritual ? ` · ${t('wiki.ritual')}` : '')} />
      <Meta label={t('wiki.range')} value={f.range} />
      <Meta label={t('wiki.components')} value={f.components} />
      <Meta label={t('wiki.duration')} value={f.duration} />
      <Meta label={t('wiki.source')} value={`${e.book ?? ''}${d.page ? `, ${t('wiki.page', { n: d.page })}` : ''}`} />
    </Card>
  );
}

/** Facts of an indexed (non-SRD) entry that isn't a spell: edition, book and page, plus what the index knows. */
function ExternalMeta({ e }: { e: ContentEntry }) {
  const { t } = useT();
  const d = e.data ?? {};
  const ft = (n: number) => t('sheet.speedValue', { ft: n, m: String(Math.round(n * 3) / 10).replace('.', ',') });
  return (
    <Card>
      <Meta label={t('wiki.edition')} value={d.era === '2014' ? t('wiki.era2014') : t('wiki.era2024')} />
      <Meta label={t('wiki.source')} value={`${e.book ?? ''}${d.page ? `, ${t('wiki.page', { n: d.page })}` : ''}`} />
      {e.category === 'subclass' && d.classId ? <Meta label={t('wiki.class')} value={t(`classNames.${d.classId}`)} /> : null}
      {e.category === 'feat' && d.type ? <Meta label={t('wiki.type')} value={t(`featTypes.${d.type}`)} /> : null}
      {e.category === 'feat' && d.racial ? <Meta label={t('wiki.type')} value={t('wiki.racialFeat')} /> : null}
      {e.category === 'species' ? (
        <>
          <Meta label={t('sheet.size')} value={d.size ? String(d.size).split(' or ').map((s: string) => t(`sizes.${s}`)).join(` ${t('wiki.or')} `) : undefined} />
          <Meta label={t('wiki.speed')} value={d.speed ? ft(d.speed) : undefined} />
          <Meta label={t('wiki.darkvision')} value={d.darkvision ? ft(d.darkvision) : undefined} />
        </>
      ) : null}
      {e.category === 'class' ? (
        <>
          <Meta label={t('wiki.hitDie')} value={d.hitDie ? `d${d.hitDie}` : undefined} />
          <Meta label={t('wiki.saves')} value={(d.saves ?? []).map((a: string) => t(`abilities.${a}`)).join(', ')} />
          <Meta label={t('sheet.spellAbility')} value={d.spellAbility ? t(`abilities.${d.spellAbility}`) : undefined} />
          <Meta label={t('sheet.casterType')} value={d.casterType ? t(`casterTypes.${d.casterType}`) : undefined} />
        </>
      ) : null}
    </Card>
  );
}

function EquipmentMeta({ e }: { e: ContentEntry }) {
  const { t, loc } = useT();
  const d = e.data;
  const loc2 = (l: any) => (l ? loc(l) : '');
  const props = (d.weapon?.properties ?? []).map((p: string) => loc2(getEntry(`weapon-property:${p}`)?.name) || p).join(', ');
  return (
    <Card>
      <Meta label={t('wiki.cost')} value={d.cost} />
      <Meta label={t('wiki.weight')} value={d.weight ? `${d.weight} lb` : undefined} />
      {d.weapon ? (
        <>
          <Meta label={t('wiki.damage')} value={`${d.weapon.damage} ${t(`damageTypes.${d.weapon.damageType}`)}${d.weapon.versatileDamage ? ` (${t('sheet.versatile')}: ${d.weapon.versatileDamage})` : ''}`} />
          <Meta label={t('wiki.properties')} value={props} />
          <Meta label={t('wiki.range')} value={d.weapon.range ?? d.weapon.throwRange} />
          <Meta label={t('wiki.mastery')} value={d.weapon.mastery ? loc2(getEntry(`mastery:${d.weapon.mastery}`)?.name) : undefined} />
        </>
      ) : null}
      {d.armor ? (
        <>
          <Meta label={t('wiki.armorClass')} value={d.armor.type === 'shield' ? `+${d.armor.base}` : d.armor.type === 'light' ? `${d.armor.base} + DES` : d.armor.type === 'medium' ? `${d.armor.base} + DES (máx. 2)` : String(d.armor.base)} />
          <Meta label={t('wiki.strength')} value={d.armor.strMin} />
          <Meta label={t('wiki.stealth')} value={d.armor.stealthDisadvantage ? t('wiki.stealthDis') : undefined} />
        </>
      ) : null}
    </Card>
  );
}

function ClassTable({ e }: { e: ContentEntry }) {
  const { t, loc } = useT();
  const c = useTheme();
  const router = useRouter();
  const levels: any[] = e.data.levels ?? [];
  const caster = e.data.casterType !== 'none';
  return (
    <Card title={t('wiki.classLevels')}>
      {levels.map((l) => (
        <View key={l.level} style={{ borderTopWidth: 1, borderColor: c.border, paddingVertical: 6, gap: 4 }}>
          <Row>
            <Txt style={{ fontWeight: '700', width: 64 }}>
              {t('common.level')} {l.level}
            </Txt>
            <Txt variant="small" muted>
              {t('wiki.prof')} +{l.prof}
              {caster && l.slots ? ` · ${t('wiki.slots')}: ${l.slots.filter((n: number) => n > 0).join('/') || '—'}` : ''}
            </Txt>
          </Row>
          <Row wrap>
            {l.features.map((f: string) => {
              const fe = getEntry(`feature:${f}`);
              return <Chip key={f} label={fe ? loc(fe.name) : f} onPress={fe ? () => router.push({ pathname: '/wiki/[key]', params: { key: keyOf(fe) } }) : undefined} />;
            })}
          </Row>
        </View>
      ))}
    </Card>
  );
}

function list(v: any): string {
  if (!v) return '';
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x.name ?? x.index ?? JSON.stringify(x))).join(', ');
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k} ${x}`).join(', ');
  return String(v);
}

function MonsterBlock({ e }: { e: ContentEntry }) {
  const { t } = useT();
  const c = useTheme();
  const d = e.data;
  const abil = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const short = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const section = (title: string, items?: any[]) =>
    items?.length ? (
      <Card title={title}>
        {items.map((a, i) => (
          <Markdown key={i} text={`**${a.name}${a.usage ? ` (${a.usage.type === 'per day' ? `${a.usage.times}/día` : a.usage.type}${a.usage.dice ? ` ${a.usage.dice}` : ''})` : ''}.** ${a.desc ?? ''}`} />
        ))}
      </Card>
    ) : null;
  return (
    <>
      <Card>
        <Txt muted style={{ fontStyle: 'italic' }}>
          {[t(`sizes.${d.size}`), d.type, d.alignment].filter(Boolean).join(', ')}
        </Txt>
        <Meta label={t('wiki.ac')} value={list(d.armor_class?.map((a: any) => a.value))} />
        <Meta label={t('wiki.hp')} value={`${d.hit_points}${d.hit_dice ? ` (${d.hit_dice})` : ''}`} />
        <Meta label={t('wiki.speed')} value={list(d.speed)} />
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          {abil.map((a, i) => (
            <View key={a} style={{ alignItems: 'center', flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 6, padding: 4, marginHorizontal: 2 }}>
              <Txt variant="small" muted>
                {t(`abilities.short.${short[i]}`)}
              </Txt>
              <Txt style={{ fontWeight: '700' }}>{d[a]}</Txt>
              <Txt variant="small">{formatMod(abilityMod(d[a] ?? 10))}</Txt>
            </View>
          ))}
        </Row>
        <Meta label={t('wiki.skills')} value={list(d.proficiencies?.map((p: any) => `${p.proficiency?.name?.replace(/^(Skill|Saving Throw): /, '')} +${p.value}`))} />
        <Meta label={t('wiki.vulnerabilities')} value={list(d.damage_vulnerabilities)} />
        <Meta label={t('wiki.resistances')} value={list(d.damage_resistances)} />
        <Meta label={t('wiki.immunities')} value={list(d.damage_immunities)} />
        <Meta label={t('wiki.conditionImmunities')} value={list(d.condition_immunities)} />
        <Meta label={t('wiki.senses')} value={list(d.senses)} />
        <Meta label={t('wiki.languages')} value={d.languages} />
        <Meta label={t('wiki.cr')} value={`${d.challenge_rating}${d.xp !== undefined ? ` (${d.xp} XP)` : ''}`} />
      </Card>
      {section(t('wiki.traits'), d.special_abilities)}
      {section(t('wiki.actions'), d.actions)}
      {section(t('wiki.bonusActions'), d.bonus_actions)}
      {section(t('wiki.reactions'), d.reactions)}
      {section(t('wiki.legendary'), d.legendary_actions)}
    </>
  );
}

const SITES: { key: 'aideddEs' | 'aidedd' | 'wikidot' | 'nivel20'; label: string }[] = [
  { key: 'aideddEs', label: 'AideDD (ES)' },
  { key: 'aidedd', label: 'AideDD' },
  { key: 'wikidot', label: 'Wikidot' },
  { key: 'nivel20', label: 'Nivel20' },
];

export function openExternal(router: ReturnType<typeof useRouter>, url: string) {
  if (Platform.OS === 'web') Linking.openURL(url);
  else router.push({ pathname: '/browser', params: { url } });
}

function searchLinks(e: ContentEntry) {
  const en = e.name.en;
  const es = e.name.es ?? en;
  const q = (site: string, s: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${s}`)}`;
  return {
    aideddEs: e.category === 'spell' ? q('aidedd.org/spell/es', es) : undefined,
    aidedd: q('aidedd.org', en),
    wikidot: q('dnd2024.wikidot.com', en),
    nivel20: q('nivel20.com', es),
  };
}

export function EntryDetail({ entry, onAdd }: { entry: ContentEntry; onAdd?: () => void }) {
  const { t, loc, lang } = useT();
  const router = useRouter();
  const links = entry.external ?? searchLinks(entry);
  const d = entry.data ?? {};
  return (
    <View style={{ gap: 12 }}>
      <Row wrap>
        {entry.category === 'spell' ? <SpellIcon refKey={keyOf(entry)} school={entry.data?.school} size={44} /> : null}
        <Badge label={t(`categories.${entry.category}`)} />
        {entry.source === 'external' ? <Badge label={`${t('wiki.external')} · ${entry.book ?? ''}`} /> : null}
        {entry.source === 'homebrew' ? <Badge label={t('wiki.homebrew')} /> : null}
        {isFallback(entry.text, lang) ? <Badge label={`EN · ${t('common.englishOnly')}`} /> : null}
      </Row>
      {entry.category === 'spell' && entry.source !== 'external' ? <SpellMeta e={entry} /> : null}
      {entry.category === 'spell' && entry.source === 'external' ? <ExternalSpellMeta e={entry} /> : null}
      {entry.category !== 'spell' && entry.source === 'external' ? <ExternalMeta e={entry} /> : null}
      {entry.category === 'equipment' ? <EquipmentMeta e={entry} /> : null}
      {entry.category === 'magic-item' ? (
        <Card>
          <Meta label={t('wiki.rarity')} value={d.rarity ? t(`rarity.${d.rarity}`) : undefined} />
          <Meta label={t('wiki.attunement')} value={d.attunement ? t('common.yes') : undefined} />
        </Card>
      ) : null}
      {entry.category === 'monster' ? <MonsterBlock e={entry} /> : null}
      {entry.text ? (
        <Card>
          <Markdown text={loc(entry.text)} />
        </Card>
      ) : null}
      {entry.category === 'spell' && d.higherLevel ? (
        <Card title={t('wiki.higherLevel')}>
          <Markdown text={loc(d.higherLevel)} />
        </Card>
      ) : null}
      {entry.category === 'class' ? <ClassTable e={entry} /> : null}
      {entry.source === 'external' && d.era === '2014' ? <Txt muted>{t('wiki.legacyNote')}</Txt> : null}
      {entry.source === 'external' ? <Txt muted>{t('wiki.externalNote')}</Txt> : null}
      <Row wrap>
        {SITES.filter((s) => links[s.key]).map((s) => (
          <Button
            key={s.key}
            small
            kind="secondary"
            label={t(links[s.key]!.includes('google.com/search') ? 'wiki.searchIn' : 'wiki.openIn', { site: s.label })}
            onPress={() => openExternal(router, links[s.key]!)}
          />
        ))}
      </Row>
      {onAdd ? <Button label={t('wiki.addToCharacter')} onPress={onAdd} /> : null}
    </View>
  );
}

export function useEntry(key: string | undefined) {
  const homebrew = useHomebrew((s) => s.entries);
  return getEntry(key, homebrew);
}
