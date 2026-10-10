import { z } from 'zod';

// Falha rápido na subida da API se uma env obrigatória estiver ausente ou mal
// formatada, em vez de deixar o erro aparecer silenciosamente em runtime.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  // TLS entre a API e o banco. Em produção a conexão atravessa a internet
  // (Render → Supabase): sem TLS, senha do banco e dado de saúde vão abertos.
  // Não pôr `sslmode` na DATABASE_URL: ele passaria por cima desta escolha.
  DATABASE_SSL: z.enum(['disable', 'require', 'verify-full']).default('disable'),
  // Certificado da autoridade do Supabase (Settings → Database → SSL). O Render
  // guarda a variável numa linha só, então "\n" literal vira quebra de linha.
  DATABASE_SSL_CA: z
    .string()
    .optional()
    .transform((value) => value?.replace(/\\n/g, '\n')),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET deve ter pelo menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // Quantos proxies confiáveis ficam na frente da API. No Render é 1: o proxy
  // acrescenta o IP real ao fim do X-Forwarded-For. Sem isso, o limite de
  // tentativas vê o IP do proxy e junta todo mundo num balde só. Nunca usar
  // `true` (confiar em tudo): aí o cliente forja o próprio IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  // Opcional: sem ela, a API loga normalmente em stdout sem encaminhar pro BetterStack.
  BETTERSTACK_SOURCE_TOKEN: z.string().optional(),
});

const checkedEnvSchema = envSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production' && env.DATABASE_SSL === 'disable') {
    ctx.addIssue({
      code: 'custom',
      path: ['DATABASE_SSL'],
      message: 'em produção a conexão com o banco precisa de TLS (use verify-full)',
    });
  }
  if (env.DATABASE_SSL === 'verify-full' && !env.DATABASE_SSL_CA) {
    ctx.addIssue({
      code: 'custom',
      path: ['DATABASE_SSL_CA'],
      message: 'verify-full precisa do certificado da autoridade do banco',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = checkedEnvSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Env inválida:\n${issues}`);
  }
  return parsed.data;
}
