/**
 * Regras de arquitetura do monorepo, verificadas pelo dependency-cruiser.
 *
 * `pnpm deps:check` roda as regras (vale como gate no CI);
 * `pnpm deps:graph` regenera os mapas em docs/arquitetura/.
 *
 * Cada app é analisado com o próprio tsconfig (o mobile depende do alias `@/`).
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Ciclo entre módulos: dificulta teste e ordem de inicialização.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-nao-depende-de-app',
      severity: 'error',
      comment:
        'packages/shared é usado pela API e pelo app; não pode importar nenhum dos dois.',
      from: { path: '^packages/shared/' },
      to: { path: '^apps/' },
    },
    {
      name: 'api-e-mobile-separados',
      severity: 'error',
      comment:
        'API e app só conversam pelo contrato HTTP (OpenAPI) e pelo shared, nunca por import direto.',
      from: { path: '^apps/(api|mobile)/' },
      to: { path: '^apps/', pathNot: '^apps/$1/' },
    },
    {
      name: 'producao-nao-importa-teste',
      severity: 'warn',
      comment:
        'Código de produção não deve importar arquivo de teste.',
      from: { pathNot: '\\.(spec|test)\\.[jt]sx?$|/test/' },
      to: { path: '\\.(spec|test)\\.[jt]sx?$' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Import que não resolve para nenhum arquivo ou pacote instalado.',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|\\.expo)/' },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['main', 'types', 'typings'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts'],
    },
    reporterOptions: {
      mermaid: { minify: false },
    },
  },
};
