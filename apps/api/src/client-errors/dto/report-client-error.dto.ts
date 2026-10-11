import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { INPUT_LIMITS } from '@minhasaude/shared';

export const CLIENT_PLATFORMS = ['android', 'ios', 'web'] as const;
export type ClientPlatform = (typeof CLIENT_PLATFORMS)[number];

/** Só campos técnicos: nenhum dado de saúde, nome ou e-mail entra por aqui. */
export class ReportClientErrorDto {
  @ApiProperty({ example: "TypeError: Cannot read property 'kcal' of undefined" })
  @IsString()
  @MaxLength(INPUT_LIMITS.clientErrorMessage)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(INPUT_LIMITS.clientErrorStack)
  stack?: string;

  // Rota do expo-router (`/(app)`, `/exam/[id]`): sem pontos, então sem `../`.
  @ApiProperty({ example: '/(app)' })
  @IsString()
  @MaxLength(INPUT_LIMITS.clientErrorScreen)
  @Matches(/^\/[\w\-/()[\]]*$/, { message: 'screen deve ser uma rota do app' })
  screen!: string;

  // `formatAppVersion` do app: "1.0.0" ou "1.0.0 (2)".
  @ApiProperty({ example: '1.0.0 (2)' })
  @IsString()
  @MaxLength(INPUT_LIMITS.appVersion)
  @Matches(/^\d{1,4}\.\d{1,4}\.\d{1,4}( \(\d{1,9}\))?$/, { message: 'appVersion fora do formato' })
  appVersion!: string;

  @ApiProperty({ enum: CLIENT_PLATFORMS })
  @IsIn(CLIENT_PLATFORMS)
  platform!: ClientPlatform;

  @ApiProperty({ description: 'true quando o erro derrubou a tela' })
  @IsBoolean()
  fatal!: boolean;
}
