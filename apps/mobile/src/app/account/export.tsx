import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { usersControllerExportData } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { exportFileName } from '@/features/account/export-file-name';
import { saveExportFile } from '@/features/account/save-export-file';
import { PrimaryButton } from '@/features/auth/primary-button';

const INCLUDED = [
  'Sua conta (e-mail e datas)',
  'Seu perfil (nascimento, sexo, altura, atividade e objetivo)',
  'Os consentimentos que você deu',
  'Suas metas, inclusive as antigas',
  'Todos os pesos registrados',
  'Todo o seu diário alimentar',
];

/** Direito de portabilidade (LGPD, art. 18). Gratuito e sem limite. */
export default function ExportDataScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useAnnounce(done);

  async function handleExport() {
    setError(null);
    setDone(null);
    setIsExporting(true);
    try {
      const data: unknown = await usersControllerExportData();
      await saveExportFile(exportFileName(), JSON.stringify(data, null, 2));
      setDone('Arquivo gerado. Escolha onde salvar ou com quem compartilhar.');
    } catch {
      setError('Não foi possível gerar o arquivo agora. Confira sua internet e tente de novo.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        Você pode baixar, a qualquer momento e de graça, um arquivo com tudo o que o Gota Vital
        guarda sobre você.
      </AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          O arquivo inclui
        </AppText>
        {INCLUDED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {item}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        O arquivo é do tipo JSON, que outros apps e serviços conseguem ler. Ele tem dados de saúde:
        guarde-o num lugar seguro e só compartilhe com quem você confia.
      </AppText>

      {done ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {done}
        </AppText>
      ) : null}
      <FormError message={error} />

      <PrimaryButton
        label={isExporting ? 'Gerando o arquivo' : 'Gerar meu arquivo'}
        onPress={() => void handleExport()}
        isLoading={isExporting}
      />
    </ScrollView>
  );
}
