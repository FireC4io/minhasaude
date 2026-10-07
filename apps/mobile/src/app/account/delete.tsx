import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useUsersControllerRequestDeletion } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { useAuth } from '@/features/auth/auth-context';
import { PrimaryButton } from '@/features/auth/primary-button';

const WHAT_IS_DELETED = [
  'Sua conta e seu perfil',
  'Todo o diário alimentar e os pesos registrados',
  'Suas metas',
  'Os alimentos que você cadastrou',
];

/**
 * Direito de eliminação (LGPD, art. 18). Informativo, sem tom alarmista, e com
 * confirmação explícita. Antes de excluir, oferece exportar.
 */
export default function DeleteAccountScreen() {
  const { logout } = useAuth();
  const requestDeletion = useUsersControllerRequestDeletion();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useAnnounce(done ? 'Pedido de exclusão registrado.' : null);

  async function handleDelete() {
    setError(null);
    try {
      await requestDeletion.mutateAsync();
      setDone(true);
    } catch {
      setError('Não foi possível registrar o pedido agora. Confira sua internet e tente de novo.');
    }
  }

  if (done) {
    return (
      <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          Pedido registrado
        </AppText>
        <AppText className="text-grafite">
          Sua conta foi desativada neste momento. Os dados serão apagados em até 30 dias.
        </AppText>
        <PrimaryButton label="Fechar" onPress={() => void logout()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        Você pode pedir a exclusão da sua conta quando quiser. Antes, se quiser guardar seus dados,
        use “Exportar meus dados” no Perfil.
      </AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          Será apagado em até 30 dias
        </AppText>
        {WHAT_IS_DELETED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {item}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        Guardamos apenas o registro de que você deu consentimento, sem nada que identifique você,
        como prova exigida pela lei. A exclusão é definitiva: depois do prazo, não dá para
        recuperar nada.
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
