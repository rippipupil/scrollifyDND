import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { allEntries, keyOf } from '../../content';
import type { ContentEntry } from '../../content/types';
import { useT } from '../../i18n/useT';
import { useHomebrew } from '../../store/homebrew';
import { useTheme } from '../../theme';
import { classScaling, subclassesOf, subclassLevels } from '../../wiki/classInfo';
import { Markdown } from '../Markdown';
import { Badge, Card, Chip, Row, Txt } from '../ui';

/** Our own guide to a class: what it is, how it works, how it scales, tips and every subclass it can take. */
export function ClassGuide({ e }: { e: ContentEntry }) {
  const { t, loc, dist } = useT();
  const router = useRouter();
  const homebrew = useHomebrew((s) => s.entries);
  const g = e.data?.guide;
  const levels: any[] = e.data?.levels ?? [];
  const rows = classScaling(levels);
  const subs = subclassesOf(e.id, allEntries(homebrew), (s) => loc(s.name));
  const subLevels = subclassLevels(subs);
  const value = (kind: string, v: string | number) => (kind === 'distance' && typeof v === 'number' ? `+${dist(v)}` : String(v));
  const open = (s: ContentEntry) => router.push({ pathname: '/wiki/[key]', params: { key: keyOf(s) } });
  return (
    <>
      {g ? (
        <Card title={t('guide.howItWorks')}>
          <Markdown text={loc(g.summary)} />
          {g.core ? <Markdown text={loc(g.core)} /> : null}
        </Card>
      ) : null}
      {g?.scaling || rows.length ? (
        <Card title={t('guide.scaling')}>
          {g?.scaling ? <Markdown text={loc(g.scaling)} /> : null}
          {rows.length ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Txt variant="small" muted style={{ fontWeight: '700' }}>
                {t('guide.keyNumbers')}
              </Txt>
              {rows.map((r) => (
                <View key={r.key}>
                  <Txt style={{ fontWeight: '600' }}>{t(`guide.scale.${r.key}`)}</Txt>
                  <Txt variant="small" muted>
                    {r.steps.map((s) => `${value(r.kind, s.value)} (${t('guide.lv', { n: s.level })})`).join(' → ')}
                  </Txt>
                </View>
              ))}
              {subLevels.length ? (
                <View>
                  <Txt style={{ fontWeight: '600' }}>{t('guide.subclassFeatures')}</Txt>
                  <Txt variant="small" muted>
                    {subLevels.map((n) => t('guide.lv', { n })).join(', ')}
                  </Txt>
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>
      ) : null}
      {g?.tips ? (
        <Card title={t('guide.tips')}>
          <Markdown text={loc(g.tips)} />
        </Card>
      ) : null}
      {subs.length ? (
        <Card title={`${t('guide.subclasses')} (${subs.length})`}>
          <Row wrap>
            {subs.map((s) => (
              <Chip key={s.id} label={`${loc(s.name)}${s.data?.era === '2014' ? ' · 2014' : ''}`} onPress={() => open(s)} />
            ))}
          </Row>
        </Card>
      ) : null}
      {g ? (
        <Txt variant="small" muted>
          {t('guide.ownWords')}
        </Txt>
      ) : null}
    </>
  );
}

/** Our own guide to a subclass: summary and what each feature does, level by level. */
export function SubclassGuide({ e }: { e: ContentEntry }) {
  const { t, loc } = useT();
  const c = useTheme();
  const router = useRouter();
  const g = e.data?.guide;
  const classId: string | undefined = e.data?.classId;
  const classEntry = classId ? allEntries().find((x) => x.category === 'class' && (x.id === classId || x.id === `ext-class-${classId}`)) : undefined;
  return (
    <>
      {classEntry ? (
        <Row wrap>
          <Txt muted>{t('wiki.class')}:</Txt>
          <Chip label={loc(classEntry.name)} onPress={() => router.push({ pathname: '/wiki/[key]', params: { key: keyOf(classEntry) } })} />
        </Row>
      ) : null}
      {g ? (
        <>
          <Card title={t('guide.howItWorks')}>
            <Markdown text={loc(g.summary)} />
          </Card>
          {g.features?.length ? (
            <Card title={t('guide.byLevel')}>
              {g.features.map((f: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderColor: c.border }}>
                  <View style={{ width: 44, alignItems: 'center' }}>
                    {i === 0 || g.features[i - 1].level !== f.level ? <Badge label={t('guide.lv', { n: f.level })} color={c.accent} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt style={{ fontWeight: '700' }}>{loc(f.name)}</Txt>
                    <Markdown text={loc(f.text)} />
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
          {e.data?.era === '2014' ? (
            <Txt variant="small" muted>
              {t('guide.legacyLevels')}
            </Txt>
          ) : null}
          <Txt variant="small" muted>
            {t('guide.ownWords')}
          </Txt>
        </>
      ) : null}
    </>
  );
}
