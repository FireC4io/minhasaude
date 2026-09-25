import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Consent } from '../database/entities/consent.entity';
import { AccountDeletionRequest } from '../database/entities/account-deletion-request.entity';

export interface PurgeResult {
  purged: number;
  failed: number;
}

/**
 * Executa de fato a exclusão de conta pedida em `DELETE /v1/me`.
 *
 * Até então o endpoint só marcava a conta como `PENDING_DELETION` e agendava
 * `scheduledPurgeAt` — nenhum job apagava nada, então o direito ao
 * esquecimento (LGPD) ficava pela metade.
 *
 * Os passos são idempotentes de propósito, em vez de uma transação: anonimizar
 * consent já anonimizado não faz nada, apagar usuário inexistente não faz nada,
 * e concluir pedido concluído é filtrado na consulta. Se a execução morrer no
 * meio, a próxima retoma de onde parou sem efeito colateral.
 */
@Injectable()
export class AccountPurgeService {
  private readonly logger = new Logger(AccountPurgeService.name);

  constructor(
    @InjectRepository(AccountDeletionRequest)
    private readonly requests: Repository<AccountDeletionRequest>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Consent) private readonly consents: Repository<Consent>,
  ) {}

  async purgeDueAccounts(now: Date = new Date()): Promise<PurgeResult> {
    const vencidos = await this.requests.find({
      where: { completedAt: IsNull(), scheduledPurgeAt: LessThanOrEqual(now) },
    });

    let purged = 0;
    let failed = 0;

    for (const pedido of vencidos) {
      try {
        await this.purgeOne(pedido, now);
        purged += 1;
      } catch (error: unknown) {
        failed += 1;
        // Um pedido problemático não pode impedir os outros. Como o pedido não
        // é marcado como concluído, a próxima execução tenta de novo.
        this.logger.error(
          `Falha ao executar exclusão da conta ${pedido.userId} (pedido ${pedido.id})`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    if (vencidos.length > 0) {
      this.logger.log(`Exclusão de contas: ${purged} concluída(s), ${failed} com falha.`);
    }

    return { purged, failed };
  }

  private async purgeOne(pedido: AccountDeletionRequest, now: Date): Promise<void> {
    // Primeiro os identificadores diretos: `consents` não tem FK pra `users`,
    // então não cai no cascade. O registro fica como prova de que o
    // consentimento existiu, sem IP nem user agent.
    await this.consents.update({ userId: pedido.userId }, { ipAddress: null, userAgent: null });

    // Apagar o usuário leva junto profile, refresh_tokens, body_measurements,
    // goal_targets, diary_entries e os foods dele — todos com ON DELETE CASCADE.
    await this.users.delete(pedido.userId);

    pedido.completedAt = now;
    await this.requests.save(pedido);
  }
}
