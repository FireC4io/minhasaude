import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/features/navigation/stack-screen-options';

export default function AccountLayout() {
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="edit" options={{ title: 'Seus dados' }} />
      <Stack.Screen name="export" options={{ title: 'Exportar dados' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacidade' }} />
      <Stack.Screen name="delete" options={{ title: 'Excluir conta' }} />
      <Stack.Screen name="preferences" options={{ title: 'Preferências' }} />
      <Stack.Screen name="about" options={{ title: 'Sobre o Gota Vital' }} />
    </Stack>
  );
}
