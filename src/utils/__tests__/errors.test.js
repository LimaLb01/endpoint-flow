/**
 * Testes Unitários - Error Classes
 */

const {
  AppError,
  ValidationError,
  CalendarError,
  WhatsAppError,
  FlowError,
  RateLimitError,
  TimeoutError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  ErrorCodes,
  normalizeError
} = require('../errors');

describe('Error Classes', () => {
  describe('AppError', () => {
    test('deve criar erro com mensagem e código', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
    });

    test('deve criar erro com statusCode customizado', () => {
      const error = new AppError('Not found', 'NOT_FOUND', 404);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    test('deve criar erro de validação', () => {
      const error = new ValidationError('Invalid data');
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    });
  });

  describe('CalendarError', () => {
    test('deve criar erro do Google Calendar', () => {
      const error = new CalendarError('Calendar API error');
      expect(error).toBeInstanceOf(CalendarError);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCodes.CALENDAR_ERROR);
    });
  });

  describe('TimeoutError', () => {
    test('deve criar erro de timeout', () => {
      const error = new TimeoutError('Service timeout');
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.statusCode).toBe(504);
      expect(error.code).toBe(ErrorCodes.TIMEOUT_ERROR);
    });
  });

  describe('normalizeError', () => {
    test('deve normalizar AppError', () => {
      const error = new ValidationError('Test');
      const normalized = normalizeError(error);
      expect(normalized).toHaveProperty('message');
      expect(normalized).toHaveProperty('code');
      expect(normalized).toHaveProperty('statusCode');
    });

    test('deve normalizar Error genérico', () => {
      const error = new Error('Generic error');
      const normalized = normalizeError(error);
      expect(normalized.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(normalized.statusCode).toBe(500);
    });

    test('deve normalizar erro desconhecido', () => {
      const normalized = normalizeError('string error');
      expect(normalized.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });
  });
});

