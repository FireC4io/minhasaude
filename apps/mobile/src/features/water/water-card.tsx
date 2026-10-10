import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { PreviewTag } from '@/components/ui/preview-tag';
import { TextButton } from '@/components/ui/text-button';
import { spokenMl } from '@/features/accessibility/spoken-format';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { usePreviewValue } from '@/features/preview/preview-store';

import {
  DEFAULT_WATER_GOAL_ML,
  GLASS_ML,
  WATER_SHORTCUTS_ML,
  formatMl,
  glassesFilled,
  spokenWater,
} from './water-math';

interface WaterCardProps {
  date: string;
  onOpenDetails: () => void;
}

/** Copo desenhado com Views: cheio, ou só o contorno. */
function Glass({ full }: { full: boolean }) {
  return (
    <View className="h-9 w-6 justify-end overflow-hidden rounded-b-lg rounded-t-sm border-2 border-maracuja-forte">
      {full ? <View className="h-full w-full bg-maracuja" /> : null}
    </View>
  );
}

/** Água do dia (prévia — sem API ainda, valores só na memória). */
export function WaterCard({ date, onOpenDetails }: WaterCardProps) {
  const { t } = useTranslation();
  const [totalMl, setTotalMl] = usePreviewValue(`water:${date}`, 0);
  const [goalMl] = usePreviewValue('water:goal', DEFAULT_WATER_GOAL_ML);
  const [lastAdded, setLastAdded] = usePreviewValue<string | null>('water:announce', null);
  useAnnounce(lastAdded);

  const glassesDrawn = Math.max(1, Math.round(goalMl / GLASS_ML));
  const filled = glassesFilled(totalMl, glassesDrawn);

  function add(ml: number) {
    const next = totalMl + ml;
    setTotalMl(next);
    setLastAdded(`${t('water.added', { amount: spokenMl(ml) })} ${spokenWater(next, goalMl)}`);
  }

  return (
    <View className="gap-3 rounded-2xl bg-superficie p-4">
      <View
        accessible
        accessibilityLabel={t('water.previewSpoken', { water: spokenWater(totalMl, goalMl) })}
        className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-center gap-2">
            <AppText variant="label" className="text-grafite-suave">
              {t('water.title')}
            </AppText>
            <PreviewTag />
          </View>
          <AppText variant="number" className="text-grafite">
            {formatMl(totalMl)} / {formatMl(goalMl)}
          </AppText>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {Array.from({ length: glassesDrawn }, (_, index) => (
            <Glass key={index} full={index < filled} />
          ))}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-4">
        {WATER_SHORTCUTS_ML.map((ml) => (
          <TextButton
            key={ml}
            label={`+ ${formatMl(ml)}`}
            accessibilityLabel={t('water.addSpoken', { amount: spokenMl(ml) })}
            onPress={() => add(ml)}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
          />
        ))}
        <TextButton
          label={t('water.other')}
          onPress={onOpenDetails}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
        />
      </View>
    </View>
  );
}
