import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { FormError } from '@/components/ui/form-error';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { formatExamDate } from '@/features/exams/exam-labels';
import { previewExamRepository, useExamDocument } from '@/features/exams/exam-repository';
import { markerInfo } from '@/features/exams/marker-catalog';
import type { ExamResult } from '@/features/exams/types';
import { parseDecimal } from '@/features/forms/parse-decimal';

interface Draft {
  value: string;
  include: boolean;
}

/**
 * Revisão obrigatória (Fase 5): a leitura automática pode errar, então nada
 * entra em gráfico ou índice antes de a pessoa conferir com o laudo. O valor
 * lido continua guardado como veio (`raw_value`); o conferido vai separado.
 */
export default function ReviewExamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const document = useExamDocument(id);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);

  if (!document) {
    return (
      <View className="flex-1 bg-areia px-6 py-6">
        <AppText className="text-grafite">Este exame não foi encontrado.</AppText>
      </View>
    );
  }

  const draftFor = (result: ExamResult): Draft =>
    drafts[result.id] ?? { value: result.rawValue, include: true };
  const update = (result: ExamResult, change: Partial<Draft>) =>
    setDrafts({ ...drafts, [result.id]: { ...draftFor(result), ...change } });

  function confirm() {
    setError(null);
    const included = document?.results.filter((result) => draftFor(result).include) ?? [];
    const invalid = included.find(
      (result) => !Number.isFinite(parseDecimal(draftFor(result).value)),
    );
    if (invalid) {
      setError(
        `Confira o valor de ${markerInfo(invalid.markerCode).displayName}: use só números, como 92 ou 5,4.`,
      );
      return;
    }
    previewExamRepository.confirm(
      document?.id ?? '',
      included.map((result) => ({
        resultId: result.id,
        value: parseDecimal(draftFor(result).value),
        unit: result.rawUnit,
      })),
    );
    router.replace({ pathname: '/exam/[id]', params: { id: document?.id } });
  }

  const includedCount = document.results.filter((result) => draftFor(result).include).length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-5 px-6 py-6" keyboardShouldPersistTaps="handled">
        <AppText className="text-grafite">
          Exame de {formatExamDate(document.collectedAt)}. Compare cada valor com o laudo. Corrija o
          que estiver diferente e desmarque o que não estiver no seu exame.
        </AppText>

        {document.results.map((result) => {
          const info = markerInfo(result.markerCode);
          const draft = draftFor(result);
          const changed = draft.value.trim() !== result.rawValue;
          return (
            <View key={result.id} className="gap-3 rounded-2xl bg-superficie p-4">
              <AppText variant="bodyStrong" className="text-grafite">
                {info.displayName}
              </AppText>
              <AppText variant="caption" className="text-grafite-suave">
                Lido no laudo: {result.rawValue} {result.rawUnit}
                {result.rawReferenceRange ? ` · Referência: ${result.rawReferenceRange}` : ''}
              </AppText>
              {draft.include ? (
                <AuthTextField
                  label={`Valor (${result.rawUnit})`}
                  accessibilityLabel={`Valor de ${info.displayName}, em ${result.rawUnit}`}
                  value={draft.value}
                  onChangeText={(value) => update(result, { value })}
                  keyboardType="decimal-pad"
                />
              ) : null}
              {changed && draft.include ? (
                <AppText variant="caption" className="text-grafite">
                  ✎ Você corrigiu este valor. O lido no laudo fica guardado.
                </AppText>
              ) : null}
              <CheckboxRow
                label="Está no meu exame"
                checked={draft.include}
                onChange={(include) => update(result, { include })}
              />
            </View>
          );
        })}

        <FormError message={error} />
        <PrimaryButton
          label={`Confirmar ${includedCount} ${includedCount === 1 ? 'valor' : 'valores'}`}
          onPress={confirm}
          isLoading={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
