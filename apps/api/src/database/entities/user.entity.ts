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

  // Sempre argon2 (ver CLAUDE.md) - nunca logar este campo. Nulo em conta
  // criada pelo Google (até a pessoa criar uma senha em "Esqueci minha senha").
  @Column({ type: 'varchar', name: 'password_hash', nullable: true })
  passwordHash!: string | null;

  /** Identificador da pessoa no Google (`sub` do token), quando entra com o Google. */
  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'google_sub', length: 255, nullable: true })
  googleSub!: string | null;

  // Quando a pessoa provou que recebe os e-mails deste endereço (Google ou
  // código de recuperar senha). Sem isso, ligar o Google apaga a senha antiga.
  @Column({ type: 'timestamptz', name: 'email_verified_at', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;
}
