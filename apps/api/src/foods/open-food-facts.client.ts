import { Injectable, Logger } from '@nestjs/common';
import { parseOffProducts, type OffProduct } from './off-product.schema';

export type { OffNutriments, OffProduct } from './off-product.schema';

// API pública do Open Food Facts (licença ODbL - crédito obrigatório, ver
// CLAUDE.md). Só a busca por termo livre (v1, `cgi/search.pl`) suporta
// full-text search; a v2/v3 é só busca estruturada por tag.
const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const REQUEST_TIMEOUT_MS = 5000;
const MAX_RESULTS = 20;

@Injectable()
export class OpenFoodFactsClient {
  private readonly logger = new Logger(OpenFoodFactsClient.name);

  async searchByTerm(query: string): Promise<OffProduct[]> {
    const url = new URL(SEARCH_URL);
    url.searchParams.set('search_terms', query);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', String(MAX_RESULTS));
    url.searchParams.set('fields', 'code,product_name,brands,nutriments');

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'MinhaSaude/0.1 (github.com/FireC4io/minhasaude)' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      this.logger.warn(`Open Food Facts indisponível: ${(error as Error).message}`);
      return [];
    }

    if (!response.ok) {
      this.logger.warn(`Open Food Facts retornou ${response.status} para a busca "${query}"`);
      return [];
    }

    try {
      // Dado de fora: validado campo a campo antes de virar alimento (off-product.schema).
      return parseOffProducts(await response.json());
    } catch {
      this.logger.warn('Open Food Facts respondeu algo que não é JSON');
      return [];
    }
  }
}
