// Roda pelo hook `.githooks/pre-commit`: lint (sem aviso) nos arquivos .ts/.tsx
// que estão no commit e checagem de tipos de cada pacote afetado. Bem mais
// rápido que o pipeline inteiro, e pega o que o CI recusaria.
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';

const PACKAGES = ['apps/api', 'apps/mobile', 'packages/shared'];

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { encoding: 'utf8' })
  .split('\n')
  .filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes('/generated/'));

let failed = false;
for (const pkg of PACKAGES) {
  const files = staged.filter((file) => file.startsWith(`${pkg}/`)).map((file) => file.slice(pkg.length + 1));
  if (files.length === 0) continue;
  const cwd = join(process.cwd(), pkg);
  const run = (label, args) => {
    console.log(`› ${pkg}: ${label}`);
    const result = spawnSync('npx', args, { cwd, stdio: 'inherit', shell: true });
    if (result.status !== 0) failed = true;
  };
  run('lint', ['eslint', '--max-warnings', '0', ...files.map((file) => `"${file}"`)]);
  run('tipos', ['tsc', '--noEmit']);
}

if (failed) {
  console.error('\nCommit recusado: corrija os erros acima (ou, em emergência, git commit --no-verify).');
  process.exit(1);
}
