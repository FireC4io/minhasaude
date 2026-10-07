import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { TextButton } from '@/components/ui/text-button';
import { PrimaryButton } from '@/features/auth/primary-button';

const FEATURES = ['food', 'weight', 'exams'] as const;

/**
 * Boas-vindas antes do login (F4-31). Uma tela só, rolável, em vez de painéis
 * deslizantes — deslizar não é óbvio para quem tem pouca familiaridade com
 * celular, e cada painel escondia os botões.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="grow justify-center gap-8 px-6 py-8">
        <View className="items-center gap-3">
          <BrandMark size={88} />
          <AppText variant="title" accessibilityRole="header" className="text-center text-grafite">
            Gota Vital
          </AppText>
          <AppText className="text-center text-grafite">
            {t('auth.welcome.tagline')}
          </AppText>
        </View>

        <View className="gap-3">
          {FEATURES.map((feature, index) => (
            <View
              key={feature}
              accessible
              className="flex-row gap-4 rounded-2xl bg-superficie p-4">
              <AppText variant="numberLarge" className="text-mamao-forte">
                {index + 1}
              </AppText>
              <View className="flex-1 gap-1">
                <AppText variant="bodyStrong" className="text-grafite">
                  {t(`auth.welcome.${feature}Title`)}
                </AppText>
                <AppText className="text-grafite">{t(`auth.welcome.${feature}Text`)}</AppText>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-2">
          <PrimaryButton
            label={t('auth.welcome.createMine')}
            onPress={() => router.push('/register')}
            isLoading={false}
          />
          <TextButton
            label={t('auth.welcome.haveAccount')}
            onPress={() => router.push('/login')}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="items-center"
          />
        </View>

        <AppText variant="caption" className="text-center text-grafite-suave">
          {t('auth.welcome.footer')}
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
