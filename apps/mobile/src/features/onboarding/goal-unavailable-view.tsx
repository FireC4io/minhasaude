import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="gap-2">
          <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">Não foi possível carregar</AppText>
          <AppText className="text-grafite">
            Não conseguimos buscar sua meta agora. Seus dados continuam salvos — é só tentar de
            novo quando a conexão voltar.
          </AppText>
        </View>

        <PrimaryButton label="Tentar de novo" onPress={onRetry} isLoading={isRetrying} />
      </View>
    </SafeAreaView>
  );
}
