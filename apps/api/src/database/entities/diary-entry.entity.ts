import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Food } from './food.entity';
import { FoodPortion } from './food-portion.entity';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export enum DiaryQuantityUnit {
  GRAMS = 'grams',
  PORTION = 'portion',
}

// Os *_snapshot gravam o valor nutricional calculado no momento do registro -
// se o alimento for editado depois, o histórico do diário não muda
// retroativamente (ver CLAUDE.md).
@Entity('diary_entries')
export class DiaryEntry extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', name: 'food_id' })
  foodId!: string;

  // Sem onDelete: o Postgres bloqueia (NO ACTION) apagar um alimento que
  // ainda tem entradas de diário - impede corromper histórico silenciosamente.
  @ManyToOne(() => Food)
  @JoinColumn({ name: 'food_id' })
  food!: Food;

  @Index()
  @Column({ type: 'date', name: 'entry_date' })
  entryDate!: string;

  @Column({ type: 'enum', enum: MealType, name: 'meal_type' })
  mealType!: MealType;

  @Column({ type: 'numeric', precision: 7, scale: 2 })
  quantity!: string;

  @Column({ type: 'enum', enum: DiaryQuantityUnit })
  unit!: DiaryQuantityUnit;

  @Column({ type: 'uuid', name: 'portion_id', nullable: true })
  portionId!: string | null;

  @ManyToOne(() => FoodPortion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'portion_id' })
  portion!: FoodPortion | null;

  @Column({ type: 'numeric', name: 'kcal_snapshot', precision: 7, scale: 2 })
  kcalSnapshot!: string;

  @Column({ type: 'numeric', name: 'protein_g_snapshot', precision: 6, scale: 2 })
  proteinGSnapshot!: string;

  @Column({ type: 'numeric', name: 'fat_g_snapshot', precision: 6, scale: 2 })
  fatGSnapshot!: string;

  @Column({ type: 'numeric', name: 'carb_g_snapshot', precision: 6, scale: 2 })
  carbGSnapshot!: string;
}
