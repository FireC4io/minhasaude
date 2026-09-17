import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Food } from './food.entity';

// Unidades customizadas por alimento, ex. "1 fatia = 25g".
@Entity('food_portions')
export class FoodPortion extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', name: 'food_id' })
  foodId!: string;

  @ManyToOne(() => Food, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food!: Food;

  @Column({ type: 'varchar' })
  label!: string;

  @Column({ type: 'numeric', precision: 7, scale: 2 })
  grams!: string;
}
