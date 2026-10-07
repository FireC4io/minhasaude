import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/features/navigation/stack-screen-options';

export default function ExamLayout() {
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="consent" options={{ title: 'Autorização para exames' }} />
      <Stack.Screen name="upload" options={{ title: 'Enviar exame' }} />
      <Stack.Screen name="[id]" options={{ title: 'Exame' }} />
      <Stack.Screen name="review/[id]" options={{ title: 'Conferir valores' }} />
      <Stack.Screen name="marker/[code]" options={{ title: 'Evolução' }} />
      <Stack.Screen name="indices" options={{ title: 'Índices calculados' }} />
      <Stack.Screen name="bioimpedance" options={{ title: 'Bioimpedância' }} />
    </Stack>
  );
}
