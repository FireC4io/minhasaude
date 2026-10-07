import { View } from 'react-native';
import type { MacroTotalsDto } from '@/api/generated/models';
import { describeMacroSummary } from './accessibility-labels';
import { AppText } from '@/components/ui/app-text';

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
      <AppText variant="caption" className="text-grafite">{label}</AppText>
      <AppText variant="number" className="text-grafite">
        {round(valueG)}g{targetG !== undefined ? ` / ${round(targetG)}g` : ''}
      </AppText>
    </View>
  );
}

export function MacroSummary({ consumed, target, remaining }: MacroSummaryProps) {
  return (
    // Uma parada só, com frase completa: sem isto o leitor lia oito textos
    // soltos ("Proteína", "50g / 120g"...) e "g" era soletrado.
    <View
      accessible
      accessibilityLabel={describeMacroSummary(consumed, target, remaining)}
      className="gap-3 rounded-2xl border border-grafite bg-superficie p-4">
      <View className="gap-1">
        <AppText variant="numberLarge" className="text-grafite">
          {round(consumed.kcal)} kcal{target ? ` de ${round(target.kcal)}` : ' consumidas'}
        </AppText>
        {remaining ? (
          <AppText variant="caption" className="text-grafite">{round(remaining.kcal)} kcal restantes</AppText>
        ) : (
          <AppText variant="caption" className="italic text-grafite">
            Calcule sua meta para ver quanto ainda falta.
          </AppText>
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
