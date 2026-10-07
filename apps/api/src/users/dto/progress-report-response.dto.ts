import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BodyMeasurementResponseDto } from '../../body-measurements/dto/body-measurement-response.dto';
import { GoalTargetResponseDto } from '../../goals/dto/goal-target-response.dto';
import { DiaryEntryResponseDto } from '../../diary/dto/diary-entry-response.dto';

export class ProgressReportResponseDto {
  @ApiProperty({ type: Date })
  @Expose()
  generatedAt!: Date;

  // Só `source=manual`, do mais antigo ao mais recente.
  @ApiProperty({ type: [BodyMeasurementResponseDto] })
  @Expose()
  @Type(() => BodyMeasurementResponseDto)
  weights!: BodyMeasurementResponseDto[];

  // Do mais antigo ao mais recente.
  @ApiProperty({ type: [GoalTargetResponseDto] })
  @Expose()
  @Type(() => GoalTargetResponseDto)
  goals!: GoalTargetResponseDto[];

  // Em ordem cronológica, com o alimento aninhado.
  @ApiProperty({ type: [DiaryEntryResponseDto] })
  @Expose()
  @Type(() => DiaryEntryResponseDto)
  diaryEntries!: DiaryEntryResponseDto[];
}
