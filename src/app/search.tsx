import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { Card, Field, Screen, Txt } from '../components/ui';
import { EntryRow } from '../components/wiki/EntryRow';
import { getEntry, searchContent } from '../content';
import { useT } from '../i18n/useT';
import { globalSearch, HIT_KINDS, type Hit } from '../search/global';
import { useCharacters } from '../store/characters';
import { useDm } from '../store/dm';
import { useHomebrew } from '../store/homebrew';
import { useJournal } from '../store/journal';
import { useWikiUser } from '../store/wiki';
import { useTheme } from '../theme';

function open(h: Hit) {
  if (h.kind === 'character') router.push({ pathname: '/character/[id]', params: { id: h.ref } });
  else if (h.kind === 'enemy') router.push({ pathname: '/dm/[id]', params: { id: h.ref } });
  else if (h.kind === 'journal') router.push({ pathname: '/dm/journal/[id]', params: { id: h.ref } });
  else router.push({ pathname: '/wiki/[key]', params: { key: h.ref } });
}

/** One search box over characters, the DM bestiary, the journal, the reader's wiki notes and the wiki. */
export default function SearchScreen() {
  const { t, lang, loc } = useT();
  const c = useTheme();
  const [q, setQ] = useState('');
  // Raw store state only: deriving arrays inside a selector would loop (zustand 5).
  const characters = useCharacters((s) => s.characters);
  const enemies = useDm((s) => s.enemies);
  const journal = useJournal((s) => s.entries);
  const notes = useWikiUser((s) => s.notes);
  const homebrew = useHomebrew((s) => s.entries);
  const hits = useMemo(
    () =>
      globalSearch(
        q,
        {
          characters: Object.values(characters),
          enemies: Object.values(enemies),
          journal: Object.values(journal),
          notes,
          entryName: (key) => {
            const e = getEntry(key, homebrew);
            return e ? loc(e.name) : undefined;
          },
          content: (query) => searchContent(query, {}, lang, homebrew, 40),
        },
        lang,
      ),
    [q, characters, enemies, journal, notes, homebrew, lang, loc],
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: t('search.title') }} />
      <Field placeholder={t('search.placeholder')} value={q} onChangeText={setQ} autoFocus autoCorrect={false} testID="global-search" />
      {!q.trim() ? <Txt muted>{t('search.hint')}</Txt> : !hits.length ? <Txt muted>{t('search.none')}</Txt> : null}
      {HIT_KINDS.map((kind) => {
        const group = hits.filter((h) => h.kind === kind);
        if (!group.length) return null;
        return (
          <Card key={kind} title={`${t(`search.kinds.${kind}`)} (${group.length})`} style={{ paddingHorizontal: kind === 'content' ? 0 : undefined }}>
            {group.map((h) => {
              const entry = kind === 'content' ? getEntry(h.ref, homebrew) : undefined;
              if (entry) return <EntryRow key={h.ref} entry={entry} onPress={() => open(h)} />;
              return (
                <Pressable key={`${kind}:${h.ref}`} onPress={() => open(h)} style={({ pressed }) => ({ paddingVertical: 8, borderBottomWidth: 1, borderColor: c.border, opacity: pressed ? 0.6 : 1 })} testID={`hit-${kind}-${h.title}`}>
                  <Txt style={{ fontWeight: '600' }}>{h.title || t('dm.unnamed')}</Txt>
                  {h.snippet ? (
                    <Txt variant="small" muted numberOfLines={2}>
                      {h.snippet}
                    </Txt>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}
