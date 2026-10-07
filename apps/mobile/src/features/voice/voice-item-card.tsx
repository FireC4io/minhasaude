import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useFoodsControllerSearch } from '@/api/generated/endpoints/foods/foods';
import type { FoodResponseDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { TextButton } from '@/components/ui/text-button';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { nutrientsFor } from '@/features/diary/food-math';
import { parseDecimal } from '@/features/forms/parse-decimal';

export interface VoiceDraft {
  key: string;
  spoken: string;
  countHint: number | null;
  grams: string;
  food: FoodResponseDto | null;
  include: boolean;
}

interface VoiceItemCardProps {
  draft: VoiceDraft;
  onChange: (draft: VoiceDraft) => void;
}

/**
 * Um item da frase, casado com um alimento da base (TACO / Open Food Facts).
 * A sugestão é só a primeira da busca — a pessoa confirma ou troca.
 */
export function VoiceItemCard({ draft, onChange }: VoiceItemCardProps) {
  const { t } = useTranslation();
  const search = useFoodsControllerSearch(
    { q: draft.spoken, limit: 5 },
    { query: { enabled: draft.spoken.trim().length >= 2 } },
  );
  const options = search.data?.data ?? [];
  const chosen = draft.food ?? options[0] ?? null;
  const kcal = chosen ? nutrientsFor(chosen, parseDecimal(draft.grams)).kcal : 0;

  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <AppText variant="caption" className="text-grafite-suave">
        {t('voice.youSaid', {
          text: `${draft.countHint ? `${draft.countHint} ` : ''}${draft.spoken}`,
        })}
      </AppText>

      {search.isPending && !draft.food ? (
        <AppText className="text-grafite-suave">Procurando na base de alimentos…</AppText>
      ) : chosen ? (
        <AppText variant="bodyStrong" className="text-grafite">
          {chosen.name}
        </AppText>
      ) : (
        <AppText className="text-grafite">
          {t('voice.itemNotFound')}
        </AppText>
      )}

      {options.length > 1 && draft.include ? (
        <View className="flex-row flex-wrap gap-x-4">
          {options
            .filter((option) => option.id !== chosen?.id)
            .slice(0, 3)
            .map((option) => (
              <TextButton
                key={option.id}
                label={t('voice.swap', { name: option.name })}
                onPress={() => onChange({ ...draft, food: option })}
                textVariant="caption"
                textClassName="text-mamao-forte"
              />
            ))}
        </View>
      ) : null}

      {chosen && draft.include ? (
        <>
          <AuthTextField
            label={t('voice.quantity')}
            value={draft.grams}
            onChangeText={(grams) => onChange({ ...draft, grams, food: chosen })}
            placeholder={
              draft.countHint ? t('voice.unitsHow', { count: draft.countHint }) : t('voice.placeholder')
            }
            keyboardType="decimal-pad"
          />
          {kcal > 0 ? (
            <AppText variant="number" className="text-grafite">
              {kcal} kcal
            </AppText>
          ) : null}
        </>
      ) : null}

      <CheckboxRow
        label={t('voice.include')}
        checked={draft.include}
        onChange={(include) => onChange({ ...draft, include, food: chosen })}
      />
    </View>
  );
}
