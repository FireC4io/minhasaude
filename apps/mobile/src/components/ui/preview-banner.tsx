import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';

interface PreviewBannerProps {
  /** O que ainda falta para a tela funcionar de verdade. */
  missing: string;
}

/**
 * Aviso das telas em prévia (ver `config/features.ts`). Fica no topo e com
 * texto, não só cor: quem vê precisa saber que aquilo não é dado real.
 */
export function PreviewBanner({ missing }: PreviewBannerProps) {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityRole="text"
      className="gap-1 rounded-2xl border border-maracuja-forte bg-superficie p-3">
      <AppText variant="label" className="text-maracuja-forte">
        {t('common.previewTitle')}
      </AppText>
      <AppText variant="caption" className="text-grafite">
        {missing}
      </AppText>
    </View>
  );
}
