import { INPUT_LIMITS } from '@minhasaude/shared';
import { parseOffProducts } from './off-product.schema';

describe('parseOffProducts (resposta do Open Food Facts)', () => {
  it('aproveita produto bom e converte número que veio como texto', () => {
    const [product] = parseOffProducts({
      products: [
        { code: '7891000100103', product_name: ' Leite integral ', brands: 'Marca', nutriments: { 'energy-kcal_100g': '61', proteins_100g: 3.2 } },
      ],
    });
    expect(product).toEqual({
      code: '7891000100103',
      product_name: 'Leite integral',
      brands: 'Marca',
      nutriments: { 'energy-kcal_100g': 61, proteins_100g: 3.2 },
    });
  });

  it('descarta valor impossível ou negativo, mantendo o resto do produto', () => {
    const [product] = parseOffProducts({
      products: [{ product_name: 'X', nutriments: { 'energy-kcal_100g': 5000, fat_100g: -1, carbohydrates_100g: 10 } }],
    });
    expect(product?.nutriments).toEqual({ carbohydrates_100g: 10 });
  });

  it('corta nome e marca nos limites do cadastro e ignora código fora do padrão GTIN', () => {
    const [product] = parseOffProducts({
      products: [{ code: 'abc', product_name: 'n'.repeat(500), brands: 'b'.repeat(500) }],
    });
    expect(product?.code).toBeUndefined();
    expect(product?.product_name).toHaveLength(INPUT_LIMITS.foodName);
    expect(product?.brands).toHaveLength(INPUT_LIMITS.foodBrand);
  });

  it('pula item que não é produto e resposta fora do formato vira lista vazia', () => {
    expect(parseOffProducts({ products: [null, 42, { product_name: 'Ok' }] })).toHaveLength(1);
    expect(parseOffProducts('<html>erro</html>')).toEqual([]);
    expect(parseOffProducts({ products: 'nada' })).toEqual([]);
  });
});
