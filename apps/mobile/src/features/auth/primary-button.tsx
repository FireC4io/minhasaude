import { ActivityIndicator, Pressable, Text } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, isLoading, disabled }: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({ opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 })}
      className="items-center rounded-2xl bg-mamao px-4 py-3">
      {isLoading ? (
        <ActivityIndicator color="#FBF0E4" />
      ) : (
        <Text className="font-semibold text-areia">{label}</Text>
      )}
    </Pressable>
  );
}
