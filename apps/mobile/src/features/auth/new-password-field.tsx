import { INPUT_LIMITS } from '@minhasaude/shared';
import type { Ref } from 'react';
import { View, type TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';

import { PasswordField } from './password-field';

export const MIN_PASSWORD_LENGTH = INPUT_LIMITS.passwordMin;

/** A mesma regra no cadastro e na troca de senha (espelha a API). */
export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

interface NewPasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  ref?: Ref<TextInput>;
}

/**
 * Senha nova com a regra visível embaixo e quantas letras faltam: o botão
 * nunca fica travado sem dizer por quê. Usado no cadastro e na troca de senha.
 */
export function NewPasswordField({ label, value, onChangeText, onSubmitEditing, ref }: Readonly<NewPasswordFieldProps>) {
  const { t } = useTranslation();
  const missing = MIN_PASSWORD_LENGTH - value.length;
  return (
    <View className="gap-4">
      <PasswordField
        ref={ref}
        label={label}
        value={value}
        onChangeText={onChangeText}
        autoComplete="password-new"
        textContentType="newPassword"
        maxLength={INPUT_LIMITS.passwordNew}
        returnKeyType="go"
        accessibilityHint={t('auth.register.passwordHint', { min: MIN_PASSWORD_LENGTH })}
        onSubmitEditing={onSubmitEditing}
      />
      <AppText variant="caption" className="text-grafite-suave">
        {t('auth.register.passwordRule', { min: MIN_PASSWORD_LENGTH })}
        {value.length > 0 && missing > 0 ? t('auth.register.passwordMissing', { count: missing }) : ''}
      </AppText>
    </View>
  );
}
