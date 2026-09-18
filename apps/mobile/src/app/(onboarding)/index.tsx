import { CURRENT_PRIVACY_POLICY_VERSION } from '@minhasaude/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConsentsControllerGrant } from '@/api/generated/endpoints/consents/consents';
import { PrimaryButton } from '@/features/auth/primary-button';

export default function ConsentScreen() {
  const router = useRouter();
  const grantConsent = useConsentsControllerGrant();
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    try {
      await grantConsent.mutateAsync({
        data: { consentType: 'privacy_policy', policyVersion: CURRENT_PRIVACY_POLICY_VERSION },
      });
      router.push('/profile');
    } catch {
      setError('Não foi possível registrar seu aceite. Verifique sua conexão e tente de novo.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8" className="flex-1">
        <View className="gap-1">
          <Text className="text-3xl font-semibold text-grafite">Antes de começar</Text>
          <Text className="text-base text-grafite">
            Pra calcular suas metas e organizar seu diário alimentar, precisamos guardar dados
            pessoais sensíveis: peso, altura, idade, sexo e nível de atividade.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-grafite bg-white p-4">
          <Text className="text-base text-grafite">
            • Usamos esses dados só para calcular sua taxa metabólica, gasto calórico e metas de
            macronutrientes — nunca para diagnóstico ou recomendação médica.
          </Text>
          <Text className="text-base text-grafite">
            • Seus dados não são vendidos nem compartilhados com terceiros para publicidade.
          </Text>
          <Text className="text-base text-grafite">
            • Você pode exportar todos os seus dados ou excluir sua conta a qualquer momento, nas
            configurações do app.
          </Text>
          <Text className="text-base text-grafite">
            • Este aceite vale para a versão {CURRENT_PRIVACY_POLICY_VERSION} da nossa política de
            privacidade.
          </Text>
        </View>

        {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}

        <PrimaryButton
          label="Aceito, quero continuar"
          onPress={handleAccept}
          isLoading={grantConsent.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
