import { Text, View } from 'react-native';
import type { MacroTotalsDto } from '@/api/generated/models';

interface MacroSummaryProps {
  consumed: MacroTotalsDto;
  target: MacroTotalsDto | null;
  remaining: MacroTotalsDto | null;
}

function round(value: number): number {
  return Math.round(value);
}

function MacroColumn({ label, valueG, targetG }: { label: string; valueG: number; targetG?: number }) {
  return (
    <View className="items-center gap-0.5">
      <Text className="text-xs text-grafite">{label}</Text>
      <Text className="text-base font-semibold text-grafite">
        {round(valueG)}g{targetG !== undefined ? ` / ${round(targetG)}g` : ''}
      </Text>
    </View>
  );
}

export function MacroSummary({ consumed, target, remaining }: MacroSummaryProps) {
  return (
    <View className="gap-3 rounded-2xl border border-grafite bg-white p-4">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-grafite">
          {round(consumed.kcal)} kcal{target ? ` de ${round(target.kcal)}` : ' consumidas'}
        </Text>
        {remaining ? (
          <Text className="text-sm text-grafite">{round(remaining.kcal)} kcal restantes hoje</Text>
        ) : (
          <Text className="text-sm italic text-grafite">
            Calcule sua meta para ver quanto ainda falta.
          </Text>
        )}
      </View>
      <View className="flex-row justify-between">
        <MacroColumn label="Proteína" valueG={consumed.proteinG} targetG={target?.proteinG} />
        <MacroColumn label="Gordura" valueG={consumed.fatG} targetG={target?.fatG} />
        <MacroColumn label="Carbo" valueG={consumed.carbG} targetG={target?.carbG} />
      </View>
    </View>
  );
}
