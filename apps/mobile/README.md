# Minha Saúde — mobile

App mobile (Expo + Expo Router + NativeWind) do Minha Saúde. Ver `docs/backlog-fase3.md` na raiz do monorepo para o backlog completo da Fase 3 e `docs/adr/0008-estilizacao-mobile-nativewind.md` para a decisão de estilização.

## Setup local

1. Instalar tudo a partir da raiz do monorepo (não dentro de `apps/mobile`):

   ```bash
   pnpm install
   ```

2. Subir o Metro bundler:

   ```bash
   pnpm --filter mobile start
   ```

3. Abrir no device: escanear o QR code com o app **Expo Go** (Android/iOS), ou pressionar `a`/`i`/`w` no terminal para emulador Android, simulador iOS ou web.

## Estrutura

- `src/app/(auth)/` — telas de login/registro (Expo Router, sem tab bar)
- `src/app/(app)/` — telas internas, atrás do guard de autenticação (tab bar via `AppTabs`)
- `src/app/_layout.tsx` — guard de rota: `Stack.Protected` decide entre `(app)` e `(auth)` a partir de `useAuth().isAuthenticated`
- `src/features/auth/` — `AuthProvider`/`useAuth` (login, registro, logout, sessão persistida)
- `src/api/generated/` — client + hooks do TanStack Query gerados pelo orval (**nunca editar à mão**, ver `pnpm generate:api` abaixo)
- `src/api/http-client.ts` — instância do axios usada pelo client gerado: anexa o access token, renova automaticamente num 401 e repete a chamada original
- `src/api/token-storage.ts` — tokens guardados via `expo-secure-store` (nunca `AsyncStorage` puro — dado sensível de autenticação)
- `src/components/` — componentes compartilhados
- `src/global.css` — tokens da identidade "Gota Vital" (paleta clara/escura) + diretivas do Tailwind
- `tailwind.config.js` — mapeia as cores da identidade (`areia`, `grafite`, `mamao`, `couve`, `jabuticaba`, `maracuja`) para classes do NativeWind

## Client HTTP (orval)

O client + os hooks em `src/api/generated/` são gerados a partir do contrato OpenAPI da API — nunca editados à mão. Pra regenerar depois de qualquer mudança no contrato (ver `orval.config.ts`):

```bash
pnpm --filter mobile generate:api
```

Por padrão busca o spec em `http://localhost:3000/docs-json` (API local rodando via `pnpm --filter api start:dev`, com Postgres do `docker compose up -d` na raiz). Pra gerar contra produção:

```bash
API_OPENAPI_URL=https://minhasaude-api.onrender.com/docs-json pnpm --filter mobile generate:api
```

Copie `.env.example` para `.env.local` para configurar `EXPO_PUBLIC_API_URL` (URL que o app chama em runtime — padrão é produção; aponte pra API local durante o desenvolvimento).

## Pacotes do monorepo

- `@minhasaude/config` — `tsconfig.base.json` e preset de ESLint compartilhados com `apps/api` (não duplicar configuração aqui)
- `@minhasaude/shared` — enums, schemas Zod e calculadoras de saúde compartilhadas com a API; importado normalmente (`import { mifflinStJeor } from '@minhasaude/shared'`), resolvido pelo Metro via workspace do pnpm

## EAS Build

`eas.json` já tem os profiles `development`, `preview` e `production`. Gerar um dev client instalável em device real (requer login numa conta Expo — passo manual, não roda em CI):

```bash
pnpm --filter mobile exec eas build --profile development --platform android
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm --filter mobile start` | Metro bundler (Expo Go ou dev client) |
| `pnpm --filter mobile lint` | ESLint (`@minhasaude/config` + regras do Expo) |
| `pnpm --filter mobile test` | Jest (`jest-expo`) |
| `pnpm --filter mobile build` | `expo export` — bundle de produção em `dist/`, usado pelo pipeline do Turborepo |
| `pnpm --filter mobile generate:api` | Regenera `src/api/generated/` a partir do contrato OpenAPI (orval) |
