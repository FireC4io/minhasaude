import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';
import { ConsentType } from '../../database/entities/consent.entity';

export class GrantConsentDto {
  @ApiProperty({ enum: ConsentType })
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @ApiProperty({ example: '2026-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(INPUT_LIMITS.policyVersion)
  policyVersion!: string;
}
