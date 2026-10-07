import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/features/navigation/stack-screen-options';

export default function AccountLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useStackScreenOptions()}>
      <Stack.Screen name="edit" options={{ title: t('account.screens.edit') }} />
      <Stack.Screen name="report" options={{ title: t('account.screens.report') }} />
      <Stack.Screen name="export" options={{ title: t('account.screens.export') }} />
      <Stack.Screen name="privacy" options={{ title: t('account.screens.privacy') }} />
      <Stack.Screen name="delete" options={{ title: t('account.screens.delete') }} />
      <Stack.Screen name="preferences" options={{ title: t('account.screens.preferences') }} />
      <Stack.Screen name="about" options={{ title: t('account.screens.about') }} />
    </Stack>
  );
}
