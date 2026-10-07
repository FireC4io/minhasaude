import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '@/features/auth/primary-button';
import { AppText } from '@/components/ui/app-text';

interface GoalUnavailableViewProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

/**
 * Mostrada quando a busca da meta atual falha por algo que não seja 404.
 * Sem isso, qualquer erro de rede jogaria o usuário de volta no onboarding.
 */
export function GoalUnavailableView({ onRetry, isRetrying }: GoalUnavailableViewProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="gap-2">
          <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">{t('goalUnavailable.title')}</AppText>
          <AppText className="text-grafite">
            {t('goalUnavailable.body')}
          </AppText>
        </View>

        <PrimaryButton label={t('common.tryAgain')} onPress={onRetry} isLoading={isRetrying} />
      </View>
    </SafeAreaView>
  );
}
