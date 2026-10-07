import { CURRENT_PRIVACY_POLICY_VERSION } from '@minhasaude/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConsentsControllerGrant } from '@/api/generated/endpoints/consents/consents';
import { FormError } from '@/components/ui/form-error';
import { PrimaryButton } from '@/features/auth/primary-button';
import { AppText } from '@/components/ui/app-text';

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
          <AppText variant="title" accessibilityRole="header" className="text-grafite">Antes de começar</AppText>
          <AppText className="text-grafite">
            Pra calcular suas metas e organizar seu diário alimentar, precisamos guardar dados
            pessoais sensíveis: peso, altura, idade, sexo e nível de atividade.
          </AppText>
        </View>

        <View className="gap-3 rounded-2xl border border-grafite bg-superficie p-4">
          <AppText className="text-grafite">
            • Usamos esses dados só para calcular sua taxa metabólica, gasto calórico e metas de
            macronutrientes — nunca para diagnóstico ou recomendação médica.
          </AppText>
          <AppText className="text-grafite">
            • Seus dados não são vendidos nem compartilhados com terceiros para publicidade.
          </AppText>
          <AppText className="text-grafite">
            • Você pode exportar todos os seus dados ou excluir sua conta a qualquer momento, nas
            configurações do app.
          </AppText>
          <AppText className="text-grafite">
            • Este aceite vale para a versão {CURRENT_PRIVACY_POLICY_VERSION} da nossa política de
            privacidade.
          </AppText>
        </View>

        <FormError message={error} />

        <PrimaryButton
          label="Aceito, quero continuar"
          onPress={handleAccept}
          isLoading={grantConsent.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
