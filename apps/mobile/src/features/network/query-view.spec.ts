import { queryView } from './query-view';

describe('queryView', () => {
  it('com dado em mãos mostra o dado, mesmo se a atualização falhou (cópia no celular, sem internet)', () => {
    expect(queryView({ isPending: false, data: { kcal: 1 } })).toBe('data');
  });

  it('carregando pela primeira vez, sem dado nenhum', () => {
    expect(queryView({ isPending: true, data: undefined })).toBe('loading');
  });

  it('sem dado e sem estar carregando: erro', () => {
    expect(queryView({ isPending: false, data: undefined })).toBe('error');
  });

  it('lista vazia é dado, não erro', () => {
    expect(queryView({ isPending: false, data: [] })).toBe('data');
  });
});
