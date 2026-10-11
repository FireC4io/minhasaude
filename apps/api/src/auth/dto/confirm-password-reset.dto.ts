import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

const CODE_PATTERN = new RegExp(`^\\d{${INPUT_LIMITS.passwordResetCode}}$`);

export class ConfirmPasswordResetDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'Código de 6 dígitos recebido por e-mail' })
  @IsString()
  @Matches(CODE_PATTERN, { message: 'code deve ter 6 dígitos' })
  code!: string;

  @ApiProperty({ minLength: INPUT_LIMITS.passwordMin })
  @IsString()
  @MinLength(INPUT_LIMITS.passwordMin, { message: 'newPassword deve ter pelo menos 8 caracteres' })
  @MaxLength(INPUT_LIMITS.passwordNew, { message: 'newPassword deve ter no máximo 128 caracteres' })
  newPassword!: string;
}
