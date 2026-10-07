import { ActivityIndicator, View } from 'react-native';

import { useAnnounce } from '@/features/accessibility/use-announce';

interface LoadingIndicatorProps {
  /** O que está carregando, ex.: "Carregando o diário". */
  label: string;
  className?: string;
}

/** Spinner que diz o que está carregando, em vez de um giro mudo. */
export function LoadingIndicator({ label, className }: LoadingIndicatorProps) {
  useAnnounce(label);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      className={className}
    >
      <ActivityIndicator testID="loading-indicator-spinner" className="text-mamao-forte" />
    </View>
  );
}
