import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getDiaryControllerGetByDateQueryKey,
  useDiaryControllerCreate,
  useDiaryControllerRemove,
  useDiaryControllerUpdate,
} from '@/api/generated/endpoints/diary/diary';
import { useFoodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import { DiaryQuantityUnit, type FoodResponseDto, type MealType } from '@/api/generated/models';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { MEAL_TYPE_LABELS } from '@/features/diary/meal-type-labels';

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
    const quantityNumber = Number(quantity.replace(',', '.'));
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
  const showSearch = !isEditing && !selectedFood;

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-4 px-6 pt-4">
        <Text className="text-2xl font-semibold text-grafite">
          {isEditing ? params.foodName : mealType ? MEAL_TYPE_LABELS[mealType] : 'Alimento'}
        </Text>

        {showSearch ? (
          <View className="flex-1 gap-3">
            <AuthTextField
              testID="diary-food-search"
              label="Buscar alimento"
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="ex: arroz branco"
            />
            {searchQuery.isFetching ? <ActivityIndicator /> : null}
            <FlatList
              data={searchQuery.data?.data ?? []}
              keyExtractor={(food) => food.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedFood(item)}
                  className="border-b border-grafite py-3">
                  <Text className="text-base text-grafite">{item.name}</Text>
                  {item.brand ? <Text className="text-xs text-grafite">{item.brand}</Text> : null}
                </Pressable>
              )}
              ListEmptyComponent={
                searchTerm.trim().length >= 2 && !searchQuery.isFetching ? (
                  <Text className="text-sm text-grafite">Nenhum alimento encontrado.</Text>
                ) : null
              }
            />
          </View>
        ) : (
          <View className="gap-4">
            {!isEditing && selectedFood ? (
              <View className="gap-1">
                <Text className="text-base font-semibold text-grafite">{selectedFood.name}</Text>
                <Pressable onPress={() => setSelectedFood(null)}>
                  <Text className="text-sm text-mamao">Trocar alimento</Text>
                </Pressable>
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

            {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}

            <PrimaryButton label="Salvar" onPress={() => void handleSave()} isLoading={isSaving} />

            {isEditing ? (
              <Pressable onPress={() => void handleDelete()} disabled={removeEntry.isPending}>
                <Text className="text-center text-sm text-jabuticaba">Remover entrada</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
