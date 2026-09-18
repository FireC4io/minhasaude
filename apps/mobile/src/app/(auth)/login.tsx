import { isAxiosError } from 'axios';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-context';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';

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
          <Text className="text-3xl font-semibold text-grafite">Bem-vindo de volta</Text>
          <Text className="text-base text-grafite">Entre pra continuar seu acompanhamento.</Text>
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
          {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}
          <PrimaryButton
            label="Entrar"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={!email || !password}
          />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-grafite">Não tem conta?</Text>
          <Link href="/register" className="font-semibold text-mamao">
            Criar conta
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
