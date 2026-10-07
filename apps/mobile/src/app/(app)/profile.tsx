import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsersControllerGetMe } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';
import { TextButton } from '@/components/ui/text-button';
import { useAuth } from '@/features/auth/auth-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const meQuery = useUsersControllerGetMe();

  const go = (href: Href) => () => router.push(href);

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <View className="gap-1">
          <AppText variant="title" accessibilityRole="header" className="text-grafite">
            Perfil
          </AppText>
          {meQuery.data ? (
            <AppText className="text-grafite-suave">{meQuery.data.user.email}</AppText>
          ) : null}
        </View>

        <Section title="Você">
          <ListRow
            title="Seus dados e sua meta"
            description="Altura, nascimento, atividade e objetivo"
            onPress={go('/account/edit')}
          />
        </Section>

        <Section title="Seus dados, seus direitos">
          <ListRow
            title="Relatório de progresso"
            description="Um PDF com peso, médias, metas e diário"
            onPress={go('/account/report')}
          />
          <ListRow
            title="Exportar meus dados"
            description="Um arquivo com tudo o que o app guarda sobre você"
            onPress={go('/account/export')}
          />
          <ListRow
            title="Privacidade e consentimentos"
            description="O que você autorizou e quando"
            onPress={go('/account/privacy')}
          />
          <ListRow
            title="Excluir minha conta"
            description="Apaga todos os seus dados na hora"
            tone="danger"
            onPress={go('/account/delete')}
          />
        </Section>

        <Section title="App">
          <ListRow
            title="Preferências"
            description="Tema claro, escuro ou do aparelho"
            onPress={go('/account/preferences')}
          />
          <ListRow
            title="Sobre o Gota Vital"
            description="Versão, fontes dos dados e contato"
            onPress={go('/account/about')}
          />
        </Section>

        <TextButton
          label="Sair da conta"
          hint="Encerra a sessão neste aparelho"
          onPress={() => void logout()}
          textVariant="bodyStrong"
          textClassName="text-mamao-forte"
          className="self-start"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-1">
      <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
        {title}
      </AppText>
      <View className="rounded-2xl bg-superficie px-4">{children}</View>
    </View>
  );
}
