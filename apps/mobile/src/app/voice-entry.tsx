import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCreate,
} from '@/api/generated/endpoints/diary/diary';
import { foodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import { DiaryQuantityUnit, type MealType } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { ModalHeader } from '@/components/ui/modal-header';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { todayIsoDate } from '@/features/diary/date-utils';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { SelectChips } from '@/features/onboarding/select-chips';
import { mealForHour } from '@/features/today/meal-for-hour';
import { parseMealPhrase } from '@/features/voice/parse-meal-phrase';
import { useMealRecorder } from '@/features/voice/use-meal-recorder';
import { VoiceItemCard, type VoiceDraft } from '@/features/voice/voice-item-card';

/** Frase de exemplo enquanto a transcrição por IA não existe (prévia). */
const DEMO_TRANSCRIPT = '150 gramas de arroz, 100 gramas de feijão e um bife';

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Registro por voz (pedido no vídeo de referência, 09:42). A pessoa fala ou
 * digita a refeição; a frase vira itens; cada item é casado com um alimento
 * da base e **revisado antes de salvar** — a estimativa nunca entra sozinha.
 */
export default function VoiceEntryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayIsoDate();
  const recorder = useMealRecorder();
  const createEntry = useDiaryControllerCreate();

  const [phrase, setPhrase] = useState('');
  const [meal, setMeal] = useState<MealType>(mealForHour(new Date().getHours()));
  const [drafts, setDrafts] = useState<VoiceDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function stopRecording() {
    await recorder.stop();
    // Sem a IA, a prévia preenche uma frase de exemplo que a pessoa pode editar.
    setPhrase(DEMO_TRANSCRIPT);
  }

  function interpret() {
    setError(null);
    const items = parseMealPhrase(phrase);
    if (items.length === 0) {
      setError('Não entendemos nenhum alimento. Tente algo como “150 gramas de arroz e um bife”.');
      return;
    }
    setDrafts(
      items.map((item, index) => ({
        key: `${index}-${item.foodName}`,
        spoken: item.foodName,
        countHint: item.count,
        grams: item.grams ? String(item.grams) : '',
        food: null,
        include: true,
      })),
    );
  }

  async function save() {
    if (!drafts) return;
    setError(null);
    const chosen = drafts.filter((draft) => draft.include);
    const missingGrams = chosen.find((draft) => !(parseDecimal(draft.grams) > 0));
    if (missingGrams) {
      setError(`Falta a quantidade em gramas de “${missingGrams.spoken}”, ou desmarque o item.`);
      return;
    }
    setSaving(true);
    try {
      for (const draft of chosen) {
        // Sem troca explícita, vale a mesma primeira sugestão que o card mostra.
        const food =
          draft.food ?? (await foodsControllerSearch({ q: draft.spoken, limit: 5 })).data[0];
        if (!food) {
          setError(
            `Não achamos “${draft.spoken}” na base. Desmarque o item e adicione pela busca.`,
          );
          return;
        }
        await createEntry.mutateAsync({
          data: {
            foodId: food.id,
            date,
            mealType: meal,
            quantity: parseDecimal(draft.grams),
            unit: DiaryQuantityUnit.grams,
          },
        });
      }
      await queryClient.invalidateQueries({
        queryKey: getDiaryControllerGetByDateQueryKey({ date }),
      });
      AccessibilityInfo.announceForAccessibility(
        `${chosen.length} ${chosen.length === 1 ? 'alimento adicionado' : 'alimentos adicionados'} ao ${MEAL_TYPE_LABELS[meal].toLowerCase()}.`,
      );
      router.back();
    } catch {
      setError('Não foi possível salvar tudo. Confira sua internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerClassName="gap-6 px-6 py-6" keyboardShouldPersistTaps="handled">
          <ModalHeader title="Falar o que comeu" />
          <PreviewBanner missing="A transcrição por inteligência artificial ainda não existe: depois de gravar, aparece uma frase de exemplo, que você pode trocar pelo que comeu." />

          {drafts === null ? (
            <>
              <View className="items-center gap-3">
                <Pressable
                  onPress={() =>
                    void (recorder.state === 'recording' ? stopRecording() : recorder.start())
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    recorder.state === 'recording' ? 'Parar de gravar' : 'Gravar o que comeu'
                  }
                  accessibilityState={{ busy: recorder.state === 'recording' }}
                  style={{ width: 112, height: 112 }}
                  className={`items-center justify-center rounded-full active:opacity-80 ${
                    recorder.state === 'recording' ? 'bg-jabuticaba' : 'bg-mamao-forte'
                  }`}>
                  {recorder.state === 'recording' ? (
                    <View className="h-9 w-9 rounded-md bg-areia" />
                  ) : (
                    // Microfone desenhado com Views: cápsula, haste e base.
                    <View className="items-center">
                      <View className="h-11 w-7 rounded-full bg-areia" />
                      <View className="h-3 w-1.5 bg-areia" />
                      <View className="h-1.5 w-8 rounded-full bg-areia" />
                    </View>
                  )}
                </Pressable>
                <AppText
                  variant="bodyStrong"
                  accessibilityLiveRegion="polite"
                  className="text-grafite">
                  {recorder.state === 'recording'
                    ? `Gravando… ${formatTime(recorder.seconds)} · toque para parar`
                    : 'Toque e diga o que comeu'}
                </AppText>
                <AppText variant="caption" className="text-center text-grafite-suave">
                  Exemplo: “150 gramas de arroz, 100 gramas de feijão e um bife”.
                </AppText>
              </View>

              {recorder.state === 'denied' ? (
                <FormError message="Sem permissão para o microfone. Libere nas configurações do celular, ou digite abaixo." />
              ) : null}

              <AuthTextField
                label="Ou digite o que comeu"
                value={phrase}
                onChangeText={setPhrase}
                placeholder="ex.: duas bananas e um iogurte"
                multiline
                returnKeyType="done"
              />
              <SelectChips
                label="Em qual refeição?"
                options={MEAL_TYPE_ORDER}
                optionLabels={MEAL_TYPE_LABELS}
                value={meal}
                onChange={setMeal}
              />
              <FormError message={error} />
              <PrimaryButton
                label="Continuar"
                disabled={phrase.trim().length === 0}
                onPress={interpret}
                isLoading={false}
              />
            </>
          ) : (
            <>
              <AppText className="text-grafite">
                Confira cada item antes de salvar no {MEAL_TYPE_LABELS[meal].toLowerCase()}. A
                quantidade é sempre sua: o app não adivinha porções.
              </AppText>
              {drafts.map((draft) => (
                <VoiceItemCard
                  key={draft.key}
                  draft={draft}
                  onChange={(next) =>
                    setDrafts(drafts.map((item) => (item.key === next.key ? next : item)))
                  }
                />
              ))}
              <FormError message={error} />
              <PrimaryButton
                label="Salvar no diário"
                onPress={() => void save()}
                isLoading={saving}
              />
              <PrimaryButton
                label="Voltar e falar de novo"
                onPress={() => setDrafts(null)}
                isLoading={false}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
