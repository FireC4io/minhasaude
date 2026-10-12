import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  DATA_EXPORTED = 'data_exported',
  CONSENT_REVOKED = 'consent_revoked',
  ACCOUNT_DELETION_REQUESTED = 'account_deletion_requested',
  ACCOUNT_DELETED = 'account_deleted',
}

/** Detalhe mínimo de cada ação: nunca IP, e-mail ou dado de saúde. */
export type AuditDetails = Record<string, string>;

// Quem fez o quê nas ações sensíveis (LGPD art. 37: registro das operações).
// Só acréscimo: um gatilho no banco recusa UPDATE e DELETE. `user_id` sem FK
// de propósito, como em `consents`: o registro sobrevive à exclusão da conta
// como prova de que o pedido foi atendido, e sozinho não identifica ninguém.
@Entity('audit_events')
@Index(['userId', 'occurredAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: AuditAction })
  action!: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  details!: AuditDetails | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'occurred_at' })
  occurredAt!: Date;
}
