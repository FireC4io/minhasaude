import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

const REPOSITORY_URL = 'https://github.com/FireC4io/minhasaude';

/**
 * Créditos exigidos pelas licenças dos dados (F4-21) — não remover ao mexer
 * nesta tela (CLAUDE.md): TACO/Unicamp e Open Food Facts (ODbL).
 */
export default function AboutScreen() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <View className="gap-1">
        <AppText variant="subtitle" className="text-grafite">
          Gota Vital
        </AppText>
        <AppText variant="caption" className="text-grafite-suave">
          {t('account.about.version', { version })}
        </AppText>
      </View>

      <AppText className="text-grafite">
        {t('account.about.intro')}
      </AppText>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
          {t('account.about.sources')}
        </AppText>
        <AppText className="text-grafite">
          {t('account.about.taco')}
        </AppText>
        <AppText className="text-grafite">
          {t('account.about.off')}
        </AppText>
        <TextButton
          label={t('account.about.offLink')}
          onPress={() => void Linking.openURL('https://br.openfoodfacts.org')}
          textClassName="text-mamao-forte"
          className="self-start"
        />
      </View>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
          {t('account.about.privacyContact')}
        </AppText>
        <AppText className="text-grafite">
          {t('account.about.policyPending')}
        </AppText>
        <TextButton
          label={t('account.about.github')}
          onPress={() => void Linking.openURL(REPOSITORY_URL)}
          textClassName="text-mamao-forte"
          className="self-start"
        />
      </View>
    </ScrollView>
  );
}
