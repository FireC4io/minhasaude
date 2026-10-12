import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';

describe('readTacoRows', () => {
  const { rows } = readTacoRows(TACO_CSV_PATH);
  const feijao = rows.find((r) => r.name === 'Feijão, carioca, cozido');

  it('lê os 590 alimentos com macros medidos (582 + 8 óleos e azeites)', () => {
    expect(rows).toHaveLength(590);
  });

  it('óleo e azeite: 100 g de gordura não deixam espaço para proteína nem carboidrato', () => {
    const azeite = rows.find((r) => r.name === 'Azeite, de oliva, extra virgem');
    expect(azeite).toMatchObject({ kcalPer100g: 884, fatGPer100g: 100, proteinGPer100g: 0, carbGPer100g: 0 });
    // Só os macros ganham zero: micronutriente não medido continua null.
    expect(azeite?.micros.sodiumMg).toBeNull();
  });

  it('continua pulando o que a TACO deixou em revisão (leite de vaca)', () => {
    expect(rows.find((r) => r.name === 'Leite, de vaca, integral')).toBeUndefined();
  });

  it('extrai os micronutrientes das colunas certas (conferido com a TACO 4ª ed.)', () => {
    expect(feijao?.micros).toEqual({
      fiberG: 8.51,
      sodiumMg: 1.76,
      potassiumMg: 254.62,
      calciumMg: 26.59,
      ironMg: 1.29,
      magnesiumMg: 42.34,
      zincMg: 0.7,
      vitaminCMg: 0, // "Tr" (traço) = quantidade desprezível
      vitaminARaeMcg: null, // vazio = não medido, nunca zero
    });
  });
});
