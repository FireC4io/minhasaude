import { BadRequestException } from '@nestjs/common';
import { RejectNullBytesPipe } from './reject-null-bytes.pipe';

describe('RejectNullBytesPipe', () => {
  const pipe = new RejectNullBytesPipe();
  const meta = { type: 'body' as const };

  it('deixa passar texto comum, números e valores vazios', () => {
    const body = { name: 'Arroz, tipo 1, cozido', kcal: 128, tags: ['a', 'b'], empty: null };
    expect(pipe.transform(body, meta)).toBe(body);
    expect(pipe.transform(undefined, meta)).toBeUndefined();
  });

  it('recusa caractere nulo em texto solto (query, parâmetro)', () => {
    expect(() => pipe.transform('arroz\u0000', { type: 'query' })).toThrow(BadRequestException);
  });

  it('recusa caractere nulo em campo aninhado e em lista', () => {
    expect(() => pipe.transform({ food: { name: 'pão\u0000' } }, meta)).toThrow(BadRequestException);
    expect(() => pipe.transform({ tags: ['ok', 'x\u0000'] }, meta)).toThrow(BadRequestException);
  });

  it('não olha dentro de objetos que não são dados simples (ex.: Buffer)', () => {
    const buffer = Buffer.from([0, 1, 2]);
    expect(pipe.transform(buffer, meta)).toBe(buffer);
  });
});
