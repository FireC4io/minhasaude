import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { EMAIL_LANGUAGES, type EmailLanguage } from '../password-reset/password-reset-email';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail({}, { message: 'email deve ser um endereço válido' })
  email!: string;

  @ApiPropertyOptional({ enum: EMAIL_LANGUAGES, description: 'Idioma do e-mail (o do app)' })
  @IsOptional()
  @IsIn(EMAIL_LANGUAGES)
  language?: EmailLanguage;
}
