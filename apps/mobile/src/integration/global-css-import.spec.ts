import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// O Jest não roda o NativeWind, então nenhum teste de tela nota se o CSS
// sumir. Já aconteceu: o import vivia num arquivo do template e, quando ele
// foi apagado (F4-06), o app inteiro perdeu o estilo com 170 testes verdes.
describe('global.css', () => {
  it('é importado pelo layout raiz, que é sempre carregado', () => {
    const rootLayout = readFileSync(join(__dirname, '../app/_layout.tsx'), 'utf8');

    expect(rootLayout).toMatch(/^import '@\/global\.css';$/m);
  });
});
