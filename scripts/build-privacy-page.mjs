// Gera a página pública da política de privacidade a partir do Markdown.
// Uso: node scripts/build-privacy-page.mjs <pasta de saída>
// O workflow `privacy-page.yml` roda isto e publica no GitHub Pages; o texto
// continua tendo uma fonte só: docs/legal/politica-de-privacidade.md.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'docs', 'legal', 'politica-de-privacidade.md');
const outArg = process.argv[2];
if (!outArg) {
  console.error('Uso: node scripts/build-privacy-page.mjs <pasta de saída>');
  process.exit(1);
}
// A saída fica sempre dentro da pasta atual: um argumento como ../../etc não escreve fora dela.
const outDir = resolve(outArg);
const fromCwd = relative(process.cwd(), outDir);
if (fromCwd.startsWith('..') || isAbsolute(fromCwd)) {
  console.error(`A pasta de saída precisa ficar dentro de ${process.cwd()}`);
  process.exit(1);
}

// html: false — o Markdown é nosso, mas a página não precisa aceitar HTML cru.
const md = new MarkdownIt({ html: false, linkify: true, typographer: false });
// Tabela larga rola sozinha no celular, sem empurrar a página para o lado.
md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

const STYLE = `
:root { --areia:#fbf0e4; --superficie:#fff; --linha:#e3d5c6; --grafite:#2b3a34; --suave:#5f6e67; --mamao:#b8481f; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root { --areia:#1e1712; --superficie:#2a211b; --linha:#45382f; --grafite:#f5eae0; --suave:#a39a90; --mamao:#ff8264; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--areia); color: var(--grafite); font: 18px/1.65 "Segoe UI", system-ui, -apple-system, sans-serif; }
main { max-width: 820px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 8px; }
h2 { font-size: 1.35rem; margin: 40px 0 12px; }
p, li { max-width: 70ch; }
a { color: var(--mamao); }
strong { font-weight: 650; }
.table-wrap { overflow-x: auto; margin: 16px 0; border: 1px solid var(--linha); border-radius: 12px; background: var(--superficie); }
table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--linha); }
tr:last-child td { border-bottom: 0; }
th { color: var(--suave); font-weight: 600; }
footer { margin-top: 48px; color: var(--suave); font-size: 0.9rem; }
`;

const markdown = await readFile(SOURCE, 'utf8');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Política de Privacidade · Gota Vital</title>
<meta name="description" content="Como o app Gota Vital trata seus dados pessoais, conforme a LGPD.">
<style>${STYLE}</style>
</head>
<body>
<main>
${md.render(markdown)}
<footer>Gota Vital · texto mantido em <a href="https://github.com/FireC4io/minhasaude/blob/main/docs/legal/politica-de-privacidade.md">docs/legal/politica-de-privacidade.md</a></footer>
</main>
</body>
</html>
`;

const target = join(outDir, 'privacidade', 'index.html');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, html);
// A raiz do site leva direto à política: é a única página publicada.
await writeFile(
  join(outDir, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=privacidade/"><link rel="canonical" href="privacidade/"><a href="privacidade/">Política de Privacidade do Gota Vital</a>\n',
);
console.log(`Página gerada em ${target}`);
