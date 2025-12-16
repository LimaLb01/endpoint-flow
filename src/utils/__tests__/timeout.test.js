/**
 * Testes Unitários - Timeout
 */

const {
  withTimeout,
  createTimeoutPromise,
  DEFAULT_TIMEOUT_MS,
  GOOGLE_CALENDAR_TIMEOUT_MS,
  WHATSAPP_API_TIMEOUT_MS
} = require('../timeout');
const { TimeoutError } = require('../errors');

describe('Timeout', () => {
  describe('createTimeoutPromise', () => {
    test('deve rejeitar com TimeoutError após timeout', async () => {
      const timeoutPromise = createTimeoutPromise(100, 'Test Service');
      
      await expect(timeoutPromise).rejects.toThrow(TimeoutError);
      await expect(timeoutPromise).rejects.toThrow('Test Service');
    });
  });

  describe('withTimeout', () => {
    test('deve retornar resultado se Promise resolver antes do timeout', async () => {
      const fastPromise = Promise.resolve('success');
      const result = await withTimeout(fastPromise, 1000, 'Test');
      expect(result).toBe('success');
    });

    test('deve lançar TimeoutError se Promise demorar mais que timeout', async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('success'), 200));
      
      await expect(
        withTimeout(slowPromise, 100, 'Test Service')
      ).rejects.toThrow(TimeoutError);
    });

    test('deve propagar erros da Promise original', async () => {
      const errorPromise = Promise.reject(new Error('Original error'));
      
      await expect(
        withTimeout(errorPromise, 1000, 'Test')
      ).rejects.toThrow('Original error');
    });
  });

  describe('Constantes de Timeout', () => {
    test('deve ter timeout padrão configurado', () => {
      expect(DEFAULT_TIMEOUT_MS).toBeGreaterThan(0);
    });

    test('deve ter timeout para Google Calendar configurado', () => {
      expect(GOOGLE_CALENDAR_TIMEOUT_MS).toBeGreaterThan(0);
    });

    test('deve ter timeout para WhatsApp API configurado', () => {
      expect(WHATSAPP_API_TIMEOUT_MS).toBeGreaterThan(0);
    });
  });
});

