import { isAxiosError } from 'axios';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/auth-context';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { PrimaryButton } from '@/features/auth/primary-button';

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
          <Text className="text-3xl font-semibold text-grafite">Criar conta</Text>
          <Text className="text-base text-grafite">
            Registre sua alimentação e acompanhe seus exames num só lugar.
          </Text>
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
          {error ? <Text className="text-sm text-jabuticaba">{error}</Text> : null}
          <PrimaryButton
            label="Criar conta"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            disabled={!email || password.length < 8}
          />
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-grafite">Já tem conta?</Text>
          <Link href="/login" className="font-semibold text-mamao">
            Entrar
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
