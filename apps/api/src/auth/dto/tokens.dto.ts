import { ApiProperty } from '@nestjs/swagger';

// Formato de resposta comum a login e refresh.
export class TokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Segundos até o access token expirar' })
  expiresInSeconds!: number;
}
