import { keyOf } from '../../content';
import { SpellIcon } from '../SpellIcon';
import { Pressable, View } from 'react-native';
import type { ContentEntry } from '../../content/types';
import { isFallback } from '../../i18n';
import { entryEra } from '../../wiki/search';
import { useT } from '../../i18n/useT';
import { useTheme } from '../../theme';
import { Badge, Txt } from '../ui';

export function entrySubtitle(e: ContentEntry, t: (k: string, v?: any) => string): string {
  const d = e.data ?? {};
  switch (e.category) {
    case 'spell':
      return d.level === 0 ? `${t('wiki.cantrip')} · ${t(`schools.${d.school}`)}` : `${t('wiki.level')} ${d.level} · ${t(`schools.${d.school}`)}`;
    case 'monster':
      return `${t('wiki.cr')} ${d.challenge_rating ?? '—'} · ${d.type ?? ''}`;
    case 'magic-item':
      return d.rarity ? t(`rarity.${d.rarity}`) : '';
    case 'equipment':
      return [d.cost, d.weight ? `${d.weight} lb` : ''].filter(Boolean).join(' · ');
    case 'subclass':
      return d.classId ? `${t('categories.subclass')} · ${t(`classNames.${d.classId}`)}` : t('categories.subclass');
    case 'feat':
      return d.type ? `${t('categories.feat')} · ${t(`featTypes.${d.type}`)}` : t('categories.feat');
    default:
      return t(`categories.${e.category}`);
  }
}

export function EntryRow({ entry, onPress }: { entry: ContentEntry; onPress: () => void }) {
  const c = useTheme();
  const { t, loc, lang } = useT();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: pressed ? c.surfaceAlt : c.surface, borderBottomWidth: 1, borderColor: c.border })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {entry.category === 'spell' ? <SpellIcon refKey={keyOf(entry)} school={entry.data?.school} size={28} /> : null}
        <Txt style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
          {loc(entry.name)}
        </Txt>
        {entryEra(entry) === '2014' ? <Badge label="2014" color={c.warning} /> : null}
        {entry.source === 'external' ? <Badge label={entry.book ?? 'PHB'} /> : null}
        {entry.source === 'homebrew' ? <Badge label={t('wiki.homebrew')} color={c.accent} /> : null}
        {isFallback(entry.text, lang) ? <Badge label="EN" /> : null}
      </View>
      <Txt variant="small" muted numberOfLines={1} style={entry.category === 'spell' ? { marginLeft: 34 } : undefined}>
        {entrySubtitle(entry, t)}
      </Txt>
    </Pressable>
  );
}
