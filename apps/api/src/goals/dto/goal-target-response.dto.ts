import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CalculationMethod } from '../../database/entities/goal-target.entity';

export class GoalTargetResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty({ enum: CalculationMethod, enumName: 'CalculationMethod' })
  @Expose()
  calculationMethod!: CalculationMethod;

  @ApiProperty({ description: 'kcal/dia' })
  @Expose()
  bmrKcal!: string;

  @ApiProperty({ description: 'kcal/dia' })
  @Expose()
  tdeeKcal!: string;

  @ApiProperty({ description: 'kcal/dia' })
  @Expose()
  targetKcal!: string;

  @ApiProperty({ description: 'gramas/dia' })
  @Expose()
  proteinG!: string;

  @ApiProperty({ description: 'gramas/dia' })
  @Expose()
  fatG!: string;

  @ApiProperty({ description: 'gramas/dia' })
  @Expose()
  carbG!: string;

  // kg por semana; null em "manter" e em metas anteriores ao ritmo semanal.
  @ApiProperty({ type: String, nullable: true, example: '0.25' })
  @Expose()
  weeklyPaceKg!: string | null;

  @ApiProperty({ example: '2.0.0' })
  @Expose()
  calculatorVersion!: string;

  @ApiProperty()
  @Expose()
  limitedByBmr!: boolean;

  @ApiProperty()
  @Expose()
  isManualOverride!: boolean;

  @ApiProperty()
  @Expose()
  activeFrom!: Date;
}
