import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
}

export enum Goal {
  LOSE = 'lose',
  MAINTAIN = 'maintain',
  GAIN = 'gain',
}

// Preenchido progressivamente no onboarding - todos os campos de domínio
// começam nulos até o usuário completar cada etapa.
@Entity('profiles')
export class Profile extends BaseEntity {
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'enum', enum: Sex, nullable: true })
  sex!: Sex | null;

  @Column({ type: 'numeric', name: 'height_cm', precision: 5, scale: 1, nullable: true })
  heightCm!: string | null;

  @Column({ type: 'enum', enum: ActivityLevel, name: 'activity_level', nullable: true })
  activityLevel!: ActivityLevel | null;

  @Column({ type: 'enum', enum: Goal, nullable: true })
  goal!: Goal | null;

  @Column({ type: 'timestamptz', name: 'goal_updated_at', nullable: true })
  goalUpdatedAt!: Date | null;
}
