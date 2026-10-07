import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';

/** Aviso fixo das telas de resultado (RDC 657/2022): o app informa, não diagnostica. */
export function ExamDisclaimer() {
  const { t } = useTranslation();
  return (
    <View className="rounded-2xl border border-linha p-4">
      <AppText variant="caption" className="text-grafite">
        {t('exams.disclaimer')}
      </AppText>
    </View>
  );
}
