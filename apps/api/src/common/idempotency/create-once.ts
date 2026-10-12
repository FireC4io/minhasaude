import { QueryFailedError, type FindOneOptions, type FindOptionsWhere, type Repository } from 'typeorm';

/** Código do Postgres para violação de índice único. */
const UNIQUE_VIOLATION = '23505';

interface OwnedByClient {
  userId: string;
  clientId: string | null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION
  );
}

/**
 * Criação que pode chegar repetida: o app guarda a anotação feita sem internet
 * e reenvia quando a conexão volta, e um envio que chegou ao servidor mas cuja
 * resposta se perdeu (servidor acordando, sinal fraco) é reenviado igual. O
 * `clientId` gerado no aparelho identifica a anotação: o segundo envio devolve
 * a mesma linha em vez de criar outra.
 *
 * Sem `clientId` (app antigo), cria sempre, como antes.
 */
export async function createOnce<T extends OwnedByClient>(
  repository: Repository<T>,
  owner: { userId: string; clientId?: string },
  create: () => Promise<T>,
  relations?: FindOneOptions<T>['relations'],
): Promise<T> {
  const { userId, clientId } = owner;
  if (!clientId) return create();

  const where = { userId, clientId } as FindOptionsWhere<T>;
  const existing = await repository.findOne({ where, relations });
  if (existing) return existing;

  try {
    return await create();
  } catch (error) {
    // Dois envios iguais ao mesmo tempo: o índice único segura o segundo.
    if (!isUniqueViolation(error)) throw error;
    const winner = await repository.findOne({ where, relations });
    if (!winner) throw error;
    return winner;
  }
}
