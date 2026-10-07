import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useUsersControllerGetMe } from '@/api/generated/endpoints/me/me';
import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';
import { TextButton } from '@/components/ui/text-button';
import { useAuth } from '@/features/auth/auth-context';

export default function ProfileScreen() {
  const { t } = useTranslation();
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

        <Section title={t('account.you')}>
          <ListRow
            title={t('account.dataAndGoal')}
            description={t('account.dataAndGoalHint')}
            onPress={go('/account/edit')}
          />
        </Section>

        <Section title={t('account.rights')}>
          <ListRow
            title={t('account.reportTitle')}
            description={t('account.reportHint')}
            onPress={go('/account/report')}
          />
          <ListRow
            title={t('account.exportTitle')}
            description={t('account.exportHint')}
            onPress={go('/account/export')}
          />
          <ListRow
            title={t('account.privacyTitle')}
            description={t('account.privacyHint')}
            onPress={go('/account/privacy')}
          />
          <ListRow
            title={t('account.deleteTitle')}
            description={t('account.deleteHint')}
            tone="danger"
            onPress={go('/account/delete')}
          />
        </Section>

        <Section title={t('account.app')}>
          <ListRow
            title={t('account.preferencesTitle')}
            description={t('account.preferencesHint')}
            onPress={go('/account/preferences')}
          />
          <ListRow
            title={t('account.aboutTitle')}
            description={t('account.aboutHint')}
            onPress={go('/account/about')}
          />
        </Section>

        <TextButton
          label={t('account.signOut')}
          hint={t('account.signOutHint')}
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
