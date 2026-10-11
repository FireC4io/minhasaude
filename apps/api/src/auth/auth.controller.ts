import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { TokensDto } from './dto/tokens.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { PasswordResetService } from './password-reset/password-reset.service';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { GoogleAuthService } from './google/google-auth.service';
import type { JwtPayload } from './types/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordReset: PasswordResetService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Cria uma conta nova' })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Autentica e retorna access + refresh token' })
  @ApiOkResponse({ type: TokensDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('google')
  @ApiOperation({
    summary: 'Entra com o Google (cria a conta na primeira vez)',
    description: 'Recebe o ID token do aparelho. Token inválido ou e-mail não confirmado no Google: 401.',
  })
  @ApiOkResponse({ type: TokensDto })
  google(@Body() dto: GoogleSignInDto) {
    return this.googleAuth.signIn(dto.idToken);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotaciona o refresh token e emite um novo par de tokens' })
  @ApiOkResponse({ type: TokensDto })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password-reset/request')
  @ApiOperation({
    summary: 'Manda por e-mail um código para criar senha nova',
    description: 'Responde 204 exista a conta ou não, para não revelar quem tem cadastro.',
  })
  @ApiNoContentResponse()
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<void> {
    await this.passwordReset.request(dto.email, dto.language);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password-reset/confirm')
  @ApiOperation({
    summary: 'Troca a senha usando o código do e-mail',
    description: 'Encerra todas as sessões abertas. Código errado, vencido ou já usado: 400.',
  })
  @ApiNoContentResponse()
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto): Promise<void> {
    await this.passwordReset.confirm(dto.email, dto.code, dto.newPassword);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiOperation({ summary: 'Revoga o refresh token informado' })
  @ApiNoContentResponse()
  async logout(@CurrentUser() user: JwtPayload, @Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(user.sub, dto.refreshToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário autenticado a partir do access token' })
  me(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
