import { View } from 'react-native';

import type { RangePosition, ReferenceRange } from './reference-range';

interface RangeBarProps {
  value: number;
  range: ReferenceRange;
  position: RangePosition;
}

/**
 * Faixa do laudo desenhada: trecho da referência em destaque e um marcador do
 * valor. Só reforça o texto ao lado — é escondida do leitor de tela.
 */
export function RangeBar({ value, range, position }: RangeBarProps) {
  // Faixa aberta ("Superior a 40") não tem teto: o trecho de referência vai até a borda da barra.
  const anchorLow = range.low ?? 0;
  const anchorHigh = range.high ?? (range.low ?? value) * 1.5;
  const span = Math.max(anchorHigh - anchorLow, 1);
  const min = Math.min(range.low === null ? 0 : anchorLow - span * 0.5, value);
  const max = Math.max(
    range.high === null ? Math.max(anchorHigh, value * 1.2) : anchorHigh + span * 0.5,
    value,
  );
  const bandStart = range.low ?? min;
  const bandEnd = range.high ?? max;
  const toPercent = (n: number) => `${Math.round(((n - min) / (max - min)) * 100)}%` as const;

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="h-4 justify-center">
      <View className="h-2 w-full rounded-full bg-linha" />
      <View
        className="absolute h-2 rounded-full bg-couve"
        style={{ left: toPercent(bandStart), width: toPercent(min + (bandEnd - bandStart)) }}
      />
      {/* Marcador em losango quando fora da faixa, círculo quando dentro: forma, não só cor. */}
      <View
        className={`absolute h-4 w-4 border-2 border-superficie ${
          position === 'within' ? 'rounded-full bg-grafite' : 'rotate-45 bg-jabuticaba'
        }`}
        style={{ left: toPercent(value), marginLeft: -8 }}
      />
    </View>
  );
}
