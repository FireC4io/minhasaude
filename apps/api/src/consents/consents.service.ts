import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consent, ConsentType } from '../database/entities/consent.entity';
import type { GrantConsentDto } from './dto/grant-consent.dto';

export interface ConsentStatus {
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
}

@Injectable()
export class ConsentsService {
  constructor(@InjectRepository(Consent) private readonly consents: Repository<Consent>) {}

  async grant(
    userId: string,
    dto: GrantConsentDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<Consent> {
    const consent = this.consents.create({
      userId,
      consentType: dto.consentType,
      policyVersion: dto.policyVersion,
      grantedAt: new Date(),
      revokedAt: null,
      ipAddress,
      userAgent,
    });
    return this.consents.save(consent);
  }

  async revoke(userId: string, consentType: ConsentType): Promise<void> {
    const latest = await this.consents.findOne({
      where: { userId, consentType },
      order: { grantedAt: 'DESC' },
    });
    if (!latest || latest.revokedAt) {
      throw new NotFoundException(`Nenhum consentimento ativo do tipo "${consentType}" encontrado.`);
    }
    latest.revokedAt = new Date();
    await this.consents.save(latest);
  }

  async listStatus(userId: string): Promise<ConsentStatus[]> {
    const types = Object.values(ConsentType);
    const statuses: ConsentStatus[] = [];
    for (const consentType of types) {
      const latest = await this.consents.findOne({
        where: { userId, consentType },
        order: { grantedAt: 'DESC' },
      });
      statuses.push({
        consentType,
        granted: !!latest && !latest.revokedAt,
        policyVersion: latest?.policyVersion ?? null,
        grantedAt: latest?.grantedAt ?? null,
        revokedAt: latest?.revokedAt ?? null,
      });
    }
    return statuses;
  }

  // Usado por GET /v1/me/export - histórico completo, não só o status atual.
  async listHistory(userId: string): Promise<Consent[]> {
    return this.consents.find({ where: { userId }, order: { grantedAt: 'DESC' } });
  }
}
