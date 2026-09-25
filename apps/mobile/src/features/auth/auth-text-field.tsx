import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthTextField({ label, error, ...inputProps }: AuthTextFieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-grafite">{label}</Text>
      <TextInput
        // O rótulo é um Text irmão, que o leitor de tela não associa sozinho ao
        // campo — sem isto o usuário ouve "campo de texto" e nada mais.
        accessibilityLabel={label}
        // O erro precisa chegar a quem não enxerga a cor jabuticaba.
        accessibilityHint={error ?? inputProps.accessibilityHint}
        className="rounded-xl border border-grafite bg-areia px-4 py-3 text-base text-grafite"
        placeholderTextColor="#8A9891"
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-sm text-jabuticaba">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
