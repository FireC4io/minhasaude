import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { usersControllerGetProgressReport } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { PrimaryButton } from '@/features/auth/primary-button';
import { buildProgressReport } from '@/features/report/progress-report';
import { renderReportHtml } from '@/features/report/report-html';
import { shareReport } from '@/features/report/share-report';

const INCLUDED = [
  'Seu peso: gráfico, primeiro e último registro e a diferença',
  'Médias de cada semana comparadas com a sua meta',
  'Todas as metas, com a data em que começaram',
  'O diário completo, dia a dia e por refeição',
];

/**
 * Relatório de progresso em PDF, feito para ler, imprimir ou mostrar a um
 * profissional. Diferente da exportação (JSON, para outros apps).
 */
export default function ProgressReportScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  useAnnounce(done);

  async function handleGenerate() {
    setError(null);
    setDone(null);
    setIsGenerating(true);
    try {
      const data = await usersControllerGetProgressReport();
      await shareReport(renderReportHtml(buildProgressReport(data)));
      setDone('Relatório gerado. Escolha onde salvar ou com quem compartilhar.');
    } catch {
      setError('Não foi possível gerar o relatório agora. Confira sua internet e tente de novo.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <AppText className="text-grafite">
        Um arquivo PDF com o seu progresso, para guardar, imprimir ou mostrar a quem acompanha você.
      </AppText>

      <View className="gap-2 rounded-2xl bg-superficie p-4">
        <AppText variant="label" className="text-grafite-suave">
          O relatório mostra
        </AppText>
        {INCLUDED.map((item) => (
          <AppText key={item} className="text-grafite">
            • {item}
          </AppText>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        O relatório tem dados de saúde: guarde num lugar seguro e só compartilhe com quem você
        confia.
      </AppText>

      {done ? (
        <AppText variant="bodyStrong" className="text-grafite">
          ✓ {done}
        </AppText>
      ) : null}
      <FormError message={error} />

      <PrimaryButton
        label={isGenerating ? 'Gerando o relatório' : 'Gerar relatório em PDF'}
        onPress={() => void handleGenerate()}
        isLoading={isGenerating}
      />
    </ScrollView>
  );
}
