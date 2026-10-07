import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/features/navigation/stack-screen-options';

export default function ExamLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="consent" options={{ title: t('exams.screens.consent') }} />
      <Stack.Screen name="upload" options={{ title: t('exams.screens.upload') }} />
      <Stack.Screen name="[id]" options={{ title: t('exams.screens.detail') }} />
      <Stack.Screen name="review/[id]" options={{ title: t('exams.screens.review') }} />
      <Stack.Screen name="marker/[code]" options={{ title: t('exams.screens.marker') }} />
      <Stack.Screen name="indices" options={{ title: t('exams.screens.indices') }} />
      <Stack.Screen name="bioimpedance" options={{ title: t('exams.screens.bio') }} />
    </Stack>
  );
}
