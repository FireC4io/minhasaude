import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SearchFoodsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 'arros' })
  @IsString()
  @MinLength(2)
  // Busca enorme pesa no banco (trigramas) e é repassada ao Open Food Facts.
  @MaxLength(INPUT_LIMITS.foodSearch)
  q!: string;
}
