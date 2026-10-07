import { render, screen } from '@testing-library/react-native';

import { ComponentCatalog } from './component-catalog';

describe('ComponentCatalog', () => {
  it('mostra os componentes base nos dois temas', async () => {
    await render(<ComponentCatalog />);

    expect(screen.getByText('Tema claro')).toBeTruthy();
    expect(screen.getByText('Tema escuro')).toBeTruthy();
    // Um botão primário habilitado por tema.
    expect(screen.getAllByRole('button', { name: 'Salvar' })).toHaveLength(2);
  });

  it('inclui os estados desabilitado e carregando de cada botão', async () => {
    await render(<ComponentCatalog />);

    const desabilitados = screen.getAllByRole('button', { name: 'Salvar (desabilitado)' });
    expect(desabilitados[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Salvando' })[0]).toBeBusy();
    expect(screen.getAllByRole('button', { name: 'Copiando…' })[0]).toBeBusy();
  });

  it('mostra erro de campo, de formulário e chip selecionado', async () => {
    await render(<ComponentCatalog />);

    expect(screen.getAllByText('Informe um e-mail válido.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Não foi possível salvar. Tente de novo.').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole('radio', { name: 'Feminino', checked: true })).toHaveLength(2);
  });
});
