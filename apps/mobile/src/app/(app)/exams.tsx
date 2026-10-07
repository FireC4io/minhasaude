import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { ListRow } from '@/components/ui/list-row';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { PREVIEW_FEATURES } from '@/config/features';
import { PrimaryButton } from '@/features/auth/primary-button';
import { useExamConsent, useExamDocuments } from '@/features/exams/exam-repository';
import { EXAM_TYPE_LABELS, STATUS_LABELS, formatExamDate } from '@/features/exams/exam-labels';

/** Aba Exames (Fase 5). Enquanto não houver API, só existe como prévia. */
export default function ExamsScreen() {
  if (!PREVIEW_FEATURES) return <ExamsComingSoon />;
  return <ExamsHome />;
}

function ExamsHome() {
  const router = useRouter();
  const [hasConsent] = useExamConsent();
  const documents = useExamDocuments();
  const bloodPanels = documents.filter((document) => document.examType === 'blood_panel');
  const waitingReview = documents.filter((document) => document.status === 'extracted');

  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          Exames
        </AppText>
        <PreviewBanner missing="O envio e a leitura de exames ainda não existem no servidor. Os exames abaixo são de uma pessoa fictícia." />

        {!hasConsent ? (
          <View className="gap-3 rounded-2xl bg-superficie p-4">
            <AppText variant="subtitle" className="text-grafite">
              Guarde seus exames num só lugar
            </AppText>
            <AppText className="text-grafite">
              Envie a foto ou o PDF do exame. O app lê os valores, você confere, e acompanha a
              evolução de cada um ao longo do tempo.
            </AppText>
            <AppText variant="caption" className="text-grafite-suave">
              Exames são dados de saúde: antes, precisamos da sua autorização.
            </AppText>
            <PrimaryButton
              label="Ver como funciona e autorizar"
              onPress={() => router.push('/exam/consent')}
              isLoading={false}
            />
          </View>
        ) : (
          <PrimaryButton
            label="Enviar exame"
            hint="Foto, imagem da galeria ou PDF"
            onPress={() => router.push('/exam/upload')}
            isLoading={false}
          />
        )}

        {waitingReview.length > 0 ? (
          <Section title="Esperando sua revisão">
            {waitingReview.map((document) => (
              <ListRow
                key={document.id}
                title={EXAM_TYPE_LABELS[document.examType]}
                description={`${formatExamDate(document.collectedAt)} · ${STATUS_LABELS[document.status]}`}
                onPress={() =>
                  router.push({ pathname: '/exam/review/[id]', params: { id: document.id } })
                }
              />
            ))}
          </Section>
        ) : null}

        <Section title="Exames de sangue">
          {bloodPanels.length === 0 ? (
            <AppText className="py-3 text-grafite-suave">Nenhum exame de sangue ainda.</AppText>
          ) : (
            bloodPanels.map((document) => (
              <ListRow
                key={document.id}
                title={formatExamDate(document.collectedAt ?? document.uploadedAt)}
                description={[document.labName, STATUS_LABELS[document.status]]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() =>
                  router.push(
                    document.status === 'extracted'
                      ? { pathname: '/exam/review/[id]', params: { id: document.id } }
                      : { pathname: '/exam/[id]', params: { id: document.id } },
                  )
                }
              />
            ))
          )}
        </Section>

        <Section title="Mais">
          <ListRow
            title="Índices calculados"
            description="HOMA-IR, Castelli, filtração dos rins e outros, com a fórmula"
            onPress={() => router.push('/exam/indices')}
          />
          <ListRow
            title="Bioimpedância"
            description="Gordura e músculo, separados por aparelho"
            onPress={() => router.push('/exam/bioimpedance')}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamsComingSoon() {
  return (
    <SafeAreaView className="flex-1 bg-areia">
      <ScrollView contentContainerClassName="gap-6 px-6 py-8">
        <AppText variant="title" accessibilityRole="header" className="text-grafite">
          Exames
        </AppText>
        <View className="gap-2 rounded-2xl bg-superficie p-4">
          <AppText variant="bodyStrong" className="text-grafite">
            Em breve
          </AppText>
          <AppText className="text-grafite">
            Aqui você vai poder guardar seus exames de sangue e de bioimpedância e acompanhar os
            resultados ao longo do tempo.
          </AppText>
        </View>
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
