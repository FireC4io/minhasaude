import type { TlsOptions } from 'node:tls';

import type { Env } from '../config/env.schema';

/**
 * Opção `ssl` do driver do Postgres a partir de DATABASE_SSL.
 * - disable: sem TLS — só para o banco local do docker;
 * - require: cifra, mas aceita qualquer certificado (não protege contra
 *   alguém no meio do caminho fingindo ser o banco);
 * - verify-full: cifra e confere o certificado contra a autoridade do Supabase.
 */
export function databaseSsl(mode: Env['DATABASE_SSL'], ca?: string): false | TlsOptions {
  switch (mode) {
    case 'disable':
      return false;
    case 'require':
      return { rejectUnauthorized: false };
    case 'verify-full':
      return { rejectUnauthorized: true, ca };
  }
}
