import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { BodyMeasurementSource } from '../../database/entities/body-measurement.entity';

export class CreateBodyMeasurementDto {
  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  @IsDateString()
  measuredAt!: string;

  // Só 'manual' é aceito neste endpoint no MVP - os demais valores de source
  // (inbody, tanita, omron, other) só chegam via importação de bioimpedância
  // da Fase 5, nunca por entrada direta do usuário aqui.
  @ApiProperty({ enum: [BodyMeasurementSource.MANUAL] })
  @IsIn([BodyMeasurementSource.MANUAL])
  source!: BodyMeasurementSource.MANUAL;

  @ApiProperty({ example: 70.5 })
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg!: number;

  @ApiPropertyOptional({ example: 18.5 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(70)
  bodyFatPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(400)
  muscleMassKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(400)
  leanMassKg?: number;
}
