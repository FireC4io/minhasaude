import { ApiProperty } from '@nestjs/swagger';
import { BodyMeasurementResponseDto } from './body-measurement-response.dto';

class PaginationMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class PaginatedBodyMeasurementResponseDto {
  @ApiProperty({ type: [BodyMeasurementResponseDto] })
  data!: BodyMeasurementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
