import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

import { formatExamValue } from './exam-labels';
import { markerInfo } from './marker-catalog';
import { RangeBar } from './range-bar';
import { describePosition, parseReferenceRange, positionInRange } from './reference-range';
import type { ExamResult } from './types';

interface ResultRowProps {
  result: ExamResult;
  onPress?: () => void;
}

/**
 * Um marcador revisado: valor, faixa do laudo e onde o valor fica nela.
 * O texto é informativo — "acima da faixa do laudo", nunca "alterado" ou "risco".
 */
export function ResultRow({ result, onPress }: ResultRowProps) {
  const info = markerInfo(result.markerCode);
  const value = result.confirmedValue ?? Number(result.rawValue.replace(',', '.'));
  const unit = result.confirmedUnit ?? result.rawUnit;
  const range = parseReferenceRange(result.rawReferenceRange);
  const position = positionInRange(value, range);
  const positionText = describePosition(position);
  const marker = position === 'within' ? '●' : position === 'unknown' ? '' : '◆';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${info.displayName}: ${formatExamValue(value)} ${unit}. ${positionText}${
        result.rawReferenceRange ? `: ${result.rawReferenceRange}` : ''
      }.`}
      accessibilityHint={onPress ? 'Mostra a evolução deste exame' : undefined}
      style={{ minHeight: MIN_TOUCH_TARGET }}
      className="gap-2 border-b border-linha py-3 active:opacity-70">
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-3">
        <AppText variant="bodyStrong" className="flex-shrink text-grafite">
          {info.displayName}
        </AppText>
        <AppText variant="number" className="text-grafite">
          {formatExamValue(value)} {unit}
        </AppText>
      </View>
      {range ? <RangeBar value={value} range={range} position={position} /> : null}
      <AppText variant="caption" className="text-grafite-suave">
        {marker ? `${marker} ` : ''}
        {positionText}
        {result.rawReferenceRange ? `: ${result.rawReferenceRange}` : ''}
      </AppText>
    </Pressable>
  );
}
