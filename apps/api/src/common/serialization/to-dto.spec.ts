import { Expose, Type } from 'class-transformer';
import { toDto, toDtoList } from './to-dto';

class NestedDto {
  @Expose()
  name!: string;
}

class SampleDto {
  @Expose()
  id!: string;

  @Expose()
  label!: string | null;

  @Expose()
  @Type(() => NestedDto)
  nested?: NestedDto;
}

describe('toDto', () => {
  it('descarta campo que o DTO não declara', () => {
    // O ponto do helper: campo interno que ninguém expôs não chega no cliente,
    // mesmo que o service devolva a entidade crua do TypeORM.
    const result = toDto(SampleDto, {
      id: 'abc',
      label: 'visível',
      userId: 'interno',
      createdAt: new Date(),
      passwordHash: 'nunca',
    });

    expect(result).toEqual({ id: 'abc', label: 'visível' });
    expect('userId' in result).toBe(false);
    expect('passwordHash' in result).toBe(false);
  });

  it('mantém null em campo declarado, em vez de sumir com a chave', () => {
    const result = toDto(SampleDto, { id: 'abc', label: null });

    expect(result.label).toBeNull();
    expect('label' in result).toBe(true);
  });

  it('filtra também dentro de objeto aninhado', () => {
    const result = toDto(SampleDto, {
      id: 'abc',
      label: 'x',
      nested: { name: 'comida', ownerUserId: 'interno', externalId: '123' },
    });

    expect(result.nested).toEqual({ name: 'comida' });
  });

  it('não muta a origem', () => {
    // Regra de imutabilidade do projeto: mapear não pode alterar a entidade
    // que o service devolveu.
    const source = { id: 'abc', label: 'x', userId: 'interno' };

    toDto(SampleDto, source);

    expect(source).toEqual({ id: 'abc', label: 'x', userId: 'interno' });
  });

  it('preserva Date como Date, pra serialização ISO do JSON não quebrar', () => {
    class DateDto {
      @Expose()
      measuredAt!: Date;
    }

    const measuredAt = new Date('2026-09-24T12:00:00.000Z');
    const result = toDto(DateDto, { measuredAt, userId: 'interno' });

    expect(result.measuredAt).toBeInstanceOf(Date);
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      measuredAt: '2026-09-24T12:00:00.000Z',
    });
  });

  it('toDtoList aplica o mesmo filtro em cada item', () => {
    const result = toDtoList(SampleDto, [
      { id: '1', label: 'a', userId: 'interno' },
      { id: '2', label: 'b', createdAt: new Date() },
    ]);

    expect(result).toEqual([
      { id: '1', label: 'a' },
      { id: '2', label: 'b' },
    ]);
  });

  it('toDtoList devolve lista vazia para entrada vazia', () => {
    expect(toDtoList(SampleDto, [])).toEqual([]);
  });
});
