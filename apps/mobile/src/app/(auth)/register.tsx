import { isAxiosError } from 'axios';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormError } from '@/components/ui/form-error';
import { useAuth } from '@/features/auth/auth-context';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';
import { AppText } from '@/components/ui/app-text';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 409
          ? 'Já existe uma conta com este email.'
          : 'Não foi possível criar a conta. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center gap-6 px-6">
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">Criar conta</AppText>
          <AppText className="text-grafite">
            Registre sua alimentação e acompanhe seus exames num só lugar.
          </AppText>
        </View>

        <View className="gap-4">
          <AuthTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <AuthTextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
          />
          <FormError message={error} />
          <PrimaryButton
            label="Criar conta"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={!email || password.length < 8}
          />
        </View>

        <View className="flex-row justify-center gap-1">
          <AppText className="text-grafite">Já tem conta?</AppText>
          <Link href="/login" className="font-body-semibold text-mamao-forte">
            Entrar
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
