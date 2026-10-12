import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getDiaryControllerGetByDateQueryKey } from '@/api/generated/endpoints/diary/diary';
import {
  getPortionsControllerListQueryKey,
  usePortionsControllerRemove,
} from '@/api/generated/endpoints/foods/foods';
import type { PortionResponseDto } from '@/api/generated/models';
import { FormError } from '@/components/ui/form-error';
import { TextButton } from '@/components/ui/text-button';

import { CustomMeasureForm } from './custom-measure-form';
import type { Measure } from './measures';

interface CustomMeasureSectionProps {
  foodId: string;
  measure: Measure;
  onCreated: (portion: PortionResponseDto) => void;
  /** Depois de apagar a medida escolhida, a tela volta para gramas. */
  onDeleted: () => void;
}

/** "Criar minha medida" e, se a escolhida for da pessoa, "Apagar esta medida". */
export function CustomMeasureSection({ foodId, measure, onCreated, onDeleted }: Readonly<CustomMeasureSectionProps>) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const removePortion = usePortionsControllerRemove();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ownPortion = measure.type === 'portion' && measure.portion.custom ? measure.portion : null;

  async function handleDelete() {
    if (!ownPortion) return;
    setError(null);
    try {
      await removePortion.mutateAsync({ id: ownPortion.id });
      // A API passou para gramas o que foi anotado com ela: os dias em cache mudaram.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getPortionsControllerListQueryKey(foodId) }),
        queryClient.invalidateQueries({ queryKey: getDiaryControllerGetByDateQueryKey() }),
      ]);
      AccessibilityInfo.announceForAccessibility(t('portions.customDeleted'));
      onDeleted();
    } catch {
      setError(t('portions.customDeleteError'));
    }
  }

  if (isCreating) {
    return (
      <CustomMeasureForm
        foodId={foodId}
        onCreated={(portion) => {
          setIsCreating(false);
          onCreated(portion);
        }}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <View className="gap-1">
      <TextButton
        label={t('portions.custom')}
        hint={t('portions.customHint')}
        onPress={() => setIsCreating(true)}
        className="self-start"
        textClassName="text-mamao-forte"
      />
      {ownPortion ? (
        <TextButton
          label={t('portions.customDelete')}
          onPress={() => void handleDelete()}
          busy={removePortion.isPending}
          className="self-start"
          textClassName="text-jabuticaba"
        />
      ) : null}
      <FormError message={error} />
    </View>
  );
}
