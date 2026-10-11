import type { ConfigService } from '@nestjs/config';
import { OAuth2Client, type LoginTicket } from 'google-auth-library';
import type { Env } from '../../config/env.schema';
import { GoogleAuthLibraryVerifier } from './google-token-verifier';

const CLIENT_ID = '123-abc.apps.googleusercontent.com';

function verifierWith(clientId?: string) {
  const config = { get: () => clientId } as unknown as ConfigService<Env, true>;
  return new GoogleAuthLibraryVerifier(config);
}

function ticket(payload: Record<string, unknown> | undefined): LoginTicket {
  return { getPayload: () => payload } as unknown as LoginTicket;
}

describe('GoogleAuthLibraryVerifier', () => {
  const verifyIdToken = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');

  beforeEach(() => jest.clearAllMocks());

  it('sem Client ID configurado, recusa sem nem consultar o Google', async () => {
    expect(await verifierWith(undefined).verify('qualquer')).toBeNull();
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('confere o token contra o nosso Client ID e devolve a identidade', async () => {
    verifyIdToken.mockResolvedValue(
      ticket({ sub: 'g-1', email: 'maria@gmail.com', email_verified: true }) as never,
    );

    const identity = await verifierWith(CLIENT_ID).verify('token');

    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: 'token', audience: CLIENT_ID });
    expect(identity).toEqual({ sub: 'g-1', email: 'maria@gmail.com', emailVerified: true });
  });

  it('trata e-mail sem confirmação explícita como não confirmado', async () => {
    verifyIdToken.mockResolvedValue(ticket({ sub: 'g-1', email: 'maria@gmail.com' }) as never);
    expect((await verifierWith(CLIENT_ID).verify('token'))?.emailVerified).toBe(false);
  });

  it('recusa token inválido e token sem e-mail', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('Wrong recipient') as never);
    expect(await verifierWith(CLIENT_ID).verify('token')).toBeNull();

    verifyIdToken.mockResolvedValueOnce(ticket({ sub: 'g-1' }) as never);
    expect(await verifierWith(CLIENT_ID).verify('token')).toBeNull();
  });
});
