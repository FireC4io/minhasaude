import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { PortionKind } from '@minhasaude/shared';
import { BaseEntity } from './base.entity';
import { Food } from './food.entity';
import { User } from './user.entity';

/**
 * Medida caseira de um alimento ("1 colher de sopa = 25 g"). Dois tipos:
 * - do sistema: `kind` preenchido, sem dono (vêm do IBGE, ver
 *   `seeds/taco-portions-catalog.ts`); o texto sai da tradução do app;
 * - da pessoa: `userId` + `label` livres ("minha caneca"), visível só para ela.
 */
@Entity('food_portions')
@Check('CHK_food_portions_kind_or_owner', '("kind" IS NOT NULL AND "user_id" IS NULL) OR ("kind" IS NULL AND "user_id" IS NOT NULL AND "label" IS NOT NULL)')
// Índice parcial criado à mão na migration (o decorator não expressa o WHERE).
@Index('IDX_food_portions_food_kind', { synchronize: false })
export class FoodPortion extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'food_id' })
  foodId!: string;

  @ManyToOne(() => Food, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food!: Food;

  @Column({ type: 'varchar', length: 32, nullable: true })
  kind!: PortionKind | null;

  @Index()
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'varchar', nullable: true })
  label!: string | null;

  @Column({ type: 'numeric', precision: 7, scale: 2 })
  grams!: string;
}
