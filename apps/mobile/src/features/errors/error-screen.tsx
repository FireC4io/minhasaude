import { useEffect } from 'react';
import { View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { PrimaryButton } from '@/features/auth/primary-button';

import type { ErrorReporter } from './error-reporter';

// Sem medidas iniciais o provider não desenha nada até medir a tela.
const METRICS = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

interface ErrorScreenProps {
  error: Error;
  retry: () => Promise<void>;
  reporter: ErrorReporter;
}

/**
 * No lugar da tela branca quando uma tela quebra ao desenhar. Tem o próprio
 * SafeAreaProvider porque pode aparecer fora dos provedores do app.
 */
export function ErrorScreen({ error, retry, reporter }: Readonly<ErrorScreenProps>) {
  const { t } = useTranslation();

  useEffect(() => {
    void reporter.report(error, { fatal: true });
  }, [error, reporter]);

  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <SafeAreaView className="flex-1 bg-areia">
        <View className="flex-1 justify-center gap-6 px-6">
          <View className="gap-2">
            <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
              {t('screenError.title')}
            </AppText>
            <AppText className="text-grafite">{t('screenError.body')}</AppText>
          </View>
          <PrimaryButton label={t('common.tryAgain')} onPress={() => void retry()} isLoading={false} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
