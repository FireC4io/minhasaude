import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';

const NULL_BYTE = '\u0000';

/**
 * Recusa com 400 qualquer texto com o caractere nulo, no corpo, na query ou nos
 * parâmetros. O Postgres não aceita esse caractere em texto: sem esta trava, um
 * único "\u0000" em qualquer campo virava erro 500 (achado do ZAP autenticado,
 * 11/10/2026, em POST /v1/foods e POST /v1/consents).
 */
export class RejectNullBytesPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (containsNullByte(value)) {
      throw new BadRequestException('O texto enviado tem um caractere inválido.');
    }
    return value;
  }
}

function containsNullByte(value: unknown): boolean {
  if (typeof value === 'string') return value.includes(NULL_BYTE);
  if (Array.isArray(value)) return value.some(containsNullByte);
  if (isPlainObject(value)) return Object.values(value).some(containsNullByte);
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
