// Gera as imagens da Google Play a partir das capturas em `capturas/`.
// Uso (na raiz do repo, Windows com Edge): node apps/mobile/store/build-store-images.mjs
// Saída em `apps/mobile/store/play/`. Cada imagem é um HTML renderizado pelo Edge
// headless no tamanho exato pedido pela Play. Ver README.md desta pasta.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const OUT = join(HERE, 'play');
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((path) => existsSync(path));
if (!EDGE) throw new Error('Microsoft Edge não encontrado.');

const font = (path) => pathToFileURL(join(ROOT, 'node_modules', '@expo-google-fonts', path)).href;
const FONTS = `
@font-face { font-family: Fredoka; font-weight: 600; src: url(${font('fredoka/600SemiBold/Fredoka_600SemiBold.ttf')}); }
@font-face { font-family: WorkSans; font-weight: 400; src: url(${font('work-sans/400Regular/WorkSans_400Regular.ttf')}); }
@font-face { font-family: WorkSans; font-weight: 600; src: url(${font('work-sans/600SemiBold/WorkSans_600SemiBold.ttf')}); }`;

// Paleta aprovada (identidade visual de 2026-09-18).
const C = { areia: '#FBF0E4', grafite: '#2B3A34', mamao: '#FF6F4D', mamaoForte: '#B8481F', couve: '#3E8E5B' };

const DROP = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <path d="M50 8 C 66 30 82 52 82 68 C 82 86 68 96 50 96 C 32 96 18 86 18 68 C 18 52 34 30 50 8 Z" fill="${C.mamao}"/>
  <polyline points="30,64 42,64 47,50 54,80 59,64 70,64" fill="none" stroke="${C.areia}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * Capturas: frase curta no topo (sem promessa de resultado) e a tela recortada.
 * `top`/`bottom` em pixels da captura original (1080×2400): cortam a barra de
 * status, a barra de gestos e qualquer dado de conta (o Perfil mostra o e-mail).
 */
const SCREENS = [
  { file: '01-hoje', title: 'Veja quanto falta para a sua meta do dia', top: 110, bottom: 1868 },
  { file: '07-refeicoes', title: 'Anote cada refeição em poucos toques', top: 190, bottom: 1948 },
  { file: '02-busca', title: 'Ache o alimento pelo nome que você usa', top: 110, bottom: 1868 },
  { file: '03-quantidade', title: 'Calorias e nutrientes de cada porção', top: 110, bottom: 1868 },
  { file: '04-progresso', title: 'Acompanhe seu peso num gráfico simples', top: 110, bottom: 1868 },
  { file: '06-escuro', title: 'Modo escuro para descansar a vista', top: 110, bottom: 1868, dark: true },
  { file: '05-perfil', title: 'Seus dados são seus: baixe ou apague quando quiser', top: 590, bottom: 2140 },
];

function screenshotPage({ file, title, top, bottom, dark }) {
  const shot = pathToFileURL(join(HERE, 'capturas', `${file}.png`)).href;
  const scale = 860 / 1080;
  const height = Math.round((bottom - top) * scale);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  * { margin: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1920px; overflow: hidden; background: ${dark ? '#1E1712' : C.areia};
         display: flex; flex-direction: column; align-items: center; }
  h1 { font: 600 76px/1.12 Fredoka; color: ${dark ? '#F5EAE0' : C.grafite}; text-align: center;
       padding: 96px 80px 0; height: 400px; display: flex; align-items: center; }
  .shot { width: 860px; height: ${height}px; border-radius: 40px; overflow: hidden;
          box-shadow: 0 24px 60px rgba(43,58,52,.22); border: 2px solid ${dark ? '#45382f' : '#e3d5c6'}; }
  .shot img { display: block; width: 860px; margin-top: ${-Math.round(top * scale)}px; }
  </style></head><body><h1>${title}</h1><div class="shot"><img src="${shot}"></div></body></html>`;
}

function featurePage() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
  * { margin: 0; }
  body { width: 1024px; height: 500px; overflow: hidden; background: ${C.areia};
         display: flex; align-items: center; gap: 44px; padding: 0 88px; box-sizing: border-box; }
  svg { width: 220px; height: 220px; flex: none; }
  h1 { font: 600 92px/1 Fredoka; color: ${C.grafite}; }
  p { font: 400 34px/1.35 WorkSans; color: ${C.grafite}; margin-top: 18px; max-width: 560px; }
  </style></head><body>${DROP}<div><h1>Gota Vital</h1>
  <p>Anote o que come e acompanhe calorias, nutrientes e peso.</p></div></body></html>`;
}

// Ícone da loja = ícone do app (`assets/images/icon.png`), só reduzido: a Play
// pede os dois iguais.
function iconPage() {
  const icon = pathToFileURL(join(HERE, '..', 'assets', 'images', 'icon.png')).href;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; } body { width: 512px; height: 512px; overflow: hidden; }
  img { display: block; width: 512px; height: 512px; }</style></head><body><img src="${icon}"></body></html>`;
}

async function render(html, width, height, name, dir) {
  const page = join(dir, `${name}.html`);
  await writeFile(page, html);
  execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${width},${height}`, `--screenshot=${join(OUT, `${name}.png`)}`,
    '--virtual-time-budget=3000', pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  console.log(`${name}.png (${width}×${height})`);
}

await mkdir(OUT, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'gota-loja-'));
try {
  for (const [i, screen] of SCREENS.entries()) {
    await render(screenshotPage(screen), 1080, 1920, `captura-${i + 1}`, temp);
  }
  await render(featurePage(), 1024, 500, 'recurso-grafico', temp);
  await render(iconPage(), 512, 512, 'icone', temp);
} finally {
  await rm(temp, { recursive: true, force: true });
}
