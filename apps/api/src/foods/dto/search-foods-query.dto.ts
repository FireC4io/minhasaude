import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SearchFoodsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 'arros' })
  @IsString()
  @MinLength(2)
  q!: string;
}
