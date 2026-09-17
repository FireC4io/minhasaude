import { SetMetadata } from '@nestjs/common';
import { ConsentType } from '../../database/entities/consent.entity';

export const REQUIRE_CONSENT_KEY = 'requireConsent';

// Bloqueia a rota com 403 se o usuário autenticado não tiver esse consentimento
// ativo (concedido e não revogado). Usar junto de @UseGuards(RequireConsentGuard).
export const RequireConsent = (type: ConsentType) => SetMetadata(REQUIRE_CONSENT_KEY, type);
