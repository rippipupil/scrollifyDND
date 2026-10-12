import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { confirmAsync } from '../../../components/dialogs';
import { Badge, Button, Card, Chip, Field, Row, Screen, Txt } from '../../../components/ui';
import { useT } from '../../../i18n/useT';
import { backlinks, findByTitle, JOURNAL_KINDS, linkedTitles, newEntry, splitLinks, type JournalEntry, type QuestStatus } from '../../../journal/journal';
import { useJournal } from '../../../store/journal';
import { useTheme } from '../../../theme';

/** Body text with [[links]]: existing pages open, missing ones are created on tap. */
function Body({ text, onLink }: { text: string; onLink: (title: string) => void }) {
  const c = useTheme();
  const { t } = useT();
  if (!text.trim()) return <Txt muted>{t('journal.emptyBody')}</Txt>;
  return (
    <View style={{ gap: 6 }}>
      {text.split('\n').map((line, i) => (
        <Text key={i} style={{ color: c.text, fontSize: 15, lineHeight: 21 }} selectable>
          {splitLinks(line).map((part, j) =>
            part.link ? (
              <Text key={j} style={{ color: c.accent, fontWeight: '700', textDecorationLine: 'underline' }} onPress={() => onLink(part.text)}>
                {part.text}
              </Text>
            ) : (
              <Text key={j}>{part.text}</Text>
            ),
          )}
        </Text>
      ))}
    </View>
  );
}

export default function JournalEntryScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { t } = useT();
  const th = useTheme();
  const entries = useJournal((s) => s.entries);
  const save = useJournal((s) => s.save);
  const rename = useJournal((s) => s.rename);
  const remove = useJournal((s) => s.remove);
  const e = entries[id];
  const [editing, setEditing] = useState(edit === '1');
  const [title, setTitle] = useState(e?.title ?? '');
  if (!e) {
    return (
      <Screen>
        <Txt>{t('common.empty')}</Txt>
      </Screen>
    );
  }
  const all = Object.values(entries);
  const patch = (p: Partial<JournalEntry>) => save({ ...e, ...p });
  const open = (target: string) => {
    const found = findByTitle(all, target);
    if (found) return router.push({ pathname: '/dm/journal/[id]', params: { id: found.id } });
    // A link to a page that doesn't exist yet creates it, like a wiki.
    const created = newEntry('note', target);
    save(created);
    router.push({ pathname: '/dm/journal/[id]', params: { id: created.id, edit: '1' } });
  };
  const commitTitle = () => {
    if (title !== e.title) rename(e.id, title);
  };
  const links = linkedTitles(e.body);
  const back = backlinks(all, e);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: e.title || t('dm.unnamed'),
          headerRight: () => (
            <Button
              small
              kind={editing ? 'primary' : 'ghost'}
              label={editing ? t('common.done') : t('common.edit')}
              onPress={() => {
                if (editing) commitTitle();
                setEditing(!editing);
              }}
              testID="journal-edit-toggle"
            />
          ),
        }}
      />
      {editing ? (
        <>
          <Field label={t('journal.title')} value={title} onChangeText={setTitle} onBlur={commitTitle} testID="journal-title" />
          <Row wrap>
            {JOURNAL_KINDS.map((k) => (
              <Chip
                key={k}
                label={t(`journal.kinds.${k}`)}
                active={e.kind === k}
                onPress={() => {
                  const fresh = newEntry(k);
                  patch({ kind: k, date: k === 'session' ? e.date ?? fresh.date : undefined, status: k === 'quest' ? e.status ?? 'open' : undefined });
                }}
              />
            ))}
          </Row>
          {e.kind === 'session' ? <Field label={t('journal.date')} value={e.date ?? ''} onChangeText={(date) => patch({ date })} placeholder="2026-10-12" /> : null}
          {e.kind === 'quest' ? (
            <Row wrap>
              {(['open', 'done', 'failed'] as QuestStatus[]).map((s) => (
                <Chip key={s} label={t(`journal.status.${s}`)} active={e.status === s} onPress={() => patch({ status: s })} />
              ))}
            </Row>
          ) : null}
          <Field label={t('journal.body')} value={e.body} onChangeText={(body) => patch({ body })} multiline style={{ minHeight: 220, textAlignVertical: 'top' }} testID="journal-body" />
          <Txt variant="small" muted>
            {t('journal.linkHint')}
          </Txt>
          <Button
            kind="danger"
            label={t('common.delete')}
            onPress={async () => {
              if (await confirmAsync(t('common.confirmDelete', { name: e.title || t('dm.unnamed') }), t('common.delete'), t('common.cancel'))) {
                remove(e.id);
                router.back();
              }
            }}
          />
        </>
      ) : (
        <>
          <Row wrap>
            <Badge label={t(`journal.kinds.${e.kind}`)} />
            {e.kind === 'session' && e.date ? <Badge label={e.date} /> : null}
            {e.kind === 'quest' && e.status ? <Badge label={t(`journal.status.${e.status}`)} color={e.status === 'open' ? th.accent : e.status === 'done' ? th.success : th.danger} /> : null}
          </Row>
          <Card>
            <Body text={e.body} onLink={open} />
          </Card>
          {links.length ? (
            <Card title={t('journal.links')}>
              <Row wrap>
                {links.map((l) => (
                  <Chip key={l} label={findByTitle(all, l) ? l : `+ ${l}`} onPress={() => open(l)} />
                ))}
              </Row>
            </Card>
          ) : null}
          {back.length ? (
            <Card title={t('journal.mentionedIn')}>
              <Row wrap>
                {back.map((b) => (
                  <Chip key={b.id} label={b.title || t('dm.unnamed')} onPress={() => router.push({ pathname: '/dm/journal/[id]', params: { id: b.id } })} />
                ))}
              </Row>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
