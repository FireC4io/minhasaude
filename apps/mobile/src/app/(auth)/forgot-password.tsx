import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextButton } from '@/components/ui/text-button';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';

/**
 * Recuperar senha (F4-32) — prévia: a API ainda não envia e-mail. A tela já
 * segue a regra do backlog: a resposta é a mesma exista o e-mail ou não, para
 * não revelar quem tem conta.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  // `Link` do expo-router ignora o className do NativeWind: o texto saía preto e na fonte do sistema.
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  useAnnounce(sent ? t('auth.forgot.sentAnnounce') : null);

  function handleSubmit() {
    if (!email.includes('@')) {
      setError(t('auth.forgot.invalidEmail'));
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <FormScreen centered>
      <PreviewBanner missing={t('auth.forgot.preview')} />

      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('auth.forgotPassword')}
        </AppText>
        <AppText className="text-grafite">
          {t('auth.forgot.intro')}
        </AppText>
      </View>

      {sent ? (
        <View className="gap-3 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            {t('auth.forgot.sentTitle')}
          </AppText>
          <AppText className="text-grafite">
            {t('auth.forgot.sentBody', { email: email.trim() })}
          </AppText>
        </View>
      ) : (
        <View className="gap-4">
          <AuthTextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <FormError message={error} />
          <PrimaryButton label={t('auth.forgot.send')} onPress={handleSubmit} isLoading={false} />
        </View>
      )}

      <TextButton
        label={t('auth.forgot.back')}
        onPress={() => router.push('/login')}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
        className="self-center"
      />
    </FormScreen>
  );
}
