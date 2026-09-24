import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { GoalTargetResponseDto } from './goal-target-response.dto';

class PaginationMetaDto {
  @ApiProperty()
  @Expose()
  total!: number;

  @ApiProperty()
  @Expose()
  page!: number;

  @ApiProperty()
  @Expose()
  limit!: number;
}

export class PaginatedGoalTargetResponseDto {
  @ApiProperty({ type: [GoalTargetResponseDto] })
  @Expose()
  @Type(() => GoalTargetResponseDto)
  data!: GoalTargetResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}
