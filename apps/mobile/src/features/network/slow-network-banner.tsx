import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';

import { useSlowNetwork } from './use-slow-network';

/** Aviso no topo quando o servidor demora — diz o que está acontecendo e quanto pode levar. */
export function SlowNetworkBanner() {
  const slow = useSlowNetwork();
  const insets = useSafeAreaInsets();
  if (!slow) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={{ top: insets.top + 8 }}
      className="absolute left-4 right-4 rounded-2xl bg-grafite px-4 py-3">
      <AppText variant="bodyStrong" className="text-areia">
        Conectando ao servidor…
      </AppText>
      <AppText variant="caption" className="text-areia">
        Na primeira vez do dia pode levar até um minuto. O que já estava carregado continua na tela.
      </AppText>
    </View>
  );
}
