/**
 * Configuração inicial para testes Jest
 */

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Suprimir logs durante testes (opcional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

