import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { FoodResponseDto, MealType } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { ModalHeader } from '@/components/ui/modal-header';
import { TextButton } from '@/components/ui/text-button';
import { PrimaryButton } from '@/features/auth/primary-button';
import { ChosenFoodHeader } from '@/features/diary/chosen-food-header';
import { CustomMeasureSection } from '@/features/diary/custom-measure-section';
import type { EntryAmount } from '@/features/diary/food-math';
import { FoodSearchPanel } from '@/features/diary/food-search-panel';
import { MEAL_TYPE_LABELS } from '@/features/diary/meal-type-labels';
import {
  GRAMS,
  defaultAmount,
  entryQuantity,
  gramsOf,
  measureFromEntry,
  type Measure,
  type PortionLike,
} from '@/features/diary/measures';
import { QuantityPicker } from '@/features/diary/quantity-picker';
import { useDiaryEntryActions } from '@/features/diary/use-diary-entry-actions';
import { useEditingEntry } from '@/features/diary/use-editing-entry';
import { useFoodMeasures } from '@/features/diary/use-food-measures';
import { parseDecimal } from '@/features/forms/parse-decimal';

type Params = { date: string; mealType?: string; id?: string; foodName?: string; quantity?: string };

/** Anotar um alimento numa refeição, ou mudar a quantidade/apagar uma anotação (com `id`). */
export default function DiaryEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { date, id } = params;
  const mealType = params.mealType as MealType | undefined;
  const foodName = params.foodName ?? t('diary.food');

  const [selectedFood, setSelectedFood] = useState<FoodResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(params.quantity ? String(Number(params.quantity)) : '100');
  const [measure, setMeasure] = useState<Measure>(GRAMS);
  const [error, setError] = useState<string | null>(null);

  const showAmount = useCallback((next: { measure: Measure; amount: number }) => {
    setMeasure(next.measure);
    setQuantity(String(next.amount));
  }, []);
  const editingEntry = useEditingEntry(date, id, showAmount);
  const foodId = selectedFood?.id ?? editingEntry?.foodId;
  const { measures } = useFoodMeasures(foodId);
  const actions = useDiaryEntryActions(date);

  function chooseFood(food: FoodResponseDto, last?: EntryAmount<PortionLike>) {
    setSelectedFood(food);
    showAmount(last ? measureFromEntry(last) : { measure: GRAMS, amount: defaultAmount(GRAMS) });
  }

  async function handleSave() {
    setError(null);
    const amount = parseDecimal(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(measure.type === 'portion' ? t('portions.amountError') : t('diary.quantityError'));
      return;
    }
    if (!id && (!selectedFood || !mealType)) {
      setError(t('diary.chooseFood'));
      return;
    }
    const amountData = entryQuantity(measure, amount);
    try {
      if (id) {
        await actions.update(id, amountData);
      } else if (selectedFood && mealType) {
        // Sem internet a anotação fica guardada no aparelho e vai sozinha depois.
        await actions.create(selectedFood, mealType, amountData, measure.type === 'portion' ? measure.portion : null);
      }
      router.back();
    } catch {
      setError(t('diary.saveError'));
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await actions.remove(id, foodName);
      router.back();
    } catch {
      setError(t('diary.removeError'));
    }
  }

  const mealTitle = mealType ? MEAL_TYPE_LABELS[mealType] : t('diary.food');
  const title = id ? foodName : mealTitle;

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 gap-4 px-6 pt-4">
        <ModalHeader title={title} />

        {!id && !selectedFood ? (
          <FoodSearchPanel date={date} searchTerm={searchTerm} onSearchChange={setSearchTerm} onChoose={chooseFood} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-8">
            {selectedFood ? <ChosenFoodHeader food={selectedFood} onChange={() => setSelectedFood(null)} /> : null}

            <QuantityPicker
              food={selectedFood ?? editingEntry?.food ?? null}
              measures={measures}
              measure={measure}
              onMeasureChange={(next) => showAmount({ measure: next, amount: defaultAmount(next) })}
              value={quantity}
              onChange={setQuantity}
              onSubmit={() => void handleSave()}
            />

            {foodId ? (
              <CustomMeasureSection
                foodId={foodId}
                measure={measure}
                onCreated={(portion) => showAmount({ measure: { type: 'portion', portion }, amount: 1 })}
                onDeleted={() => {
                  const grams = gramsOf(measure, parseDecimal(quantity));
                  showAmount({ measure: GRAMS, amount: grams > 0 ? grams : defaultAmount(GRAMS) });
                }}
              />
            ) : null}

            <FormError message={error} />

            <PrimaryButton label={t('diary.save')} onPress={() => void handleSave()} isLoading={actions.isSaving} />

            {id ? (
              <TextButton
                label={t('diary.remove')}
                accessibilityLabel={t('diary.removeSpoken', { food: foodName })}
                onPress={() => void handleDelete()}
                busy={actions.isRemoving}
                className="items-center"
                textVariant="bodyStrong"
                textClassName="text-center text-jabuticaba"
              />
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
