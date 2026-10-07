import { View } from 'react-native';

import { useBodyMeasurementsControllerList } from '@/api/generated/endpoints/body-measurements/body-measurements';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

import { formatKg } from './format-weight';
import { appLocale } from '@/i18n/format';

interface LastWeightCardProps {
  onRegister: () => void;
}

// Só registros manuais: fontes de bioimpedância não se misturam (CLAUDE.md).
const LIST_PARAMS = { source: 'manual', limit: 1 } as const;

/** Último peso registrado, com atalho para registrar outro. */
export function LastWeightCard({ onRegister }: LastWeightCardProps) {
  const query = useBodyMeasurementsControllerList(LIST_PARAMS);
  const last = query.data?.data[0];

  const when = last
    ? new Date(last.measuredAt).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long' })
    : null;

  return (
    <View className="gap-2 rounded-2xl bg-superficie p-4">
      <View
        accessible
        accessibilityLabel={
          last ? `Último peso: ${formatKg(last.weightKg)}, em ${when}` : 'Nenhum peso registrado ainda'
        }
        className="flex-row items-baseline justify-between">
        <AppText variant="label" className="text-grafite-suave">
          Peso
        </AppText>
        {last ? (
          <AppText variant="number" className="text-grafite">
            {formatKg(last.weightKg)}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" className="text-grafite">
        {last ? `Registrado em ${when}` : 'Nenhum peso registrado ainda.'}
      </AppText>
      <TextButton
        label="Registrar peso"
        onPress={onRegister}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
        className="self-start"
      />
    </View>
  );
}
