import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { Env } from '../../config/env.schema';

/** O que interessa do token do Google, já conferido. */
export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
}

/** Confere o ID token do Google. Abstrata para os testes trocarem por uma falsa. */
export abstract class GoogleTokenVerifier {
  /** Devolve a identidade, ou `null` se o token não serve (assinatura, emissor, público, validade). */
  abstract verify(idToken: string): Promise<GoogleIdentity | null>;
}

@Injectable()
export class GoogleAuthLibraryVerifier extends GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async verify(idToken: string): Promise<GoogleIdentity | null> {
    const audience = this.config.get('GOOGLE_WEB_CLIENT_ID', { infer: true });
    if (!audience) {
      return null;
    }
    try {
      // A biblioteca confere assinatura (chaves públicas do Google), emissor
      // (accounts.google.com), validade e se o público é o nosso Client ID.
      const ticket = await this.client.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        return null;
      }
      return { sub: payload.sub, email: payload.email, emailVerified: payload.email_verified === true };
    } catch {
      return null;
    }
  }
}
