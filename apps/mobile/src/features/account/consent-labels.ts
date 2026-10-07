import { appLocale } from '@/i18n/format';

/** Formato devolvido por `GET /v1/consents` (o client gerado tipa como `void`). */
export interface ConsentStatusView {
  consentType: 'terms_of_service' | 'privacy_policy' | 'exam_data_processing';
  granted: boolean;
  policyVersion: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
}

export const CONSENT_LABELS: Record<ConsentStatusView['consentType'], { title: string; what: string }> = {
  privacy_policy: {
    title: 'Política de privacidade',
    what: 'Permite guardar seu perfil, peso e diário para calcular e mostrar suas metas.',
  },
  terms_of_service: {
    title: 'Termos de uso',
    what: 'As regras de uso do aplicativo.',
  },
  exam_data_processing: {
    title: 'Dados de exames',
    what: 'Permite ler e guardar os exames que você enviar. Pedido só quando você usar exames.',
  },
};

export function formatConsentDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString(appLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
}
