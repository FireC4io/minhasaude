import { useColorScheme, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { GotaVitalColors } from '@/constants/gota-vital-colors';

import { caloriesStatus, progressFraction } from './progress-math';

interface CaloriesCardProps {
  consumedKcal: number;
  targetKcal: number | null;
}

const SIZE = 96;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Calorias do dia com anel de progresso. O anel só reforça; o texto diz tudo. */
export function CaloriesCard({ consumedKcal, targetKcal }: CaloriesCardProps) {
  const colors = GotaVitalColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const fraction = progressFraction(consumedKcal, targetKcal);
  const consumed = Math.round(consumedKcal);
  const status = caloriesStatus(consumedKcal, targetKcal);
  const spokenTarget = targetKcal ? ` de uma meta de ${Math.round(targetKcal)}` : '';

  return (
    <View
      accessible
      accessibilityLabel={`Calorias: ${consumed} quilocalorias consumidas${spokenTarget}. ${status}.`}
      className="flex-row items-center gap-4 rounded-2xl bg-superficie p-4">
      <Svg width={SIZE} height={SIZE} accessibilityElementsHidden importantForAccessibility="no">
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.linha}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.mamaoForte}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View className="flex-1 gap-1">
        <AppText variant="label" className="text-grafite-suave">
          Calorias
        </AppText>
        <AppText variant="numberLarge" className="text-grafite">
          {consumed}
          {targetKcal ? ` / ${Math.round(targetKcal)}` : ''}
        </AppText>
        <AppText variant="caption" className="text-grafite">
          {status}
        </AppText>
      </View>
    </View>
  );
}
