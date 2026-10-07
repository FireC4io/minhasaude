import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCreate,
  useDiaryControllerRemove,
  useDiaryControllerUpdate,
} from '@/api/generated/endpoints/diary/diary';
import { useFoodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import { DiaryQuantityUnit, type FoodResponseDto, type MealType } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { TextButton } from '@/components/ui/text-button';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { describeSearchStatus } from '@/features/diary/accessibility-labels';
import { MEAL_TYPE_LABELS } from '@/features/diary/meal-type-labels';
import { parseDecimal } from '@/features/forms/parse-decimal';
import { AppText } from '@/components/ui/app-text';

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
  const [quantity, setQuantity] = useState(params.quantity ?? '100');
  const [error, setError] = useState<string | null>(null);

  const searchQuery = useFoodsControllerSearch(
    { q: searchTerm, limit: 20 },
    { query: { enabled: searchTerm.trim().length >= 2 } },
  );

  const createEntry = useDiaryControllerCreate();
  const updateEntry = useDiaryControllerUpdate();
  const removeEntry = useDiaryControllerRemove();

  function invalidateDay() {
    return queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey({ date }) });
  }

  async function handleSave() {
    setError(null);
    const quantityNumber = parseDecimal(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError('Informe uma quantidade válida em gramas.');
      return;
    }

    try {
      if (isEditing && params.id) {
        await updateEntry.mutateAsync({ id: params.id, data: { quantity: quantityNumber } });
      } else {
        if (!selectedFood || !mealType) {
          setError('Escolha um alimento.');
          return;
        }
        await createEntry.mutateAsync({
          data: {
            foodId: selectedFood.id,
            date,
            mealType,
            quantity: quantityNumber,
            unit: DiaryQuantityUnit.grams,
          },
        });
      }
      await invalidateDay();
      router.back();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  }

  async function handleDelete() {
    if (!params.id) return;
    try {
      await removeEntry.mutateAsync({ id: params.id });
      await invalidateDay();
      router.back();
    } catch {
      setError('Não foi possível remover. Tente de novo.');
    }
  }

  const isSaving = createEntry.isPending || updateEntry.isPending;
  const results = searchQuery.data?.data ?? [];
  const searchStatus = describeSearchStatus(searchTerm, searchQuery.isFetching, results.length);
  useAnnounce(searchStatus);
  const showSearch = !isEditing && !selectedFood;

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-4 px-6 pt-4">
        <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
          {isEditing ? params.foodName : mealType ? MEAL_TYPE_LABELS[mealType] : 'Alimento'}
        </AppText>

        {showSearch ? (
          <View className="flex-1 gap-3">
            <AuthTextField
              testID="diary-food-search"
              label="Buscar alimento"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="ex: arroz branco"
            />
            {searchQuery.isFetching ? <LoadingIndicator label="Buscando alimentos" /> : null}
            {/* Visível e com liveRegion: quem usa leitor de tela fica sabendo
                que a busca terminou, e quantos resultados vieram. */}
            {searchStatus ? (
              <AppText variant="caption" accessibilityLiveRegion="polite" className="text-grafite">
                {searchStatus}
              </AppText>
            ) : null}
            <FlatList
              data={results}
              keyExtractor={(food) => food.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedFood(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.brand ? `${item.name}, ${item.brand}` : item.name}
                  accessibilityHint="Escolhe este alimento"
                  style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
                  className="border-b border-grafite py-3">
                  <AppText className="text-grafite">{item.name}</AppText>
                  {item.brand ? <AppText variant="caption" className="text-grafite">{item.brand}</AppText> : null}
                </Pressable>
              )}
            />
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
                  textVariant="caption"
                  textClassName="text-mamao-forte"
                />
              </View>
            ) : null}

            <AuthTextField
              testID="diary-quantity"
              label="Quantidade (g)"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="100"
              keyboardType="decimal-pad"
            />

            <FormError message={error} />

            <PrimaryButton label="Salvar" onPress={() => void handleSave()} isLoading={isSaving} />

            {isEditing ? (
              <TextButton
                label="Remover entrada"
                accessibilityLabel={`Remover ${params.foodName ?? 'entrada'} do diário`}
                onPress={() => void handleDelete()}
                busy={removeEntry.isPending}
                className="items-center"
                textVariant="caption"
                textClassName="text-center text-jabuticaba"
              />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
