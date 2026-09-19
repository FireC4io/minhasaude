import { ApiProperty } from '@nestjs/swagger';
import { FoodResponseDto } from './food-response.dto';

class PaginationMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class PaginatedFoodResponseDto {
  @ApiProperty({ type: [FoodResponseDto] })
  data!: FoodResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
