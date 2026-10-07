import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional, IsNumber, Max, Min } from 'class-validator';
import { WEEKLY_PACES_KG } from '@minhasaude/shared';
import { ActivityLevel, Goal, Sex } from '../../database/entities/profile.entity';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(272)
  heightCm?: number;

  @ApiPropertyOptional({ enum: ActivityLevel })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @ApiPropertyOptional({ enum: Goal })
  @IsOptional()
  @IsEnum(Goal)
  goal?: Goal;

  // null limpa o ritmo (objetivo "manter").
  @ApiPropertyOptional({ type: Number, nullable: true, enum: [...WEEKLY_PACES_KG] })
  @IsOptional()
  @IsIn([...WEEKLY_PACES_KG])
  weeklyPaceKg?: number | null;
}
