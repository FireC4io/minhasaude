import {
  LOGIN_BLOCK_MS,
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  LoginAttemptLimiter,
} from './login-attempt-limiter';

describe('LoginAttemptLimiter', () => {
  let now = 0;
  let limiter: LoginAttemptLimiter;

  beforeEach(() => {
    now = 1_000_000;
    limiter = new LoginAttemptLimiter(() => now);
  });

  const failTimes = (email: string, times: number) => {
    for (let i = 0; i < times; i++) limiter.recordFailure(email);
  };

  it(`bloqueia o e-mail depois de ${LOGIN_MAX_FAILURES} senhas erradas`, () => {
    failTimes('maria@exemplo.com', LOGIN_MAX_FAILURES - 1);
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(false);

    limiter.recordFailure('maria@exemplo.com');
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(true);
  });

  it('não diferencia maiúsculas nem espaços nas pontas', () => {
    failTimes('Maria@Exemplo.com ', LOGIN_MAX_FAILURES);
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(true);
  });

  it('o bloqueio acaba sozinho', () => {
    failTimes('maria@exemplo.com', LOGIN_MAX_FAILURES);
    now += LOGIN_BLOCK_MS + 1;
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(false);
  });

  it('erros espalhados além da janela não se somam', () => {
    failTimes('maria@exemplo.com', LOGIN_MAX_FAILURES - 1);
    now += LOGIN_WINDOW_MS + 1;
    limiter.recordFailure('maria@exemplo.com');
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(false);
  });

  it('acertar a senha zera a contagem', () => {
    failTimes('maria@exemplo.com', LOGIN_MAX_FAILURES - 1);
    limiter.recordSuccess('maria@exemplo.com');
    limiter.recordFailure('maria@exemplo.com');
    expect(limiter.isBlocked('maria@exemplo.com')).toBe(false);
  });

  it('um e-mail bloqueado não afeta outro', () => {
    failTimes('maria@exemplo.com', LOGIN_MAX_FAILURES);
    expect(limiter.isBlocked('joao@exemplo.com')).toBe(false);
  });

  it('esquece registros vencidos para a memória não crescer sem fim', () => {
    failTimes('maria@exemplo.com', 1);
    now += LOGIN_WINDOW_MS + LOGIN_BLOCK_MS + 1;
    limiter.recordFailure('outro@exemplo.com');
    expect(limiter.size()).toBe(1);
  });
});
