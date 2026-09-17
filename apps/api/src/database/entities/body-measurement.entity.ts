import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum BodyMeasurementSource {
  MANUAL = 'manual',
  INBODY = 'inbody',
  TANITA = 'tanita',
  OMRON = 'omron',
  OTHER = 'other',
}

// `source` nunca é normalizado entre aparelhos - comparar ou agrupar medidas
// de fontes diferentes exige filtro explícito na consulta, nunca implícito
// (ver CLAUDE.md). No MVP só POST com source=manual é aceito; os demais
// valores ficam reservados para a Fase 5 (importação de bioimpedância).
@Entity('body_measurements')
export class BodyMeasurement extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'timestamptz', name: 'measured_at' })
  measuredAt!: Date;

  @Column({ type: 'enum', enum: BodyMeasurementSource })
  source!: BodyMeasurementSource;

  @Column({ type: 'numeric', name: 'weight_kg', precision: 5, scale: 2 })
  weightKg!: string;

  @Column({ type: 'numeric', name: 'body_fat_percent', precision: 4, scale: 1, nullable: true })
  bodyFatPercent!: string | null;

  @Column({ type: 'numeric', name: 'muscle_mass_kg', precision: 5, scale: 2, nullable: true })
  muscleMassKg!: string | null;

  @Column({ type: 'numeric', name: 'lean_mass_kg', precision: 5, scale: 2, nullable: true })
  leanMassKg!: string | null;

  @Column({ type: 'jsonb', name: 'raw_payload', nullable: true })
  rawPayload!: Record<string, unknown> | null;
}
