import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/jwt-payload.interface';

// Guard global (registrado como APP_GUARD em AuthModule) - toda rota exige
// access token válido por padrão, exceto as marcadas com @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }

    // Assinatura válida não basta: a conta pode ter sido apagada (ou estar
    // sendo) depois que o token foi emitido, e ele ainda valeria até expirar.
    const active = await this.users.exists({
      where: { id: payload.sub, status: UserStatus.ACTIVE },
    });
    if (!active) {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }

    request.user = payload;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
