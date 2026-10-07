import { appLocale } from '@/i18n/format';
import { translatedLabels } from '@/i18n/labels';

/** Formato devolvido por `GET /v1/consents` (o client gerado tipa como `void`). */
export interface ConsentStatusView {
  consentType: 'terms_of_service' | 'privacy_policy' | 'exam_data_processing';
  granted: boolean;
  policyVersion: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
}

export const CONSENT_LABELS: Record<ConsentStatusView['consentType'], { title: string; what: string }> = {
  privacy_policy: translatedLabels({
    title: 'account.privacy.privacyPolicyTitle',
    what: 'account.privacy.privacyPolicyWhat',
  }),
  terms_of_service: translatedLabels({
    title: 'account.privacy.termsTitle',
    what: 'account.privacy.termsWhat',
  }),
  exam_data_processing: translatedLabels({
    title: 'account.privacy.examsTitle',
    what: 'account.privacy.examsWhat',
  }),
};

export function formatConsentDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
}
