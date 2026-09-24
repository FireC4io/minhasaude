import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BodyMeasurementResponseDto } from './body-measurement-response.dto';

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

export class PaginatedBodyMeasurementResponseDto {
  @ApiProperty({ type: [BodyMeasurementResponseDto] })
  @Expose()
  @Type(() => BodyMeasurementResponseDto)
  data!: BodyMeasurementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}
