import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consent, ConsentType } from '../database/entities/consent.entity';
import type { GrantConsentDto } from './dto/grant-consent.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../database/entities/audit-event.entity';

export interface ConsentStatus {
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
}

@Injectable()
export class ConsentsService {
  constructor(
    @InjectRepository(Consent) private readonly consents: Repository<Consent>,
    private readonly audit: AuditService,
  ) {}

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
    await this.audit.record(userId, AuditAction.CONSENT_REVOKED, { consentType });
  }

  async listStatus(userId: string): Promise<ConsentStatus[]> {
    // Uma consulta só: o histórico vem do mais novo para o mais antigo, e o
    // primeiro de cada tipo é o que vale.
    const history = await this.listHistory(userId);
    return Object.values(ConsentType).map((consentType) => {
      const latest = history.find((consent) => consent.consentType === consentType);
      return {
        consentType,
        granted: !!latest && !latest.revokedAt,
        policyVersion: latest?.policyVersion ?? null,
        grantedAt: latest?.grantedAt ?? null,
        revokedAt: latest?.revokedAt ?? null,
      };
    });
  }

  // Usado por GET /v1/me/export - histórico completo, não só o status atual.
  async listHistory(userId: string): Promise<Consent[]> {
    return this.consents.find({ where: { userId }, order: { grantedAt: 'DESC' } });
  }
}
