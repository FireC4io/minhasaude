import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Código de 6 dígitos para criar uma senha nova. Guardado só como HMAC (com
 * segredo do servidor): um vazamento do banco não entrega os códigos, nem por
 * força bruta das 10^6 combinações.
 */
@Entity('password_reset_codes')
export class PasswordResetCode extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', name: 'code_hash' })
  codeHash!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  /** Tentativas erradas já gastas; no limite, o código morre. */
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz', name: 'used_at', nullable: true })
  usedAt!: Date | null;
}
