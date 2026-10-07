import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { useUsersControllerRequestDeletion } from '@/api/generated/endpoints/me/me';
import type { DeletionStatus } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { useAuth } from '@/features/auth/auth-context';
import { PrimaryButton } from '@/features/auth/primary-button';
import { TextButton } from '@/components/ui/text-button';

const WHAT_IS_DELETED = [
  'Sua conta e seu perfil',
  'Todo o diário alimentar e os pesos registrados',
  'Suas metas',
  'Os alimentos que você cadastrou',
];

/**
 * Direito de eliminação (LGPD, art. 18). Informativo, sem tom alarmista, e com
 * confirmação explícita. A exclusão é imediata e sem volta (decisão de
 * 2026-10-07), então a tela oferece guardar os dados antes.
 */
export default function DeleteAccountScreen() {
  const { logout } = useAuth();
  const requestDeletion = useUsersControllerRequestDeletion();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeletionStatus | null>(null);
  useAnnounce(result ? 'Conta excluída.' : null);

  async function handleDelete() {
    setError(null);
    try {
      const response = await requestDeletion.mutateAsync();
      setResult(response.status);
    } catch {
      setError('Não foi possível excluir agora. Confira sua internet e tente de novo.');
    }
  }

  if (result) {
    return (
      <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          Conta excluída
        </AppText>
        <AppText className="text-grafite">
          {result === 'deleted'
            ? 'Seus dados foram apagados. Obrigado por ter usado o Gota Vital.'
            : 'Sua conta foi desativada. Terminamos de apagar os dados em até 1 dia.'}
        </AppText>
        <PrimaryButton label="Fechar" onPress={() => void logout()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        Você pode excluir sua conta quando quiser. Os dados são apagados na hora e não dá para
        recuperar depois. Se quiser guardar uma cópia, faça isso antes.
      </AppText>

      <TextButton label="Guardar uma cópia dos meus dados" onPress={() => router.push('/account/export')} />

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          Será apagado na hora
        </AppText>
        {WHAT_IS_DELETED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {item}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        Guardamos apenas o registro de que você deu consentimento, sem nada que identifique você,
        como prova exigida pela lei.
      </AppText>

      <CheckboxRow
        label="Entendi que a exclusão é definitiva"
        checked={confirmed}
        onChange={setConfirmed}
      />

      <FormError message={error} />

      <PrimaryButton
        label="Excluir minha conta"
        tone="danger"
        disabled={!confirmed}
        hint={confirmed ? undefined : 'Marque a confirmação acima para liberar'}
        isLoading={requestDeletion.isPending}
        onPress={() => void handleDelete()}
      />
    </ScrollView>
  );
}
