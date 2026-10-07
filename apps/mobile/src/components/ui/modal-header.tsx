import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

interface ModalHeaderProps {
  title: string;
}

/**
 * Cabeçalho de tela modal com "Fechar" sempre visível (F4-16): no celular não
 * existe o "voltar" do navegador, e o gesto de arrastar não é óbvio para todos.
 */
export function ModalHeader({ title }: ModalHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText variant="subtitle" accessibilityRole="header" className="flex-1 text-grafite">
        {title}
      </AppText>
      <TextButton
        label={t('common.close')}
        onPress={() => router.back()}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
      />
    </View>
  );
}
