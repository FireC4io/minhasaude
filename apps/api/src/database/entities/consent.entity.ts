import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum ConsentType {
  TERMS_OF_SERVICE = 'terms_of_service',
  PRIVACY_POLICY = 'privacy_policy',
  EXAM_DATA_PROCESSING = 'exam_data_processing',
}

// Cada linha é um evento de consentimento (grant, com revoked_at preenchido se
// revogado depois) - nunca é atualizada para "re-conceder"; um novo grant vira
// uma linha nova. A tabela inteira já é o log de auditoria (ver CLAUDE.md).
@Entity('consents')
export class Consent extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: ConsentType, name: 'consent_type' })
  consentType!: ConsentType;

  @Column({ type: 'varchar', name: 'policy_version' })
  policyVersion!: string;

  @Column({ type: 'timestamptz', name: 'granted_at' })
  grantedAt!: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', name: 'user_agent', nullable: true })
  userAgent!: string | null;
}
