import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Personajes' }} />
      <Tabs.Screen name="wiki" options={{ title: 'Wiki' }} />
      <Tabs.Screen name="dice" options={{ title: 'Dados' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
