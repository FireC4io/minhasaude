import { ApiProperty } from '@nestjs/swagger';
import { MealType, DiaryQuantityUnit } from '../../database/entities/diary-entry.entity';
import { FoodResponseDto } from '../../foods/dto/food-response.dto';

export class DiaryEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  foodId!: string;

  @ApiProperty({ type: FoodResponseDto })
  food!: FoodResponseDto;

  @ApiProperty({ example: '2026-09-18' })
  entryDate!: string;

  @ApiProperty({ enum: MealType, enumName: 'MealType' })
  mealType!: MealType;

  @ApiProperty()
  quantity!: string;

  @ApiProperty({ enum: DiaryQuantityUnit, enumName: 'DiaryQuantityUnit' })
  unit!: DiaryQuantityUnit;

  @ApiProperty({ type: String, nullable: true })
  portionId!: string | null;

  @ApiProperty()
  kcalSnapshot!: string;

  @ApiProperty()
  proteinGSnapshot!: string;

  @ApiProperty()
  fatGSnapshot!: string;

  @ApiProperty()
  carbGSnapshot!: string;
}
