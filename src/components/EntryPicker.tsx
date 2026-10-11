import { useMemo, useState } from 'react';
import { searchContent } from '../content';
import type { Category, ContentEntry } from '../content/types';
import { useT } from '../i18n/useT';
import { useHomebrew } from '../store/homebrew';
import type { SearchFilters } from '../wiki/search';
import { Button, Field, Sheet } from './ui';
import { EntryRow } from './wiki/EntryRow';

export function EntryPicker({ visible, onClose, onPick, categories, filters, title, onCustom }: { visible: boolean; onClose: () => void; onPick: (e: ContentEntry) => void; categories: Category[]; filters?: SearchFilters; title: string; onCustom?: () => void }) {
  const { t, lang } = useT();
  const homebrew = useHomebrew((s) => s.entries);
  const [q, setQ] = useState('');
  const results = useMemo(() => (visible ? searchContent(q, { ...filters, category: categories }, lang, homebrew, 60) : []), [visible, q, filters, categories, lang, homebrew]);
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <Field placeholder={t('common.search')} value={q} onChangeText={setQ} autoFocus testID="picker-search" />
      {onCustom ? <Button kind="secondary" small label={t('common.custom')} onPress={onCustom} /> : null}
      {results.map((e) => (
        <EntryRow key={`${e.category}:${e.id}`} entry={e} onPress={() => onPick(e)} />
      ))}
    </Sheet>
  );
}
