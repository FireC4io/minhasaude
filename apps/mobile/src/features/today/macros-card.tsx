import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MacroTotalsDto } from '@/api/generated/models';
import { AppText } from '@/components/ui/app-text';
import { SelectChips } from '@/features/onboarding/select-chips';

import { loadMacroMode, saveMacroMode } from './macro-mode-preference';
import { translatedLabels } from '@/i18n/labels';

import { macroValue, progressFraction, type MacroDisplayMode } from './progress-math';

const MODES = ['remaining', 'consumed', 'percent'] as const;
const MODE_LABELS: Record<MacroDisplayMode, string> = translatedLabels({
  remaining: 'today.modes.remaining',
  consumed: 'today.modes.consumed',
  percent: 'today.modes.percent',
});

// Nomes por extenso: "Carbo" confundia (F4-12).
const MACROS = [
  { key: 'proteinG', labelKey: 'today.protein' },
  { key: 'fatG', labelKey: 'today.fat' },
  { key: 'carbG', labelKey: 'today.carbs' },
] as const;

interface MacrosCardProps {
  consumed: MacroTotalsDto;
  target: MacroTotalsDto | null;
}

/**
 * Macros em linhas empilhadas (nunca três colunas lado a lado: com fonte em
 * 200% elas se atropelavam — achado #2) e com o modo de exibição escolhido.
 */
export function MacrosCard({ consumed, target }: MacrosCardProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<MacroDisplayMode>('remaining');

  useEffect(() => {
    void loadMacroMode().then(setMode);
  }, []);

  function chooseMode(next: MacroDisplayMode) {
    setMode(next);
    void saveMacroMode(next);
  }

  return (
    <View className="gap-4 rounded-2xl bg-superficie p-4">
      <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
        {t('today.nutrients')}
      </AppText>

      {MACROS.map(({ key, labelKey }) => {
        const label = t(labelKey);
        const targetG = target ? target[key] : null;
        const value = macroValue(mode, consumed[key], targetG);
        const fraction = progressFraction(consumed[key], targetG);
        return (
          <View key={key} accessible accessibilityLabel={`${label}: ${value}`} className="gap-1">
            <View className="flex-row flex-wrap items-baseline justify-between gap-x-3">
              <AppText className="text-grafite">{label}</AppText>
              <AppText variant="number" className="text-grafite">
                {value}
              </AppText>
            </View>
            {targetG ? (
              <View className="h-2 overflow-hidden rounded-full bg-linha">
                <View
                  className="h-2 rounded-full bg-couve"
                  style={{ width: `${Math.round(fraction * 100)}%` }}
                />
              </View>
            ) : null}
          </View>
        );
      })}

      {target ? (
        <SelectChips
          label={t('today.show')}
          options={MODES}
          optionLabels={MODE_LABELS}
          value={mode}
          onChange={chooseMode}
        />
      ) : null}
    </View>
  );
}
