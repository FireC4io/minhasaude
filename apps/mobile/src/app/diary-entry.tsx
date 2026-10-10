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
import { useTranslation } from 'react-i18next';
import { INPUT_LIMITS } from '@minhasaude/shared';
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
  const { t } = useTranslation();
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
      setError(t('diary.quantityError'));
      return;
    }

    try {
      if (isEditing && params.id) {
        await updateEntry.mutateAsync({ id: params.id, data: { quantity: grams } });
        AccessibilityInfo.announceForAccessibility(t('diary.quantityUpdated'));
      } else {
        if (!selectedFood || !mealType) {
          setError(t('diary.chooseFood'));
          return;
        }
        await createEntry.mutateAsync({
          data: { foodId: selectedFood.id, date, mealType, quantity: grams, unit: DiaryQuantityUnit.grams },
        });
        // Anúncio antes de fechar: a confirmação do registro chega mesmo com a tela sumindo.
        AccessibilityInfo.announceForAccessibility(
          t('diary.added', { food: selectedFood.name, meal: MEAL_TYPE_LABELS[mealType].toLowerCase() }),
        );
      }
      await invalidateDay();
      router.back();
    } catch {
      setError(t('diary.saveError'));
    }
  }

  async function handleDelete() {
    if (!params.id) return;
    try {
      await removeEntry.mutateAsync({ id: params.id });
      AccessibilityInfo.announceForAccessibility(t('diary.removedAnnounce', { food: params.foodName ?? t('diary.food') }));
      await invalidateDay();
      router.back();
    } catch {
      setError(t('diary.removeError'));
    }
  }

  const isSaving = createEntry.isPending || updateEntry.isPending;
  const results = searchQuery.data?.data ?? [];
  const searchStatus = describeSearchStatus(searchTerm, searchQuery.isFetching, results.length);
  useAnnounce(searchStatus);
  const showSearch = !isEditing && !selectedFood;
  const isTyping = searchTerm.trim().length >= 2;
  const title = isEditing
    ? (params.foodName ?? t('diary.food'))
    : mealType
      ? MEAL_TYPE_LABELS[mealType]
      : t('diary.food');

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
              label={t('diary.search')}
              value={searchTerm}
              onChangeText={setSearchTerm}
              maxLength={INPUT_LIMITS.foodSearch}
              placeholder={t('misc.foodPlaceholder')}
              returnKeyType="search"
            />
            {searchQuery.isFetching ? <LoadingIndicator label={t('diary.searching')} /> : null}
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
                      {t('diary.recent')}
                    </AppText>
                  ) : (
                    <AppText className="text-grafite-suave">
                      {t('diary.searchHelp')}
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
                  accessibilityLabel={t('diary.chosen', { food: selectedFood.name })}
                  className="text-grafite">
                  {selectedFood.name}
                </AppText>
                <TextButton
                  label={t('diary.change')}
                  onPress={() => setSelectedFood(null)}
                  hint={t('diary.changeHint')}
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

            <PrimaryButton label={t('diary.save')} onPress={() => void handleSave()} isLoading={isSaving} />

            {isEditing ? (
              <TextButton
                label={t('diary.remove')}
                accessibilityLabel={t('diary.removeSpoken', { food: params.foodName ?? t('diary.food') })}
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
