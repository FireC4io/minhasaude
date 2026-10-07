import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum CalculationMethod {
  MIFFLIN_ST_JEOR = 'mifflin_st_jeor',
  KATCH_MCARDLE = 'katch_mcardle',
}

// Nunca atualizada in-place: todo recálculo ou ajuste manual cria uma linha
// nova (ver CLAUDE.md - histórico de cálculo não pode mudar retroativamente).
// A meta "ativa" é sempre a linha mais recente por `active_from`.
@Entity('goal_targets')
export class GoalTarget extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Snapshot dos dados de perfil/medida corporal usados no cálculo - preserva
  // o contexto mesmo que o perfil mude depois.
  @Column({ type: 'jsonb', name: 'profile_snapshot' })
  profileSnapshot!: Record<string, unknown>;

  @Column({ type: 'enum', enum: CalculationMethod, name: 'calculation_method' })
  calculationMethod!: CalculationMethod;

  @Column({ type: 'numeric', name: 'bmr_kcal', precision: 7, scale: 2 })
  bmrKcal!: string;

  @Column({ type: 'numeric', name: 'tdee_kcal', precision: 7, scale: 2 })
  tdeeKcal!: string;

  @Column({ type: 'numeric', name: 'target_kcal', precision: 7, scale: 2 })
  targetKcal!: string;

  @Column({ type: 'numeric', name: 'protein_g', precision: 6, scale: 2 })
  proteinG!: string;

  @Column({ type: 'numeric', name: 'fat_g', precision: 6, scale: 2 })
  fatG!: string;

  @Column({ type: 'numeric', name: 'carb_g', precision: 6, scale: 2 })
  carbG!: string;

  @Column({ type: 'numeric', name: 'weekly_pace_kg', precision: 3, scale: 2, nullable: true })
  weeklyPaceKg!: string | null;

  // Versão da calculadora de meta (`TARGET_KCAL_VERSION` do shared). Metas
  // antigas ficam '1.0.0' (ajuste fixo −500/+300): o histórico não muda se a
  // fórmula mudar.
  @Column({ type: 'varchar', name: 'calculator_version', length: 16, default: '1.0.0' })
  calculatorVersion!: string;

  // A trava da TMB segurou a meta (o ritmo pedido ficaria abaixo do gasto em repouso).
  @Column({ type: 'boolean', name: 'limited_by_bmr', default: false })
  limitedByBmr!: boolean;

  @Column({ type: 'boolean', name: 'is_manual_override', default: false })
  isManualOverride!: boolean;

  @Column({ type: 'timestamptz', name: 'active_from' })
  activeFrom!: Date;
}
