// `pnpm install` liga os hooks de .githooks/ neste clone. Fora de um repositório
// git (build do EAS, por exemplo) não faz nada e não quebra a instalação.
import { execFileSync } from 'node:child_process';

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  // Sem git ou sem repositório: nada a ligar.
}
