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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        isAxiosError(err) && err.response?.status === 401
          ? 'Email ou senha incorretos.'
          : 'Não foi possível entrar. Verifique sua conexão e tente de novo.',
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
          <AppText variant="title" accessibilityRole="header" className="text-grafite">Bem-vindo de volta</AppText>
          <AppText className="text-grafite">Entre pra continuar seu acompanhamento.</AppText>
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
            autoComplete="password"
            textContentType="password"
          />
          <FormError message={error} />
          <PrimaryButton
            label="Entrar"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={!email || !password}
          />
        </View>

        <View className="flex-row justify-center gap-1">
          <AppText className="text-grafite">Não tem conta?</AppText>
          <Link href="/register" className="font-body-semibold text-mamao-forte">
            Criar conta
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
