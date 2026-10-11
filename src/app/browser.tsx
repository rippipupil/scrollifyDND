import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '../components/ui';
import { useT } from '../i18n/useT';

export default function BrowserScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { t } = useT();
  if (Platform.OS === 'web') {
    return (
      <View style={{ padding: 16 }}>
        <Button label={t('common.open')} onPress={() => Linking.openURL(url)} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: new URL(url).hostname, headerRight: () => <Button small kind="ghost" label="↗" onPress={() => Linking.openURL(url)} /> }} />
      <WebView source={{ uri: url }} style={{ flex: 1 }} startInLoadingState />
    </View>
  );
}
