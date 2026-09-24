import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { MealType, DiaryQuantityUnit } from '../../database/entities/diary-entry.entity';
import { FoodResponseDto } from '../../foods/dto/food-response.dto';

export class DiaryEntryResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  foodId!: string;

  // @Type() é necessário pro filtro descer no objeto aninhado - sem ele o
  // alimento viajaria cru, com ownerUserId e companhia.
  @ApiProperty({ type: FoodResponseDto })
  @Expose()
  @Type(() => FoodResponseDto)
  food!: FoodResponseDto;

  @ApiProperty({ example: '2026-09-18' })
  @Expose()
  entryDate!: string;

  @ApiProperty({ enum: MealType, enumName: 'MealType' })
  @Expose()
  mealType!: MealType;

  @ApiProperty()
  @Expose()
  quantity!: string;

  @ApiProperty({ enum: DiaryQuantityUnit, enumName: 'DiaryQuantityUnit' })
  @Expose()
  unit!: DiaryQuantityUnit;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  portionId!: string | null;

  @ApiProperty()
  @Expose()
  kcalSnapshot!: string;

  @ApiProperty()
  @Expose()
  proteinGSnapshot!: string;

  @ApiProperty()
  @Expose()
  fatGSnapshot!: string;

  @ApiProperty()
  @Expose()
  carbGSnapshot!: string;
}
