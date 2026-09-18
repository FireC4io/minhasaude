import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class GetDiaryQueryDto {
  @ApiProperty({ example: '2026-09-18' })
  @IsDateString()
  date!: string;
}
