import { filterByPeriod } from './period';

const NOW = new Date('2026-10-06T12:00:00Z');
const at = (iso: string) => ({ measuredAt: iso, weightKg: '70' });

describe('filterByPeriod', () => {
  const measurements = [
    at('2026-10-05T10:00:00Z'),
    at('2026-09-10T10:00:00Z'),
    at('2026-07-20T10:00:00Z'),
    at('2025-12-01T10:00:00Z'),
  ];

  it('30 dias', () => {
    expect(filterByPeriod(measurements, '30d', NOW)).toHaveLength(2);
  });

  it('3 meses', () => {
    expect(filterByPeriod(measurements, '90d', NOW)).toHaveLength(3);
  });

  it('tudo', () => {
    expect(filterByPeriod(measurements, 'all', NOW)).toHaveLength(4);
  });
});
