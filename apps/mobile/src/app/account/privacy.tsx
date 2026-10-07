import { ScrollView, View } from 'react-native';

import { useConsentsControllerList } from '@/api/generated/endpoints/consents/consents';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import {
  CONSENT_LABELS,
  formatConsentDate,
  type ConsentStatusView,
} from '@/features/account/consent-labels';

export default function PrivacyScreen() {
  const consentsQuery = useConsentsControllerList();
  const consents = (consentsQuery.data ?? []) as unknown as ConsentStatusView[];

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        Seus dados de saúde só são usados para o que você autorizou. Aqui está o que você aceitou e
        quando.
      </AppText>

      {consentsQuery.isPending ? (
        <LoadingIndicator label="Carregando seus consentimentos" />
      ) : consentsQuery.isError ? (
        <FormError message="Não foi possível carregar agora. Tente de novo em instantes." />
      ) : (
        <View className="gap-3">
          {consents.map((consent) => {
            const label = CONSENT_LABELS[consent.consentType];
            return (
              <View key={consent.consentType} className="gap-1 rounded-2xl bg-superficie p-4">
                <AppText variant="bodyStrong" className="text-grafite">
                  {label.title}
                </AppText>
                <AppText variant="caption" className="text-grafite">
                  {label.what}
                </AppText>
                <AppText variant="label" className="text-grafite">
                  {consent.granted
                    ? `✓ Aceito em ${formatConsentDate(consent.grantedAt)}${
                        consent.policyVersion ? ` (versão ${consent.policyVersion})` : ''
                      }`
                    : consent.revokedAt
                      ? `Retirado em ${formatConsentDate(consent.revokedAt)}`
                      : 'Ainda não aceito'}
                </AppText>
              </View>
            );
          })}
        </View>
      )}

      <AppText variant="caption" className="text-grafite-suave">
        Para deixar de usar seus dados, você pode excluir a conta pelo Perfil. Cada direito previsto
        na LGPD — acesso, correção, portabilidade e eliminação — tem um caminho no app.
      </AppText>
    </ScrollView>
  );
}
