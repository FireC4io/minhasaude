import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCreate,
  useDiaryControllerGetByDate,
  useDiaryControllerRemove,
  useDiaryControllerUpdate,
} from '@/api/generated/endpoints/diary/diary';
import { useFoodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import { DiaryQuantityUnit, type FoodResponseDto, type MealType } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ModalHeader } from '@/components/ui/modal-header';
import { TextButton } from '@/components/ui/text-button';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { describeSearchStatus } from '@/features/diary/accessibility-labels';
import { FoodResultRow } from '@/features/diary/food-result-row';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/features/diary/meal-type-labels';
import { QuantityPicker } from '@/features/diary/quantity-picker';
import { useRecentFoods } from '@/features/diary/use-recent-foods';
import { parseDecimal } from '@/features/forms/parse-decimal';

export default function DiaryEntryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    date: string;
    mealType?: string;
    id?: string;
    foodName?: string;
    quantity?: string;
  }>();
  const isEditing = Boolean(params.id);
  const date = params.date;
  const mealType = params.mealType as MealType | undefined;

  const [selectedFood, setSelectedFood] = useState<FoodResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(params.quantity ? String(Number(params.quantity)) : '100');
  const [error, setError] = useState<string | null>(null);

  const searchQuery = useFoodsControllerSearch(
    { q: searchTerm, limit: 20 },
    { query: { enabled: searchTerm.trim().length >= 2 } },
  );
  const { recents } = useRecentFoods(date);
  // Na edição, o alimento vem do dia já em cache — para a conta de calorias.
  const dayQuery = useDiaryControllerGetByDate({ date }, { query: { enabled: isEditing } });
  const editingEntry = isEditing
    ? MEAL_TYPE_ORDER.flatMap((meal) => dayQuery.data?.meals[meal] ?? []).find(
        (entry) => entry.id === params.id,
      )
    : undefined;

  const createEntry = useDiaryControllerCreate();
  const updateEntry = useDiaryControllerUpdate();
  const removeEntry = useDiaryControllerRemove();

  function invalidateDay() {
    return queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey({ date }) });
  }

  function chooseFood(food: FoodResponseDto, lastQuantity?: number) {
    setSelectedFood(food);
    if (lastQuantity) setQuantity(String(lastQuantity));
  }

  async function handleSave() {
    setError(null);
    const grams = parseDecimal(quantity);
    if (!Number.isFinite(grams) || grams <= 0) {
      setError('Digite a quantidade em gramas, por exemplo 100.');
      return;
    }

    try {
      if (isEditing && params.id) {
        await updateEntry.mutateAsync({ id: params.id, data: { quantity: grams } });
        AccessibilityInfo.announceForAccessibility('Quantidade atualizada.');
      } else {
        if (!selectedFood || !mealType) {
          setError('Escolha um alimento na lista.');
          return;
        }
        await createEntry.mutateAsync({
          data: { foodId: selectedFood.id, date, mealType, quantity: grams, unit: DiaryQuantityUnit.grams },
        });
        // Anúncio antes de fechar: a confirmação do registro chega mesmo com a tela sumindo.
        AccessibilityInfo.announceForAccessibility(
          `${selectedFood.name} adicionado ao ${MEAL_TYPE_LABELS[mealType].toLowerCase()}.`,
        );
      }
      await invalidateDay();
      router.back();
    } catch {
      setError('Não foi possível salvar. Confira sua internet e tente de novo.');
    }
  }

  async function handleDelete() {
    if (!params.id) return;
    try {
      await removeEntry.mutateAsync({ id: params.id });
      AccessibilityInfo.announceForAccessibility(`${params.foodName ?? 'Alimento'} removido.`);
      await invalidateDay();
      router.back();
    } catch {
      setError('Não foi possível remover. Confira sua internet e tente de novo.');
    }
  }

  const isSaving = createEntry.isPending || updateEntry.isPending;
  const results = searchQuery.data?.data ?? [];
  const searchStatus = describeSearchStatus(searchTerm, searchQuery.isFetching, results.length);
  useAnnounce(searchStatus);
  const showSearch = !isEditing && !selectedFood;
  const isTyping = searchTerm.trim().length >= 2;
  const title = isEditing ? (params.foodName ?? 'Alimento') : mealType ? MEAL_TYPE_LABELS[mealType] : 'Alimento';

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-4 px-6 pt-4">
        <ModalHeader title={title} />

        {showSearch ? (
          <View className="flex-1 gap-3">
            <AuthTextField
              testID="diary-food-search"
              label="Buscar alimento"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="ex.: arroz branco"
              returnKeyType="search"
            />
            {searchQuery.isFetching ? <LoadingIndicator label="Buscando alimentos" /> : null}
            {/* Visível e com liveRegion: quem usa leitor de tela fica sabendo
                que a busca terminou, e quantos resultados vieram. */}
            {searchStatus ? (
              <AppText variant="caption" accessibilityLiveRegion="polite" className="text-grafite">
                {searchStatus}
              </AppText>
            ) : null}

            {isTyping ? (
              <FlatList
                data={results}
                keyExtractor={(food) => food.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => <FoodResultRow food={item} onPress={() => chooseFood(item)} />}
              />
            ) : (
              <FlatList
                data={recents}
                keyExtractor={(recent) => recent.food.id}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  recents.length > 0 ? (
                    <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
                      Registrados recentemente
                    </AppText>
                  ) : (
                    <AppText className="text-grafite-suave">
                      Digite pelo menos 2 letras do alimento. Os que você registrar vão aparecer aqui
                      para escolher com um toque.
                    </AppText>
                  )
                }
                renderItem={({ item }) => (
                  <FoodResultRow
                    food={item.food}
                    lastQuantity={item.lastQuantity}
                    onPress={() => chooseFood(item.food, item.lastQuantity)}
                  />
                )}
              />
            )}
          </View>
        ) : (
          <View className="gap-4">
            {!isEditing && selectedFood ? (
              <View className="gap-1">
                <AppText
                  variant="bodyStrong"
                  accessibilityLabel={`Alimento escolhido: ${selectedFood.name}`}
                  className="text-grafite">
                  {selectedFood.name}
                </AppText>
                <TextButton
                  label="Trocar alimento"
                  onPress={() => setSelectedFood(null)}
                  hint="Volta para a busca"
                  className="self-start"
                  textClassName="text-mamao-forte"
                />
              </View>
            ) : null}

            <QuantityPicker
              food={selectedFood ?? editingEntry?.food ?? null}
              value={quantity}
              onChange={setQuantity}
              onSubmit={() => void handleSave()}
            />

            <FormError message={error} />

            <PrimaryButton label="Salvar" onPress={() => void handleSave()} isLoading={isSaving} />

            {isEditing ? (
              <TextButton
                label="Remover do diário"
                accessibilityLabel={`Remover ${params.foodName ?? 'alimento'} do diário`}
                onPress={() => void handleDelete()}
                busy={removeEntry.isPending}
                className="items-center"
                textVariant="bodyStrong"
                textClassName="text-center text-jabuticaba"
              />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
