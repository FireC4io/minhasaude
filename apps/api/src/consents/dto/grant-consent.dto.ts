import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';
import { ConsentType } from '../../database/entities/consent.entity';

export class GrantConsentDto {
  @ApiProperty({ enum: ConsentType })
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  // Formato AAAA-MM (comparado como texto na tela de reaceite). O valor volta na
  // exportação LGPD, então nada além disso entra.
  @ApiProperty({ example: '2026-10', pattern: String.raw`^\d{4}-\d{2}$` })
  @IsString()
  @MaxLength(INPUT_LIMITS.policyVersion)
  @Matches(/^\d{4}-\d{2}$/, { message: 'policyVersion deve estar no formato AAAA-MM' })
  policyVersion!: string;
}
