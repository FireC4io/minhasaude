import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditEvent, type AuditDetails } from '../database/entities/audit-event.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditEvent) private readonly events: Repository<AuditEvent>) {}

  /**
   * Registra a ação depois que ela aconteceu. Falha ao registrar não desfaz
   * nem impede a ação (a pessoa tem direito a exportar e a apagar a conta),
   * mas fica no log de erro para ser investigada.
   */
  async record(userId: string, action: AuditAction, details: AuditDetails | null = null): Promise<void> {
    try {
      await this.events.insert({ userId, action, details });
    } catch (error: unknown) {
      this.logger.error(
        `Registro de auditoria "${action}" falhou para a conta ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** Histórico da própria pessoa, para a exportação dos dados. */
  async listForUser(userId: string): Promise<AuditEvent[]> {
    return this.events.find({ where: { userId }, order: { occurredAt: 'ASC' } });
  }
}
