import { defineConfig } from 'orval';

// URL de onde o orval BUSCA o contrato OpenAPI ao gerar o client (só usada
// em tempo de geração, não vai pro bundle do app). Padrão: API local em dev.
// Pra gerar contra produção: API_OPENAPI_URL=https://minhasaude-api.onrender.com/docs-json pnpm generate:api
const OPENAPI_SPEC_URL = process.env.API_OPENAPI_URL ?? 'http://localhost:3000/docs-json';

export default defineConfig({
  minhaSaude: {
    input: {
      target: OPENAPI_SPEC_URL,
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/api/http-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
