import { TACO_CSV_PATH, readTacoRows } from './taco-catalog';

describe('readTacoRows', () => {
  const { rows } = readTacoRows(TACO_CSV_PATH);
  const feijao = rows.find((r) => r.name === 'Feijão, carioca, cozido');

  it('lê os 582 alimentos com macros medidos', () => {
    expect(rows).toHaveLength(582);
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
