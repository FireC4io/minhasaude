import { isSwaggerEnabled } from './swagger';

describe('Swagger', () => {
  it('fica desligado em produção', () => {
    expect(isSwaggerEnabled('production')).toBe(false);
  });

  it('fica ligado no desenvolvimento e nos testes (o app gera o client a partir dele)', () => {
    expect(isSwaggerEnabled('development')).toBe(true);
    expect(isSwaggerEnabled('test')).toBe(true);
  });
});
