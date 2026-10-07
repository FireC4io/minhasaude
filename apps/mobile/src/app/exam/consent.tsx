import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/app-text';
import { CheckboxRow } from '@/components/ui/checkbox-row';
import { PreviewBanner } from '@/components/ui/preview-banner';
import { PrimaryButton } from '@/features/auth/primary-button';
import { useExamConsent } from '@/features/exams/exam-repository';

const HOW_IT_WORKS = ['send', 'read', 'check', 'store', 'delete'] as const;

/**
 * Consentimento específico para dados de exame (LGPD: dado pessoal sensível).
 * Separado da política de privacidade geral, e pedido só quando a pessoa
 * quer usar exames.
 */
export default function ExamConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [, setConsent] = useExamConsent();
  const [agreed, setAgreed] = useState(false);

  function accept() {
    setConsent(true);
    router.replace('/exam/upload');
  }

  return (
    <ScrollView className="flex-1 bg-areia" contentContainerClassName="gap-6 px-6 py-6">
      <PreviewBanner missing={t('exams.consent.preview')} />

      <AppText className="text-grafite">
        {t('exams.consent.intro')}
      </AppText>

      <View className="gap-3 rounded-2xl bg-superficie p-4">
        {HOW_IT_WORKS.map((step, index) => (
          <View key={step} className="flex-row gap-3">
            <AppText variant="number" className="text-mamao-forte">
              {index + 1}.
            </AppText>
            <AppText className="flex-1 text-grafite">{t(`exams.consent.steps.${step}`)}</AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption" className="text-grafite">
        {t('exams.consent.notDiagnosis')}
      </AppText>

      <CheckboxRow
        label={t('exams.consent.checkbox')}
        checked={agreed}
        onChange={setAgreed}
      />
      <PrimaryButton
        label={t('exams.consent.accept')}
        disabled={!agreed}
        hint={agreed ? undefined : t('exams.consent.acceptHint')}
        onPress={accept}
        isLoading={false}
      />
      <AppText variant="caption" className="text-grafite-suave">
        {t('exams.consent.revoke')}
      </AppText>
    </ScrollView>
  );
}
