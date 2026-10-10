import type { Ref } from 'react';
import { TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { GotaVitalColors } from '@/constants/gota-vital-colors';
import { AppText } from '@/components/ui/app-text';
import { spokenFieldLabel } from '@/features/accessibility/spoken-format';

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
      {/* O campo já se anuncia com o rótulo; sem esconder este texto o leitor
          de tela fala "E-mail" e logo depois "E-mail, caixa de edição". */}
      <AppText
        variant="label"
        className="text-grafite"
        importantForAccessibility="no"
        accessibilityElementsHidden>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        // O rótulo é um Text irmão, que o leitor de tela não associa sozinho ao
        // campo — sem isto o usuário ouve "campo de texto" e nada mais.
        accessibilityLabel={spokenFieldLabel(label)}
        // O erro precisa chegar a quem não enxerga a cor jabuticaba.
        accessibilityHint={error ?? inputProps.accessibilityHint}
        // Só com o py-3 o campo ficava com 44 dp, abaixo do alvo de toque mínimo.
        style={{ minHeight: MIN_TOUCH_TARGET }}
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
