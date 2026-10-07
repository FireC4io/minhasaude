import { ActivityIndicator, Pressable } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { AppText } from '@/components/ui/app-text';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  /** Use quando o resultado da ação não for óbvio a partir do rótulo. */
  hint?: string;
}

export function PrimaryButton({ label, onPress, isLoading, disabled, hint }: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      // Enquanto carrega, o rótulo some da tela e sobra o spinner — sem este
      // label o leitor de tela anunciaria um botão sem nome.
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: Boolean(isLoading) }}
      // Objeto, não função — ver o comentário em `TextButton`.
      style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
      // Só o desabilitado esmaece: carregando com 50% parecia travado e
      // apagava o spinner (achado do catálogo, F4-08).
      className={`items-center rounded-2xl bg-mamao-forte px-4 py-3 ${
        disabled ? 'opacity-50' : isLoading ? '' : 'active:opacity-80'
      }`}
    >
      {isLoading ? (
        // `className` em vez de `color`: o NativeWind converte a cor do token
        // na prop, e o spinner acompanha o tema como o rótulo.
        <ActivityIndicator className="text-areia" />
      ) : (
        <AppText variant="bodyStrong" className="text-areia">{label}</AppText>
      )}
    </Pressable>
  );
}
