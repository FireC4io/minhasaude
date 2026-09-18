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

- `src/app/` — telas e rotas (Expo Router, file-based)
- `src/components/` — componentes compartilhados
- `src/global.css` — tokens da identidade "Gota Vital" (paleta clara/escura) + diretivas do Tailwind
- `tailwind.config.js` — mapeia as cores da identidade (`areia`, `grafite`, `mamao`, `couve`, `jabuticaba`, `maracuja`) para classes do NativeWind

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
