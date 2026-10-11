import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ConsentType } from '../../database/entities/consent.entity';

/** Situação atual de um tipo de consentimento (`GET /v1/consents`). */
export class ConsentStatusResponseDto {
  @ApiProperty({ enum: ConsentType, enumName: 'ConsentType' })
  @Expose()
  consentType!: ConsentType;

  @ApiProperty()
  @Expose()
  granted!: boolean;

  @ApiProperty({ type: String, nullable: true, example: '2026-10' })
  @Expose()
  policyVersion!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  @Expose()
  grantedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  @Expose()
  revokedAt!: Date | null;
}
