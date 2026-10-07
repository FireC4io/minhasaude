import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';

/**
 * Etiqueta curta para cards em prévia dentro de telas reais (água e notas na
 * Hoje): o dado ali é só de demonstração e precisa estar dito, não só sugerido.
 */
export function PreviewTag() {
  return (
    <View className="rounded-full border border-maracuja-forte px-2">
      <AppText variant="caption" className="text-maracuja-forte">
        Prévia
      </AppText>
    </View>
  );
}
