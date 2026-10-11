import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { RollToast } from '../components/RollToast';
import { useTheme } from '../theme';

export default function RootLayout() {
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={c.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.surface },
          headerTintColor: c.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <RollToast />
    </View>
  );
}
