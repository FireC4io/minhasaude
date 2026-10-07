import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { BrandMark } from '@/components/ui/brand-mark';
import { TextButton } from '@/components/ui/text-button';
import { PrimaryButton } from '@/features/auth/primary-button';

const FEATURES = [
  {
    title: 'Anote o que você come',
    text: 'Busque o alimento ou fale a refeição. O app faz a conta das calorias e nutrientes.',
  },
  {
    title: 'Acompanhe seu peso',
    text: 'Registre quando quiser e veja a evolução num gráfico simples.',
  },
  {
    title: 'Guarde seus exames',
    text: 'Exames de sangue e bioimpedância num só lugar, com a faixa do próprio laudo.',
  },
];

/**
 * Boas-vindas antes do login (F4-31). Uma tela só, rolável, em vez de painéis
 * deslizantes — deslizar não é óbvio para quem tem pouca familiaridade com
 * celular, e cada painel escondia os botões.
 */
export default function WelcomeScreen() {
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
            Sua alimentação e sua saúde, num app fácil de usar.
          </AppText>
        </View>

        <View className="gap-3">
          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              accessible
              className="flex-row gap-4 rounded-2xl bg-superficie p-4">
              <AppText variant="numberLarge" className="text-mamao-forte">
                {index + 1}
              </AppText>
              <View className="flex-1 gap-1">
                <AppText variant="bodyStrong" className="text-grafite">
                  {feature.title}
                </AppText>
                <AppText className="text-grafite">{feature.text}</AppText>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-2">
          <PrimaryButton
            label="Criar minha conta"
            onPress={() => router.push('/register')}
            isLoading={false}
          />
          <TextButton
            label="Já tenho conta"
            onPress={() => router.push('/login')}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="items-center"
          />
        </View>

        <AppText variant="caption" className="text-center text-grafite-suave">
          Gratuito e sem anúncios. As informações do app não substituem a orientação de um
          profissional de saúde.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
