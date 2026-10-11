#!/usr/bin/env node
/**
 * Roda o dependency-cruiser em cada pacote do monorepo.
 *
 *   node scripts/deps.mjs check   → aplica as regras de .dependency-cruiser.cjs (falha se houver violação)
 *   node scripts/deps.mjs graph   → regenera os mapas Mermaid em docs/arquitetura/dependencias.md
 *
 * Cada pacote usa o próprio tsconfig, sempre por caminho absoluto: com caminho
 * relativo o `extends` do tsconfig é resolvido a partir do lugar errado.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEPCRUISE = path.join(ROOT, 'node_modules', 'dependency-cruiser', 'bin', 'dependency-cruiser.mjs');
const CONFIG = path.join(ROOT, '.dependency-cruiser.cjs');
const OUTPUT = path.join(ROOT, 'docs', 'arquitetura', 'dependencias.md');
const TEST_FILES = '\\.(spec|test)\\.[jt]sx?$|/test/|/__mocks__/';

const PACKAGES = [
  {
    title: 'API (NestJS) — módulos de `apps/api/src`',
    src: 'apps/api/src',
    tsConfig: 'apps/api/tsconfig.json',
    collapse: '^apps/api/src/[^/]+',
  },
  {
    title: 'App (Expo) — pastas de `apps/mobile/src`',
    src: 'apps/mobile/src',
    // O tsconfig.json do mobile herda de dois arquivos e o dependency-cruiser não lê os paths assim.
    tsConfig: 'apps/mobile/tsconfig.depcruise.json',
    collapse: '^apps/mobile/src/(features|components|app)/[^/]+|^apps/mobile/src/[^/]+',
  },
  {
    title: 'Shared — `packages/shared/src`',
    src: 'packages/shared/src',
    tsConfig: 'packages/shared/tsconfig.json',
    collapse: '^packages/shared/src/[^/]+',
  },
];

function depcruise(args) {
  const result = spawnSync(process.execPath, [DEPCRUISE, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

function baseArgs(pkg) {
  return [pkg.src, '--config', CONFIG, '--ts-config', path.join(ROOT, pkg.tsConfig)];
}

function check() {
  let failed = false;
  for (const pkg of PACKAGES) {
    const result = depcruise([...baseArgs(pkg), '--output-type', 'err']);
    process.stdout.write(`\n== ${pkg.src}\n${result.stdout}${result.stderr}`);
    if (result.status !== 0) failed = true;
  }
  process.exit(failed ? 1 : 0);
}

/**
 * Grupos de rota do Expo Router, como `(app)`, viram parênteses no id do nó, e
 * o Mermaid lê parênteses como forma do nó. Troca só nos ids, nunca no rótulo.
 */
function sanitizeMermaidIds(mermaid) {
  return mermaid
    .split('\n')
    .map((line) => {
      const labelStart = line.indexOf('["');
      const ids = labelStart < 0 ? line : line.slice(0, labelStart);
      const label = labelStart < 0 ? '' : line.slice(labelStart);
      return ids.replace(/[()]/g, '_') + label;
    })
    .join('\n');
}

function graph() {
  const sections = PACKAGES.map((pkg) => {
    const result = depcruise([
      ...baseArgs(pkg),
      '--include-only',
      `^${pkg.src}/`,
      '--exclude',
      TEST_FILES,
      '--collapse',
      pkg.collapse,
      '--output-type',
      'mermaid',
    ]);
    if (result.status !== 0) {
      throw new Error(`dependency-cruiser falhou em ${pkg.src}:\n${result.stderr}`);
    }
    return `## ${pkg.title}\n\n\`\`\`mermaid\n${sanitizeMermaidIds(result.stdout.trim())}\n\`\`\`\n`;
  });

  const header = [
    '# Mapa de dependências',
    '',
    '> Gerado por `pnpm deps:graph` (dependency-cruiser) — não editar à mão.',
    '> Cada caixa é uma pasta; cada seta, "importa de". Testes ficam fora do mapa.',
    '> As regras que este mapa precisa respeitar estão em `.dependency-cruiser.cjs` e rodam no CI (`pnpm deps:check`).',
    '',
  ].join('\n');

  mkdirSync(path.dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${header}\n${sections.join('\n')}`);
  process.stdout.write(`Mapa gerado em ${path.relative(ROOT, OUTPUT)}\n`);
}

const command = process.argv[2];
if (command === 'check') check();
else if (command === 'graph') graph();
else {
  process.stderr.write('Uso: node scripts/deps.mjs <check|graph>\n');
  process.exit(2);
}
