import { AuditAction } from '../database/entities/audit-event.entity';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('grava a ação com o detalhe mínimo', async () => {
    const events = { insert: jest.fn(async () => undefined) };
    const service = new AuditService(events as never);

    await service.record('user-1', AuditAction.CONSENT_REVOKED, { consentType: 'health_data' });

    expect(events.insert).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'consent_revoked',
      details: { consentType: 'health_data' },
    });
  });

  it('falha ao gravar não impede a ação da pessoa', async () => {
    const events = { insert: jest.fn(async () => Promise.reject(new Error('banco fora do ar'))) };
    const service = new AuditService(events as never);
    jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

    await expect(service.record('user-1', AuditAction.DATA_EXPORTED)).resolves.toBeUndefined();
  });
});
