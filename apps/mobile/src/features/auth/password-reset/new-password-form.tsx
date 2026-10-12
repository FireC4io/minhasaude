import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { INPUT_LIMITS, PASSWORD_RESET_CODE_TTL_MINUTES } from '@minhasaude/shared';

import { AppText } from '@/components/ui/app-text';
import { FormError } from '@/components/ui/form-error';
import { TextButton } from '@/components/ui/text-button';
import { useAnnounce } from '@/features/accessibility/use-announce';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { MIN_PASSWORD_LENGTH, NewPasswordField, isPasswordLongEnough } from '@/features/auth/new-password-field';
import { PrimaryButton } from '@/features/auth/primary-button';

import { resetErrorKey } from './reset-errors';

const CODE_LENGTH = INPUT_LIMITS.passwordResetCode;

interface NewPasswordFormProps {
  email: string;
  onSubmit: (code: string, newPassword: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}

/** Segundo passo: o código que chegou por e-mail e a senha nova, na mesma tela. */
export function NewPasswordForm({ email, onSubmit, onResend, onChangeEmail }: NewPasswordFormProps) {
  const { t } = useTranslation();
  const passwordRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resent, setResent] = useState(false);
  useAnnounce(resent ? t('auth.forgot.resentAnnounce') : t('auth.forgot.sentAnnounce'));

  async function handleSubmit() {
    if (code.length !== CODE_LENGTH) {
      setError(t('auth.forgot.codeInvalid'));
      return;
    }
    if (!isPasswordLongEnough(password)) {
      setError(t('auth.register.passwordMin', { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(code, password);
    } catch (err) {
      setError(t(resetErrorKey(err, 'save')));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await onResend();
      setCode('');
      setResent(true);
    } catch (err) {
      setError(t(resetErrorKey(err, 'send')));
    }
  }

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl bg-superficie p-4" accessibilityLiveRegion="polite">
        <AppText variant="bodyStrong" className="text-grafite">
          {t('auth.forgot.codeTitle')}
        </AppText>
        <AppText className="text-grafite">
          {t('auth.forgot.codeBody', { email, minutes: PASSWORD_RESET_CODE_TTL_MINUTES })}
        </AppText>
        {resent ? (
          <AppText variant="bodyStrong" className="text-grafite">
            {t('auth.forgot.resentAnnounce')}
          </AppText>
        ) : null}
      </View>

      <AuthTextField
        label={t('auth.forgot.code')}
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        accessibilityHint={t('auth.forgot.codeHint')}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <NewPasswordField
        ref={passwordRef}
        label={t('auth.forgot.newPassword')}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => void handleSubmit()}
      />
      <FormError message={error} />
      <PrimaryButton
        label={t('auth.forgot.save')}
        onPress={() => void handleSubmit()}
        isLoading={isSubmitting}
      />

      <View className="items-center gap-2">
        <TextButton
          label={t('auth.forgot.resend')}
          onPress={() => void handleResend()}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
        />
        <TextButton
          label={t('auth.forgot.otherEmail')}
          onPress={onChangeEmail}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
        />
      </View>
    </View>
  );
}
