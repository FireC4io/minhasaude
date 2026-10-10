import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'refreshToken é obrigatório' })
  // randomBytes(64) em hex: sempre 128 caracteres.
  @MaxLength(128)
  refreshToken!: string;
}
