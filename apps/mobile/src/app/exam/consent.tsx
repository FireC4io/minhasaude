import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { PrimaryButton } from '@/features/auth/primary-button';
import { useExamConsent } from '@/features/exams/exam-repository';

const HOW_IT_WORKS = [
  'Você envia a foto ou o PDF do exame.',
  'Um serviço de inteligência artificial lê os valores do laudo. Só o arquivo do exame é enviado a ele.',
  'Você confere cada valor antes de qualquer conta ser feita. Nada é usado sem a sua revisão.',
  'O arquivo fica guardado de forma privada; só você vê, por link temporário.',
  'Você pode apagar um exame, ou todos, quando quiser. Excluir a conta apaga tudo em até 30 dias.',
];

/**
 * Consentimento específico para dados de exame (LGPD: dado pessoal sensível).
 * Separado da política de privacidade geral, e pedido só quando a pessoa
 * quer usar exames.
 */
export default function ExamConsentScreen() {
  const router = useRouter();
  const [, setConsent] = useExamConsent();
  const [agreed, setAgreed] = useState(false);

  function accept() {
    setConsent(true);
    router.replace('/exam/upload');
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <PreviewBanner missing="Na prévia a autorização fica só neste aparelho e nada é enviado. Com o servidor pronto, ela será registrada como consentimento de dados de exame." />

      <AppText className="text-grafite">
        Exames de sangue e de bioimpedância são dados de saúde, protegidos pela LGPD. Veja como o
        Gota Vital cuida deles:
      </AppText>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        {HOW_IT_WORKS.map((step, index) => (
          <View key={step} className="flex-row gap-3">
            <AppText variant="number" className="text-mamao-forte">
              {index + 1}.
            </AppText>
            <AppText className="flex-1 text-grafite">{step}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        O app mostra seus valores, a faixa de referência do laboratório e índices calculados com
        fórmulas conhecidas. Ele não faz diagnóstico nem indica tratamento: converse com seu médico
        sobre os resultados.
      </AppText>

      <CheckboxRow
        label="Autorizo o Gota Vital a ler e guardar os exames que eu enviar"
        checked={agreed}
        onChange={setAgreed}
      />
      <PrimaryButton
        label="Autorizar e continuar"
        disabled={!agreed}
        hint={agreed ? undefined : 'Marque a autorização acima para liberar'}
        onPress={accept}
        isLoading={false}
      />
      <AppText variant="caption" className="text-grafite-suave">
        Você pode retirar essa autorização depois, em Perfil → Privacidade.
      </AppText>
    </ScrollView>
  );
}
