import { ApiProperty } from '@nestjs/swagger';
import { BodyMeasurementSource } from '../../database/entities/body-measurement.entity';

export class BodyMeasurementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-17T12:00:00.000Z' })
  measuredAt!: string;

  // Nunca normalizado entre aparelhos (regra do CLAUDE.md): a fonte viaja
  // junto do valor pra que a UI jamais compare medidas de origens diferentes.
  @ApiProperty({ enum: BodyMeasurementSource })
  source!: BodyMeasurementSource;

  // Colunas numeric do Postgres voltam como string pelo TypeORM - o contrato
  // reflete o que a API realmente envia, em vez de mentir um number.
  @ApiProperty({ type: String, example: '70.50' })
  weightKg!: string;

  // Campos nullable de tipo primitivo precisam de `type` explícito: sem isso o
  // @nestjs/swagger reflete o union como Object e o orval gera um placeholder
  // inútil no client (mesmo achado da issue #20).
  @ApiProperty({ type: String, nullable: true, example: '18.5' })
  bodyFatPercent!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '32.10' })
  muscleMassKg!: string | null;

  @ApiProperty({ type: String, nullable: true, example: '58.40' })
  leanMassKg!: string | null;
}
