import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { Chip, Field, Row, Txt } from '../../components/ui';
import { EntryRow } from '../../components/wiki/EntryRow';
import { getEntry, keyOf, searchContent } from '../../content';
import type { Category } from '../../content/types';
import { useT } from '../../i18n/useT';
import { useHomebrew } from '../../store/homebrew';
import { useWikiUser } from '../../store/wiki';
import { useTheme } from '../../theme';
import type { SearchFilters } from '../../wiki/search';

const CATEGORIES: Category[] = ['spell', 'equipment', 'magic-item', 'class', 'subclass', 'species', 'background', 'feat', 'condition', 'rule', 'monster', 'feature', 'mastery', 'weapon-property'];
const CLASSES = ['artificer', 'bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
const SCHOOLS = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];

export default function WikiScreen() {
  const c = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const homebrew = useHomebrew((s) => s.entries);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | undefined>();
  const [spell, setSpell] = useState<Omit<SearchFilters, 'category'>>({});
  const [era, setEra] = useState<SearchFilters['era']>();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favorites = useWikiUser((s) => s.favorites);

  const filters: SearchFilters = useMemo(() => ({ ...(category === 'spell' ? { category, ...spell } : category ? { category } : {}), ...(era ? { era } : {}) }), [category, spell, era]);
  const results = useMemo(() => {
    if (!onlyFavorites) return searchContent(query, filters, lang, homebrew, 400);
    // Favourites keep the order they were starred in (newest first); the search box and filters still narrow them.
    const matching = new Set(searchContent(query, filters, lang, homebrew).map(keyOf));
    return favorites.map((k) => getEntry(k, homebrew)).filter((e): e is NonNullable<typeof e> => !!e && matching.has(keyOf(e)));
  }, [query, filters, lang, homebrew, onlyFavorites, favorites]);
  const toggle = <K extends keyof typeof spell>(k: K, v: (typeof spell)[K]) => setSpell((s) => ({ ...s, [k]: s[k] === v ? undefined : v }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 10, gap: 8, backgroundColor: c.bg }}>
        <Field placeholder={t('wiki.searchPlaceholder')} value={query} onChangeText={setQuery} autoCorrect={false} clearButtonMode="while-editing" testID="wiki-search" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label={t('wiki.favorites')} active={onlyFavorites} onPress={() => setOnlyFavorites(!onlyFavorites)} testID="wiki-favorites" />
          <Chip label={t('wiki.all')} active={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={t(`categories.${cat}`)} active={category === cat} onPress={() => setCategory(category === cat ? undefined : cat)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label={t('wiki.eraAll')} active={!era} onPress={() => setEra(undefined)} />
          <Chip label={t('wiki.era2024')} active={era === '2024'} onPress={() => setEra(era === '2024' ? undefined : '2024')} />
          <Chip label={t('wiki.era2014')} active={era === '2014'} onPress={() => setEra(era === '2014' ? undefined : '2014')} />
        </ScrollView>
        {category === 'spell' ? (
          <View style={{ gap: 6 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <Chip key={n} label={n === 0 ? t('wiki.cantrip') : `${t('wiki.level')} ${n}`} active={spell.spellLevel === n} onPress={() => toggle('spellLevel', n)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {CLASSES.map((k) => (
                <Chip key={k} label={t(`classNames.${k}`)} active={spell.spellClass === k} onPress={() => toggle('spellClass', k)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {SCHOOLS.map((k) => (
                <Chip key={k} label={t(`schools.${k}`)} active={spell.school === k} onPress={() => toggle('school', k)} />
              ))}
              <Chip label={t('wiki.concentration')} active={spell.concentration === true} onPress={() => toggle('concentration', true)} />
              <Chip label={t('wiki.ritual')} active={spell.ritual === true} onPress={() => toggle('ritual', true)} />
            </ScrollView>
          </View>
        ) : null}
        <Row>
          <Txt variant="small" muted>
            {onlyFavorites && !favorites.length ? t('wiki.noFavorites') : t('wiki.results', { n: results.length })}
          </Txt>
        </Row>
      </View>
      <FlatList
        data={results}
        keyExtractor={(e) => `${e.source}:${keyOf(e)}`}
        renderItem={({ item }) => <EntryRow entry={item} onPress={() => router.push({ pathname: '/wiki/[key]', params: { key: keyOf(item) } })} />}
        initialNumToRender={20}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}
