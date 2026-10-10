import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { INPUT_LIMITS } from '@minhasaude/shared';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextButton } from '@/components/ui/text-button';
import { useAuth } from '@/features/auth/auth-context';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PasswordField } from '@/features/auth/password-field';
import { PrimaryButton } from '@/features/auth/primary-button';

const MIN_PASSWORD_LENGTH = INPUT_LIMITS.passwordMin;

export default function RegisterScreen() {
  const { t } = useTranslation();
  // `Link` do expo-router ignora o className do NativeWind: o texto saía preto e na fonte do sistema.
  const router = useRouter();
  const { register } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.includes('@')) {
      setError(t('auth.emailExample'));
      return;
    }
    // A regra fica visível embaixo do campo; o botão nunca fica travado sem dizer por quê.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.register.passwordMin', { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email.trim(), password);
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 409
          ? t('auth.register.exists')
          : t('auth.register.failed'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreen centered>
      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('auth.createAccount')}
        </AppText>
        <AppText className="text-grafite">
          {t('auth.register.intro')}
        </AppText>
      </View>

      <View className="gap-4">
        <AuthTextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          ref={passwordRef}
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          autoComplete="password-new"
          textContentType="newPassword"
          maxLength={INPUT_LIMITS.passwordNew}
          returnKeyType="go"
          accessibilityHint={t('auth.register.passwordHint', { min: MIN_PASSWORD_LENGTH })}
          onSubmitEditing={() => void handleSubmit()}
        />
        <AppText variant="caption" className="text-grafite-suave">
          {t('auth.register.passwordRule', { min: MIN_PASSWORD_LENGTH })}
          {password.length > 0 && password.length < MIN_PASSWORD_LENGTH
            ? t('auth.register.passwordMissing', { count: MIN_PASSWORD_LENGTH - password.length })
            : ''}
        </AppText>
        <FormError message={error} />
        <PrimaryButton
          label={t('auth.createAccount')}
          onPress={() => void handleSubmit()}
          isLoading={isSubmitting}
        />
      </View>

      <View className="flex-row flex-wrap items-center justify-center gap-1">
        <AppText className="text-grafite">{t('auth.register.hasAccount')}</AppText>
        <TextButton
          label={t('auth.signIn')}
          onPress={() => router.push('/login')}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="self-center"
        />
      </View>
    </FormScreen>
  );
}
