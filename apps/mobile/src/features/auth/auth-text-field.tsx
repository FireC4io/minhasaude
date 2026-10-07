import type { Ref } from 'react';
import { TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { AppText } from '@/components/ui/app-text';

interface AuthTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** Para o "próximo" do teclado levar ao campo seguinte. */
  ref?: Ref<TextInput>;
}

export function AuthTextField({ label, error, ref, ...inputProps }: AuthTextFieldProps) {
  // `placeholderTextColor` é prop, não estilo: o `className` não alcança.
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <View className="gap-1">
      <AppText variant="label" className="text-grafite">{label}</AppText>
      <TextInput
        ref={ref}
        // O rótulo é um Text irmão, que o leitor de tela não associa sozinho ao
        // campo — sem isto o usuário ouve "campo de texto" e nada mais.
        accessibilityLabel={label}
        // O erro precisa chegar a quem não enxerga a cor jabuticaba.
        accessibilityHint={error ?? inputProps.accessibilityHint}
        className="rounded-xl border border-grafite bg-areia px-4 py-3 font-body text-base text-grafite"
        placeholderTextColor={GotaVitalColors[scheme].grafiteSuave}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      {error ? (
        <AppText variant="caption"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-jabuticaba"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
