import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CalculationMethod } from '../../database/entities/goal-target.entity';

export class RecalculateGoalDto {
  @ApiPropertyOptional({
    enum: CalculationMethod,
    description:
      'Default: mifflin_st_jeor, ou katch_mcardle automaticamente se a medida corporal mais recente tiver % de gordura.',
  })
  @IsOptional()
  @IsEnum(CalculationMethod)
  method?: CalculationMethod;
}
