import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

// Nome e marca voltam na exportação LGPD: sem < e >, que nenhum nome de alimento usa.
export class CreateFoodDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(INPUT_LIMITS.foodName)
  @Matches(/^[^<>]*$/, { message: 'sem < ou >' })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(INPUT_LIMITS.foodBrand)
  @Matches(/^[^<>]*$/, { message: 'sem < ou >' })
  brand?: string;

  // GTIN/EAN: só dígitos, de 8 a 14.
  @ApiPropertyOptional({ example: '7891000100103', pattern: String.raw`^\d{8,14}$` })
  @IsOptional()
  @IsString()
  @MaxLength(INPUT_LIMITS.barcode)
  @Matches(/^\d{8,14}$/, { message: 'barcode deve ter de 8 a 14 dígitos' })
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
