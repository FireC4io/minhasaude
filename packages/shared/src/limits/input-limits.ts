/**
 * Tamanhos máximos dos textos que entram na API. A API recusa acima disso
 * (class-validator) e o app corta no próprio campo (`maxLength`), para a
 * pessoa nunca receber um erro que não entende.
 */
export const INPUT_LIMITS = {
  /** Senha no cadastro. O argon2 processa tudo o que chega: sem teto, vira DoS. */
  passwordNew: 128,
  /** Senha no login: mais folgado, porque o cadastro já aceitou senhas sem teto. */
  passwordLogin: 1024,
  passwordMin: 8,
  /** Termo de busca de alimento (trigramas no banco + Open Food Facts). */
  foodSearch: 100,
  foodName: 200,
  foodBrand: 120,
  barcode: 32,
  policyVersion: 32,
} as const;
