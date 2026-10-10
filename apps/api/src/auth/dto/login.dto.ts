import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

export class LoginDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'password é obrigatório' })
  // Mais folgado que o do cadastro, que antes não tinha teto: não trancar quem já existe.
  @MaxLength(INPUT_LIMITS.passwordLogin, { message: 'password longo demais' })
  password!: string;
}
