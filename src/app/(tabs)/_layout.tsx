import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Pressable, type ColorValue } from 'react-native';
import { useT } from '../../i18n/useT';
import { useTheme } from '../../theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function TabsLayout() {
  const c = useTheme();
  const { t } = useT();
  const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <MaterialCommunityIcons name={name} color={color as string} size={size} />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        sceneStyle: { backgroundColor: c.bg },
        headerRight: () => (
          <Pressable onPress={() => router.push('/search')} hitSlop={10} style={{ paddingHorizontal: 14 }} accessibilityLabel={t('search.title')} testID="open-search">
            <MaterialCommunityIcons name="magnify" size={24} color={c.text} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.characters'), tabBarIcon: icon('account-group') }} />
      <Tabs.Screen name="wiki" options={{ title: t('tabs.wiki'), tabBarIcon: icon('book-open-page-variant') }} />
      <Tabs.Screen name="dm" options={{ title: t('tabs.dm'), tabBarIcon: icon('sword-cross') }} />
      <Tabs.Screen name="dice" options={{ title: t('tabs.dice'), tabBarIcon: icon('dice-d20') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: icon('cog') }} />
    </Tabs>
  );
}
