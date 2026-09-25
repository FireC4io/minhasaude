import { ActivityIndicator, Pressable, Text } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  /** Use quando o resultado da ação não for óbvio a partir do rótulo. */
  hint?: string;
}

export function PrimaryButton({
  label,
  onPress,
  isLoading,
  disabled,
  hint,
}: PrimaryButtonProps) {
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
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
      })}
      className="items-center rounded-2xl bg-mamao px-4 py-3">
      {isLoading ? (
        <ActivityIndicator color="#FBF0E4" />
      ) : (
        <Text className="font-semibold text-areia">{label}</Text>
      )}
    </Pressable>
  );
}
