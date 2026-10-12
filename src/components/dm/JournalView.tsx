import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { JOURNAL_KINDS, newEntry, sortEntries, type JournalKind } from '../../journal/journal';
import { useT } from '../../i18n/useT';
import { useJournal } from '../../store/journal';
import { useTheme } from '../../theme';
import { normalize } from '../../wiki/search';
import { Badge, Button, Chip, Field, Row, Txt } from '../ui';

/** The DM's campaign journal: sessions, quests, NPCs, places and notes linked with [[…]]. */
export function JournalView() {
  const { t } = useT();
  const c = useTheme();
  const router = useRouter();
  const entries = useJournal((s) => s.entries);
  const save = useJournal((s) => s.save);
  const [kind, setKind] = useState<JournalKind | undefined>();
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = normalize(query);
    return sortEntries(Object.values(entries).filter((e) => (!kind || e.kind === kind) && (!q || normalize(`${e.title} ${e.body}`).includes(q))));
  }, [entries, kind, query]);
  const create = () => {
    const e = newEntry(kind ?? 'note');
    save(e);
    router.push({ pathname: '/dm/journal/[id]', params: { id: e.id, edit: '1' } });
  };
  return (
    <View style={{ gap: 10 }}>
      <Row wrap>
        <Chip label={t('journal.all')} active={!kind} onPress={() => setKind(undefined)} />
        {JOURNAL_KINDS.map((k) => (
          <Chip key={k} label={t(`journal.kinds.${k}`)} active={kind === k} onPress={() => setKind(kind === k ? undefined : k)} />
        ))}
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Field placeholder={t('journal.search')} value={query} onChangeText={setQuery} />
        </View>
        <Button label={`+ ${t(`journal.newKind.${kind ?? 'note'}`)}`} onPress={create} testID="journal-new" />
      </Row>
      {!list.length ? <Txt muted>{Object.keys(entries).length ? t('common.empty') : t('journal.empty')}</Txt> : null}
      {list.map((e) => (
        <Pressable key={e.id} onPress={() => router.push({ pathname: '/dm/journal/[id]', params: { id: e.id } })} style={({ pressed }) => ({ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: pressed ? c.surfaceAlt : c.surface, gap: 4 })}>
          <Row>
            <Badge label={t(`journal.kinds.${e.kind}`)} />
            <Txt style={{ flex: 1, fontWeight: '700' }} numberOfLines={1}>
              {e.title || t('dm.unnamed')}
            </Txt>
            {e.kind === 'session' && e.date ? <Txt variant="small" muted>{e.date}</Txt> : null}
            {e.kind === 'quest' && e.status ? <Badge label={t(`journal.status.${e.status}`)} color={e.status === 'open' ? c.accent : e.status === 'done' ? c.success : c.danger} /> : null}
          </Row>
          {e.body ? (
            <Txt variant="small" muted numberOfLines={2}>
              {e.body.replace(/\[\[|\]\]/g, '')}
            </Txt>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
