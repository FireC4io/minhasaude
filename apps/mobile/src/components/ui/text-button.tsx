import { Pressable, Text } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface TextButtonProps {
  /** Texto visível. */
  label: string;
  onPress: () => void;
  /**
   * Nome falado, quando o texto visível não basta — ex.: a seta "‹" é falada
   * como "Dia anterior", e "Remover" vira "Remover Banana" numa lista.
   */
  accessibilityLabel?: string;
  hint?: string;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Ação secundária em forma de texto ("Sair", "+ Adicionar alimento",
 * "Remover"). Os `Pressable` soltos que faziam esse papel não tinham papel nem
 * nome para o leitor de tela, e alvos de ~20 dp.
 */
export function TextButton({
  label,
  onPress,
  accessibilityLabel,
  hint,
  disabled,
  busy,
  className,
  textClassName = 'text-sm font-semibold text-mamao',
}: TextButtonProps) {
  const isDisabled = Boolean(disabled || busy);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(busy) }}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_TARGET,
        minWidth: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : pressed ? 0.7 : 1,
      })}
      className={className}>
      <Text className={textClassName}>{label}</Text>
    </Pressable>
  );
}
