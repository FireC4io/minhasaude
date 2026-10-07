import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/text-button';

const REPOSITORY_URL = 'https://github.com/FireC4io/minhasaude';

/**
 * Créditos exigidos pelas licenças dos dados (F4-21) — não remover ao mexer
 * nesta tela (CLAUDE.md): TACO/Unicamp e Open Food Facts (ODbL).
 */
export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <View className="gap-1">
        <AppText variant="subtitle" className="text-grafite">
          Gota Vital
        </AppText>
        <AppText variant="caption" className="text-grafite-suave">
          Versão {version}
        </AppText>
      </View>

      <AppText className="text-grafite">
        Um diário de alimentação e saúde feito para ser simples para qualquer pessoa. As informações
        do app são para acompanhamento e não substituem a orientação de um profissional de saúde.
      </AppText>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
          De onde vêm os dados dos alimentos
        </AppText>
        <AppText className="text-grafite">
          Tabela Brasileira de Composição de Alimentos (TACO), do Núcleo de Estudos e Pesquisas em
          Alimentação (NEPA) da Unicamp.
        </AppText>
        <AppText className="text-grafite">
          Open Food Facts, base colaborativa de produtos, disponível sob a licença Open Database
          License (ODbL). Dados © colaboradores do Open Food Facts.
        </AppText>
        <TextButton
          label="Conhecer o Open Food Facts"
          onPress={() => void Linking.openURL('https://br.openfoodfacts.org')}
          textClassName="text-mamao-forte"
          className="self-start"
        />
      </View>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        <AppText variant="label" accessibilityRole="header" className="text-grafite-suave">
          Privacidade e contato
        </AppText>
        <AppText className="text-grafite">
          A política de privacidade completa está sendo finalizada e ficará disponível aqui antes da
          publicação nas lojas.
        </AppText>
        <TextButton
          label="Código e contato no GitHub"
          onPress={() => void Linking.openURL(REPOSITORY_URL)}
          textClassName="text-mamao-forte"
          className="self-start"
        />
      </View>
    </ScrollView>
  );
}
