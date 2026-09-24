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

  @ApiProperty()
  @Expose()
  isManualOverride!: boolean;

  @ApiProperty()
  @Expose()
  activeFrom!: Date;
}
