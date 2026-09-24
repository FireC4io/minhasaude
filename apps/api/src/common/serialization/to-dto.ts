import { plainToInstance, type ClassConstructor } from 'class-transformer';

/**
 * Converte a entidade que o service devolveu no DTO de resposta, descartando
 * qualquer campo que o DTO não declare com `@Expose()`.
 *
 * Existe porque os controllers retornavam a entidade crua do TypeORM: o DTO
 * descrevia o contrato no Swagger, mas não filtrava nada de verdade, então
 * campos internos (`userId`, `ownerUserId`, `createdAt`...) viajavam pro
 * cliente. Com `excludeExtraneousValues`, o DTO passa a ser a única fonte da
 * verdade — campo não declarado não sai, mesmo que alguém adicione uma coluna
 * nova na entidade depois.
 *
 * Mapear é responsabilidade da borda HTTP (controller), não do service: assim
 * o domínio segue desacoplado do transporte e os services continuam
 * reutilizáveis por quem precisa da entidade inteira (ex.: `GET /v1/me/export`).
 */
export function toDto<T>(cls: ClassConstructor<T>, source: unknown): T {
  return plainToInstance(cls, source, { excludeExtraneousValues: true });
}

export function toDtoList<T>(cls: ClassConstructor<T>, sources: readonly unknown[]): T[] {
  return sources.map((source) => toDto(cls, source));
}
