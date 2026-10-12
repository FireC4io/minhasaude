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
  /** `danger` para ações destrutivas (excluir conta). O rótulo diz a ação; a cor só reforça. */
  tone?: 'default' | 'danger';
}

/** Só o desabilitado esmaece; carregando não reage ao toque; normal escurece ao tocar. */
function pressFeedback(disabled: boolean, isLoading: boolean): string {
  if (disabled) return 'opacity-50';
  return isLoading ? '' : 'active:opacity-80';
}

export function PrimaryButton({
  label,
  onPress,
  isLoading,
  disabled,
  hint,
  tone = 'default',
}: Readonly<PrimaryButtonProps>) {
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
      className={`items-center rounded-2xl px-4 py-3 ${
        tone === 'danger' ? 'bg-jabuticaba' : 'bg-mamao-forte'
      } ${
        pressFeedback(Boolean(disabled), Boolean(isLoading))
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
