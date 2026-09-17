import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('account_deletion_requests')
export class AccountDeletionRequest extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'timestamptz', name: 'requested_at' })
  requestedAt!: Date;

  @Column({ type: 'timestamptz', name: 'scheduled_purge_at' })
  scheduledPurgeAt!: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt!: Date | null;
}
