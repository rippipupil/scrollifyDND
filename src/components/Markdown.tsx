import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import { parseInline, parseMarkdown } from './markdown';

function Inline({ text, size = 15 }: { text: string; size?: number }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.text, fontSize: size, lineHeight: size * 1.4 }} selectable>
      {parseInline(text).map((s, i) => (
        <Text key={i} style={{ fontWeight: s.bold ? '700' : '400', fontStyle: s.italic ? 'italic' : 'normal' }}>
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

export function Markdown({ text }: { text: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {parseMarkdown(text).map((b, i) => {
        if (b.type === 'h') return <Text key={i} style={{ color: c.accent, fontWeight: '700', fontSize: 16, marginTop: 4 }}>{b.text}</Text>;
        if (b.type === 'list')
          return (
            <View key={i} style={{ gap: 4 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 6, marginLeft: (b.depths[j] ?? 0) * 16 }}>
                  <Text style={{ color: c.accent }}>{b.markers[j] ?? '•'}</Text>
                  <View style={{ flex: 1 }}>
                    <Inline text={it} />
                  </View>
                </View>
              ))}
            </View>
          );
        if (b.type === 'table')
          return (
            <View key={i} style={{ borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: 'hidden' }}>
              {b.rows.map((r, j) => (
                <View key={j} style={{ flexDirection: 'row', backgroundColor: j === 0 ? c.surfaceAlt : j % 2 ? c.surface : 'transparent' }}>
                  {r.map((cell, k) => (
                    <View key={k} style={{ flex: k === r.length - 1 && r.length > 2 ? 2 : 1, padding: 6, borderLeftWidth: k ? 1 : 0, borderColor: c.border }}>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: j === 0 ? '700' : '400' }}>{cell}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        return (
          <View key={i} style={{ gap: 4 }}>
            {b.lines.map((l, j) => (
              <Inline key={j} text={l} />
            ))}
          </View>
        );
      })}
    </View>
  );
}
