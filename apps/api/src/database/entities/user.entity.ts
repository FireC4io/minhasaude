import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

// Dados pessoais sensíveis (LGPD) - ver regras de segurança em CLAUDE.md.
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_DELETION = 'pending_deletion',
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  // Sempre argon2 (ver CLAUDE.md) - nunca logar este campo.
  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;
}
