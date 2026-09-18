import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MealType, DiaryQuantityUnit } from '../../database/entities/diary-entry.entity';

export class CreateDiaryEntryDto {
  @ApiProperty()
  @IsUUID()
  foodId!: string;

  @ApiProperty({ example: '2026-09-18' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType!: MealType;

  @ApiProperty({ description: 'Em gramas se unit=grams, ou nº de porções se unit=portion' })
  @IsNumber()
  @Min(0.01)
  @Max(10000)
  quantity!: number;

  @ApiProperty({ enum: DiaryQuantityUnit })
  @IsEnum(DiaryQuantityUnit)
  unit!: DiaryQuantityUnit;

  @ApiPropertyOptional({ description: 'Obrigatório quando unit=portion' })
  @IsOptional()
  @IsUUID()
  portionId?: string;
}
