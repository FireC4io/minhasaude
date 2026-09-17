import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { BodyMeasurementSource } from '../../database/entities/body-measurement.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListBodyMeasurementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BodyMeasurementSource })
  @IsOptional()
  @IsEnum(BodyMeasurementSource)
  source?: BodyMeasurementSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
