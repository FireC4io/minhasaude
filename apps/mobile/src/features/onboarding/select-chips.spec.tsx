import { render, screen, userEvent } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET } from '@/constants/accessibility';
import { SelectChips } from './select-chips';

const SEXOS = ['male', 'female'] as const;
const ROTULOS = { male: 'Masculino', female: 'Feminino' };

function montar(overrides: Partial<React.ComponentProps<typeof SelectChips<'male' | 'female'>>> = {}) {
  return (
    <SelectChips
      label="Sexo"
      options={SEXOS}
      optionLabels={ROTULOS}
      value={null}
      onChange={jest.fn()}
      {...overrides}
    />
  );
}

describe('SelectChips', () => {
  it('expõe o grupo com papel e rótulo da pergunta', async () => {
    // Sem isso o usuário ouve "Masculino, Feminino" sem saber do que se trata.
    // O grupo NÃO é `accessible`, de propósito: se fosse, viraria uma única
    // parada de foco e os chips deixariam de ser focáveis um a um. Por isso a
    // asserção é sobre as props, e não via getByRole — o container não é um
    // elemento de acessibilidade consultável.
    await render(montar());

    const grupo = screen.getByTestId('select-chips-group');

    expect(grupo).toHaveProp('accessibilityRole', 'radiogroup');
    expect(grupo).toHaveProp('accessibilityLabel', 'Sexo');
  });

  it('cada opção é anunciada como botão de rádio', async () => {
    await render(montar());

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Masculino' })).toBeTruthy();
  });

  it('marca só a opção escolhida', async () => {
    await render(montar({ value: 'female' }));

    expect(screen.getByRole('radio', { name: 'Feminino' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Masculino' })).not.toBeChecked();
  });

  it('avisa a escolha ao ser tocada', async () => {
    const onChange = jest.fn();
    await render(montar({ onChange }));

    await userEvent.press(screen.getByRole('radio', { name: 'Masculino' }));

    expect(onChange).toHaveBeenCalledWith('male');
  });

  it('respeita o alvo de toque mínimo — era o pior do app, com ~36 dp', async () => {
    await render(montar());

    expect(screen.getByRole('radio', { name: 'Masculino' })).toHaveStyle({
      minHeight: MIN_TOUCH_TARGET,
    });
  });

  it('anuncia o erro do grupo como alerta', async () => {
    await render(montar({ error: 'Escolha uma opção' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma opção');
  });
});
