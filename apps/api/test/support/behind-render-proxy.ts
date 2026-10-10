// Precisa vir antes do import do AppModule: o ConfigModule lê o ambiente no
// momento em que o módulo é importado, não quando a aplicação sobe.
process.env.TRUST_PROXY_HOPS = '1';
