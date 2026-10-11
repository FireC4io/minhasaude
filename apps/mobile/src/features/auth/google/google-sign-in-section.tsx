import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';

import { isGoogleSignInAvailable } from './google-sign-in';
import { GoogleSignInButton } from './google-sign-in-button';

/** Divisória "ou" + botão do Google. Some inteira onde o login do Google não existe. */
export function GoogleSignInSection() {
  const { t } = useTranslation();
  if (!isGoogleSignInAvailable()) {
    return null;
  }
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View className="h-px flex-1 bg-linha" />
        <AppText className="text-grafite-suave">{t('auth.google.or')}</AppText>
        <View className="h-px flex-1 bg-linha" />
      </View>
      <GoogleSignInButton />
    </View>
  );
}
