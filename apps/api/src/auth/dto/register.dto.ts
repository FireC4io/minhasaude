import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(INPUT_LIMITS.passwordMin, { message: 'password deve ter pelo menos 8 caracteres' })
  // Teto para não ocupar o argon2 com senhas de centenas de KB.
  @MaxLength(INPUT_LIMITS.passwordNew, { message: 'password deve ter no máximo 128 caracteres' })
  password!: string;
}
