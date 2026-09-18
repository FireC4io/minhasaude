import { ApiProperty } from '@nestjs/swagger';
import { CalculationMethod } from '../../database/entities/goal-target.entity';

export class GoalTargetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: CalculationMethod, enumName: 'CalculationMethod' })
  calculationMethod!: CalculationMethod;

  @ApiProperty({ description: 'kcal/dia' })
  bmrKcal!: string;

  @ApiProperty({ description: 'kcal/dia' })
  tdeeKcal!: string;

  @ApiProperty({ description: 'kcal/dia' })
  targetKcal!: string;

  @ApiProperty({ description: 'gramas/dia' })
  proteinG!: string;

  @ApiProperty({ description: 'gramas/dia' })
  fatG!: string;

  @ApiProperty({ description: 'gramas/dia' })
  carbG!: string;

  @ApiProperty()
  isManualOverride!: boolean;

  @ApiProperty()
  activeFrom!: Date;
}
