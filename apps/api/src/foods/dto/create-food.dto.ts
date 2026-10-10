import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min, MinLength, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

export class CreateFoodDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(INPUT_LIMITS.foodName)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(INPUT_LIMITS.foodBrand)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(INPUT_LIMITS.barcode)
  barcode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(900)
  kcalPer100g!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  proteinGPer100g!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  fatGPer100g!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  carbGPer100g!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fiberGPer100g?: number;
}
