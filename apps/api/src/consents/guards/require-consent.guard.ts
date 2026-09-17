import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { Consent, ConsentType } from '../../database/entities/consent.entity';
import { REQUIRE_CONSENT_KEY } from '../decorators/require-consent.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.interface';

@Injectable()
export class RequireConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Consent) private readonly consents: Repository<Consent>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredType = this.reflector.getAllAndOverride<ConsentType>(REQUIRE_CONSENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredType) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const userId = request.user.sub;

    const latest = await this.consents.findOne({
      where: { userId, consentType: requiredType },
      order: { grantedAt: 'DESC' },
    });

    if (!latest || latest.revokedAt) {
      throw new ForbiddenException(
        `Consentimento "${requiredType}" é necessário para esta ação. Registre em POST /v1/consents.`,
      );
    }

    return true;
  }
}
