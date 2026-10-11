import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

export class GoogleSignInDto {
  @ApiProperty({ description: 'ID token devolvido pelo login do Google no aparelho' })
  @IsString()
  @MinLength(1, { message: 'idToken é obrigatório' })
  @MaxLength(INPUT_LIMITS.googleIdToken, { message: 'idToken longo demais' })
  idToken!: string;
}
