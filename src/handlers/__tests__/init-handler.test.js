/**
 * Testes Unitários - Init Handler
 */

const { handleInit } = require('../init-handler');

describe('Init Handler', () => {
  test('deve retornar resposta de inicialização válida', () => {
    const result = handleInit();
    
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('screen');
    expect(result.version).toBe('3.0');
    expect(result.screen).toBe('SERVICE_SELECTION');
  });
});

