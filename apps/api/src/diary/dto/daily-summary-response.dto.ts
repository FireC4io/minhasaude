import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DiaryEntryResponseDto } from './diary-entry-response.dto';
import { MacroTotalsDto } from './macro-totals.dto';

class DiaryMealsResponseDto {
  @ApiProperty({ type: [DiaryEntryResponseDto] })
  @Expose()
  @Type(() => DiaryEntryResponseDto)
  breakfast!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  @Expose()
  @Type(() => DiaryEntryResponseDto)
  lunch!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  @Expose()
  @Type(() => DiaryEntryResponseDto)
  dinner!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  @Expose()
  @Type(() => DiaryEntryResponseDto)
  snack!: DiaryEntryResponseDto[];
}

class DailySummaryTotalsResponseDto {
  @ApiProperty({ type: MacroTotalsDto })
  @Expose()
  @Type(() => MacroTotalsDto)
  consumed!: MacroTotalsDto;

  @ApiProperty({ type: MacroTotalsDto, nullable: true })
  @Expose()
  @Type(() => MacroTotalsDto)
  target!: MacroTotalsDto | null;

  @ApiProperty({ type: MacroTotalsDto, nullable: true })
  @Expose()
  @Type(() => MacroTotalsDto)
  remaining!: MacroTotalsDto | null;
}

export class DailySummaryResponseDto {
  @ApiProperty({ example: '2026-09-18' })
  @Expose()
  date!: string;

  @ApiProperty({ type: DiaryMealsResponseDto })
  @Expose()
  @Type(() => DiaryMealsResponseDto)
  meals!: DiaryMealsResponseDto;

  @ApiProperty({ type: DailySummaryTotalsResponseDto })
  @Expose()
  @Type(() => DailySummaryTotalsResponseDto)
  summary!: DailySummaryTotalsResponseDto;
}
