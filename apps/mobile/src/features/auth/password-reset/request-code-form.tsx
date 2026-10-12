import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/ui/form-error';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';

import { resetErrorKey } from './reset-errors';

interface RequestCodeFormProps {
  onSubmit: (email: string) => Promise<void>;
}

/** Primeiro passo: o e-mail da conta. A resposta é a mesma exista a conta ou não. */
export function RequestCodeForm({ onSubmit }: Readonly<RequestCodeFormProps>) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setError(t('auth.forgot.invalidEmail'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(t(resetErrorKey(err, 'send')));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <AuthTextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void handleSubmit()}
      />
      <FormError message={error} />
      <PrimaryButton
        label={t('auth.forgot.send')}
        onPress={() => void handleSubmit()}
        isLoading={isSubmitting}
      />
    </View>
  );
}
