// Gera as páginas públicas (política de privacidade e como apagar a conta) a
// partir do Markdown, sempre em `_site/` na raiz do repo.
// Uso: node scripts/build-privacy-page.mjs
// O workflow `privacy-page.yml` roda isto e publica no GitHub Pages; cada texto
// continua tendo uma fonte só, em docs/legal/.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// A Play exige um link da web para pedir a exclusão da conta sem o app.
const PAGES = [
  {
    source: 'politica-de-privacidade.md',
    slug: 'privacidade',
    title: 'Política de Privacidade · Gota Vital',
    description: 'Como o app Gota Vital trata seus dados pessoais, conforme a LGPD.',
  },
  {
    source: 'excluir-conta.md',
    slug: 'excluir-conta',
    title: 'Apagar sua conta · Gota Vital',
    description: 'Como apagar sua conta do Gota Vital e o que acontece com seus dados.',
  },
];
// Pasta fixa: o script não aceita caminho de fora, então não há como escrever
// fora do repositório.
const outDir = join(ROOT, '_site');

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

function renderPage({ source, title, description }, markdown) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<style>${STYLE}</style>
</head>
<body>
<main>
${md.render(markdown)}
<footer>Gota Vital · texto mantido em <a href="https://github.com/FireC4io/minhasaude/blob/main/docs/legal/${source}">docs/legal/${source}</a></footer>
</main>
</body>
</html>
`;
}

for (const page of PAGES) {
  const markdown = await readFile(join(ROOT, 'docs', 'legal', page.source), 'utf8');
  const target = join(outDir, page.slug, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, renderPage(page, markdown));
  console.log(`Página gerada em ${target}`);
}

// A raiz do site leva direto à política.
await writeFile(
  join(outDir, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=privacidade/"><link rel="canonical" href="privacidade/"><a href="privacidade/">Política de Privacidade do Gota Vital</a>\n',
);
