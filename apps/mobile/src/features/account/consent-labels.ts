import type { ConsentType } from '@/api/generated/models';
import { appLocale } from '@/i18n/format';
import { translatedLabels } from '@/i18n/labels';


export const CONSENT_LABELS: Record<ConsentType, { title: string; what: string }> = {
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
