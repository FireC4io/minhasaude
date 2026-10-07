import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

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
  // `Link` do expo-router ignora o className do NativeWind: o texto saía preto e na fonte do sistema.
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  useAnnounce(sent ? 'Pedido registrado. Confira sua caixa de entrada.' : null);

  function handleSubmit() {
    if (!email.includes('@')) {
      setError('Digite o e-mail da sua conta, como maria@exemplo.com.');
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <FormScreen centered>
      <PreviewBanner missing="O envio do e-mail de recuperação ainda não existe no servidor. Nenhum e-mail será enviado." />

      <View className="gap-1">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          Esqueci minha senha
        </AppText>
        <AppText className="text-grafite">
          Digite o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.
        </AppText>
      </View>

      {sent ? (
        <View className="gap-3 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            ✓ Pedido registrado
          </AppText>
          <AppText className="text-grafite">
            Se houver uma conta com {email.trim()}, o link chega em alguns minutos. Confira também a
            caixa de spam. O link vale por 30 minutos e só pode ser usado uma vez.
          </AppText>
        </View>
      ) : (
        <View className="gap-4">
          <AuthTextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <FormError message={error} />
          <PrimaryButton label="Enviar link" onPress={handleSubmit} isLoading={false} />
        </View>
      )}

      <TextButton
        label="Voltar para entrar"
        onPress={() => router.push('/login')}
        textVariant="bodyStrong"
        textClassName="text-mamao-forte"
        className="self-center"
      />
    </FormScreen>
  );
}
