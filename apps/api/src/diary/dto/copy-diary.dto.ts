import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CopyDiaryDto {
  @ApiProperty({ example: '2026-09-17' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ example: '2026-09-18' })
  @IsDateString()
  toDate!: string;
}
