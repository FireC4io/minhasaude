import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FoodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  brand!: string | null;

  @ApiProperty()
  kcalPer100g!: string;

  @ApiProperty()
  proteinGPer100g!: string;

  @ApiProperty()
  fatGPer100g!: string;

  @ApiProperty()
  carbGPer100g!: string;
}
