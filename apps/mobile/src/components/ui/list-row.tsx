import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface ListRowProps {
  title: string;
  description?: string;
  onPress: () => void;
  /** `danger` para ações destrutivas — o título precisa dizer a ação sozinho. */
  tone?: 'default' | 'danger';
  hint?: string;
}

/** Linha tocável de lista (Perfil, exames). Um único alvo, com nome completo. */
export function ListRow({ title, description, onPress, tone = 'default', hint }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityHint={hint}
      // Objeto, não função — ver o comentário em `TextButton`.
      style={{ minHeight: MIN_TOUCH_TARGET }}
      className="flex-row items-center gap-3 py-3 active:opacity-70">
      <View className="flex-1 gap-0.5">
        <AppText
          variant="bodyStrong"
          className={tone === 'danger' ? 'text-jabuticaba' : 'text-grafite'}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" className="text-grafite-suave">
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText importantForAccessibility="no" accessibilityElementsHidden className="text-grafite-suave">
        ›
      </AppText>
    </Pressable>
  );
}
