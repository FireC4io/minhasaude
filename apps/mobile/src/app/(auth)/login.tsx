import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextButton } from '@/components/ui/text-button';
import { PREVIEW_FEATURES } from '@/config/features';
import { useAuth } from '@/features/auth/auth-context';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PasswordField } from '@/features/auth/password-field';
import { PrimaryButton } from '@/features/auth/primary-button';

export default function LoginScreen() {
  const { t } = useTranslation();
  // `Link` do expo-router ignora o className do NativeWind: o texto saía preto e na fonte do sistema.
  const router = useRouter();
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError(t('auth.login.fillBoth'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 401
          ? t('auth.login.wrong')
          : t('auth.login.failed'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreen centered>
      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('auth.login.title')}
        </AppText>
        <AppText className="text-grafite">Entre para continuar seu acompanhamento.</AppText>
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
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
        />
        <FormError message={error} />
        <PrimaryButton
          label={t('auth.signIn')}
          onPress={() => void handleSubmit()}
          isLoading={isSubmitting}
        />
        {PREVIEW_FEATURES ? (
          <TextButton
            label={t('auth.forgotPassword')}
            onPress={() => router.push('/forgot-password')}
            textVariant="bodyStrong"
            textClassName="text-mamao-forte"
            className="self-center"
          />
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center justify-center gap-1">
        <AppText className="text-grafite">Não tem conta?</AppText>
        <TextButton
          label={t('auth.createAccount')}
          onPress={() => router.push('/register')}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="self-center"
        />
      </View>
    </FormScreen>
  );
}
