import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { ConsentType } from '../../database/entities/consent.entity';

export class GrantConsentDto {
  @ApiProperty({ enum: ConsentType })
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @ApiProperty({ example: '2026-01' })
  @IsString()
  @MinLength(1)
  policyVersion!: string;
}
