import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ConsentType } from '../../database/entities/consent.entity';

/**
 * Aceite registrado (`POST /v1/consents`). IP e navegador ficam só no banco,
 * como registro de auditoria do aceite.
 */
export class ConsentResponseDto {
  @ApiProperty({ format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: ConsentType, enumName: 'ConsentType' })
  @Expose()
  consentType!: ConsentType;

  @ApiProperty({ example: '2026-10' })
  @Expose()
  policyVersion!: string;

  @ApiProperty({ format: 'date-time' })
  @Expose()
  grantedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  @Expose()
  revokedAt!: Date | null;
}
