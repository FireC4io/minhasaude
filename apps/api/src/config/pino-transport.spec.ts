import { logtailOptions } from './pino-transport';

describe('logtailOptions', () => {
  const previous = process.env.BETTERSTACK_INGESTING_HOST;
  afterEach(() => {
    process.env.BETTERSTACK_INGESTING_HOST = previous;
  });

  it('sem host, usa o endereço padrão da biblioteca', () => {
    delete process.env.BETTERSTACK_INGESTING_HOST;
    expect(logtailOptions()).toBeUndefined();
  });

  it('com o host da source, envia para ele por HTTPS', () => {
    process.env.BETTERSTACK_INGESTING_HOST = ' s123.eu-nbg-2.betterstackdata.com ';
    expect(logtailOptions()).toEqual({ endpoint: 'https://s123.eu-nbg-2.betterstackdata.com' });
  });

  it('aceita o endereço já com https://', () => {
    process.env.BETTERSTACK_INGESTING_HOST = 'https://s123.us-east-9.betterstackdata.com';
    expect(logtailOptions()).toEqual({ endpoint: 'https://s123.us-east-9.betterstackdata.com' });
  });
});
