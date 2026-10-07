import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { SelectChips } from '@/features/onboarding/select-chips';
import { DEMO_BIOIMPEDANCE, type BioimpedanceMeasurement } from '@/features/exams/demo-data';
import { DEVICE_LABELS, formatExamDate, formatExamValue } from '@/features/exams/exam-labels';
import { MarkerChart } from '@/features/exams/marker-chart';

type Device = BioimpedanceMeasurement['source'];

const METRICS = [
  { key: 'bodyFatPercent', labelKey: 'examsMore.bodyFat', unit: '%' },
  { key: 'muscleMassKg', labelKey: 'examsMore.muscle', unit: 'kg' },
  { key: 'weightKg', labelKey: 'examsMore.deviceWeight', unit: 'kg' },
] as const;

/**
 * Bioimpedância separada por aparelho (CLAUDE.md): cada marca mede de um jeito,
 * então a tela nunca põe medidas de aparelhos diferentes no mesmo gráfico nem
 * calcula diferença entre elas.
 */
export default function BioimpedanceScreen() {
  const { t } = useTranslation();
  const devices = [...new Set(DEMO_BIOIMPEDANCE.map((measurement) => measurement.source))];
  const [device, setDevice] = useState<Device>(devices[0] ?? 'inbody');
  const labels = Object.fromEntries(devices.map((d) => [d, DEVICE_LABELS[d]])) as Record<
    Device,
    string
  >;

  const measurements = DEMO_BIOIMPEDANCE.filter(
    (measurement) => measurement.source === device,
  ).sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <PreviewBanner missing={t('examsMore.bioPreview')} />

      <View className="gap-2 rounded-2xl border-2 border-maracuja-forte bg-superficie p-4">
        <AppText variant="bodyStrong" className="text-grafite">
          {t('examsMore.bioWarnTitle')}
        </AppText>
        <AppText className="text-grafite">
          {t('examsMore.bioWarnText')}
        </AppText>
      </View>

      {devices.length > 1 ? (
        <SelectChips
          label={t('examsMore.device')}
          options={devices}
          optionLabels={labels}
          value={device}
          onChange={setDevice}
        />
      ) : null}

      {METRICS.map(({ key, labelKey, unit }) => {
        const label = t(labelKey);
        const points = measurements
          .filter((measurement) => measurement[key] !== null)
          .map((measurement) => ({
            date: measurement.measuredAt,
            value: measurement[key] as number,
          }));
        const last = points[points.length - 1];
        return (
          <View key={key} className="gap-2">
            <View className="flex-row flex-wrap items-baseline justify-between gap-x-3">
              <AppText variant="subtitle" accessibilityRole="header" className="text-grafite">
                {label}
              </AppText>
              {last ? (
                <AppText variant="number" className="text-grafite">
                  {formatExamValue(last.value)} {unit}
                </AppText>
              ) : null}
            </View>
            <MarkerChart
              points={points}
              unit={unit}
              description={t('examsMore.onDevice', {
                label,
                device: DEVICE_LABELS[device],
                points: points
                  .map((point) =>
                    t('examsMore.pointOn', {
                      value: formatExamValue(point.value),
                      unit,
                      date: formatExamDate(point.date),
                    }),
                  )
                  .join('; '),
              })}
            />
          </View>
        );
      })}

      <AppText variant="caption" className="text-grafite-suave">
        Medições em {DEVICE_LABELS[device]}:{' '}
        {measurements.map((measurement) => formatExamDate(measurement.measuredAt)).join(', ')}.
      </AppText>
    </ScrollView>
  );
}
