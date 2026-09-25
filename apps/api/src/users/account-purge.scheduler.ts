import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountPurgeService } from './account-purge.service';

/**
 * Dispara a exclusão das contas cujo prazo de arrependimento venceu.
 *
 * Fica separado do `AccountPurgeService` pra que a regra de exclusão siga
 * testável sem depender do agendador.
 *
 * Roda uma vez por dia, de madrugada. Não é crítico no horário: o serviço no
 * Render free tier pode estar dormindo e perder uma execução, mas a consulta
 * pega todo pedido vencido, então uma rodada perdida só adia — nunca deixa
 * uma conta sem ser apagada.
 */
@Injectable()
export class AccountPurgeScheduler {
  constructor(private readonly accountPurgeService: AccountPurgeService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyPurge(): Promise<void> {
    await this.accountPurgeService.purgeDueAccounts();
  }
}
