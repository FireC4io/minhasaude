import { ApiProperty } from '@nestjs/swagger';
import { DiaryEntryResponseDto } from './diary-entry-response.dto';
import { MacroTotalsDto } from './macro-totals.dto';

class DiaryMealsResponseDto {
  @ApiProperty({ type: [DiaryEntryResponseDto] })
  breakfast!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  lunch!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  dinner!: DiaryEntryResponseDto[];

  @ApiProperty({ type: [DiaryEntryResponseDto] })
  snack!: DiaryEntryResponseDto[];
}

class DailySummaryTotalsResponseDto {
  @ApiProperty({ type: MacroTotalsDto })
  consumed!: MacroTotalsDto;

  @ApiProperty({ type: MacroTotalsDto, nullable: true })
  target!: MacroTotalsDto | null;

  @ApiProperty({ type: MacroTotalsDto, nullable: true })
  remaining!: MacroTotalsDto | null;
}

export class DailySummaryResponseDto {
  @ApiProperty({ example: '2026-09-18' })
  date!: string;

  @ApiProperty({ type: DiaryMealsResponseDto })
  meals!: DiaryMealsResponseDto;

  @ApiProperty({ type: DailySummaryTotalsResponseDto })
  summary!: DailySummaryTotalsResponseDto;
}
