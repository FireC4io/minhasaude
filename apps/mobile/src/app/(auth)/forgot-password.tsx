import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useAuthControllerConfirmPasswordReset,
  useAuthControllerRequestPasswordReset,
} from '@/api/generated/endpoints/auth/auth';
import { AppText } from '@/components/ui/app-text';
import { FormScreen } from '@/components/ui/form-screen';
import { TextButton } from '@/components/ui/text-button';
import { useAuth } from '@/features/auth/auth-context';
import { NewPasswordForm } from '@/features/auth/password-reset/new-password-form';
import { RequestCodeForm } from '@/features/auth/password-reset/request-code-form';
import { currentLanguage } from '@/i18n';

/**
 * Recuperar senha (F4-32): o e-mail traz um código de 6 números, digitado aqui
 * mesmo — funciona com o e-mail aberto em outro aparelho e sem link que o
 * Gmail bloqueia. Trocar a senha encerra as outras sessões e já entra no app.
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  // `Link` do expo-router ignora o className do NativeWind: o texto saía preto e na fonte do sistema.
  const router = useRouter();
  const { login } = useAuth();
  const requestCode = useAuthControllerRequestPasswordReset();
  const confirmReset = useAuthControllerConfirmPasswordReset();
  const [email, setEmail] = useState<string | null>(null);

  async function sendCode(address: string) {
    await requestCode.mutateAsync({ data: { email: address, language: currentLanguage() } });
    setEmail(address);
  }

  async function saveNewPassword(address: string, code: string, newPassword: string) {
    await confirmReset.mutateAsync({ data: { email: address, code, newPassword } });
    try {
      await login(address, newPassword);
    } catch {
      // A senha já mudou; se entrar falhar (internet), a pessoa entra pela tela de login.
      router.replace('/login');
    }
  }

  return (
    <FormScreen centered>
      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          {t('auth.forgotPassword')}
        </AppText>
        {email === null ? <AppText className="text-grafite">{t('auth.forgot.intro')}</AppText> : null}
      </View>

      {email === null ? (
        <RequestCodeForm onSubmit={sendCode} />
      ) : (
        <NewPasswordForm
          email={email}
          onSubmit={(code, newPassword) => saveNewPassword(email, code, newPassword)}
          onResend={() => sendCode(email)}
          onChangeEmail={() => setEmail(null)}
        />
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
