/**
 * Testes Unitários - Métricas
 */

const {
  recordRequest,
  recordBooking,
  recordError,
  recordCache,
  getMetrics,
  resetMetrics
} = require('../metrics');

describe('Métricas', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('recordRequest', () => {
    test('deve registrar requisição com sucesso', () => {
      recordRequest('INIT', null, 50, true);
      const metrics = getMetrics();
      expect(metrics.requests.total).toBe(1);
      expect(metrics.requests.byType.INIT).toBe(1);
      expect(metrics.requests.byStatus.success).toBe(1);
    });

    test('deve registrar requisição com erro', () => {
      recordRequest('data_exchange', 'SELECT_SERVICE', 100, false, 'validation');
      const metrics = getMetrics();
      expect(metrics.requests.byStatus.error).toBe(1);
      expect(metrics.requests.byActionType.SELECT_SERVICE).toBe(1);
    });

    test('deve atualizar métricas de tempo de resposta', () => {
      recordRequest('INIT', null, 50, true);
      recordRequest('INIT', null, 100, true);
      const metrics = getMetrics();
      expect(metrics.responseTime.average).toBe(75);
      expect(metrics.responseTime.min).toBe(50);
      expect(metrics.responseTime.max).toBe(100);
    });
  });

  describe('recordBooking', () => {
    test('deve registrar agendamento bem-sucedido', () => {
      recordBooking(true, 'corte_masculino', 'joao');
      const metrics = getMetrics();
      expect(metrics.bookings.total).toBe(1);
      expect(metrics.bookings.successful).toBe(1);
      expect(metrics.bookings.byService.corte_masculino).toBe(1);
      expect(metrics.bookings.byBarber.joao).toBe(1);
    });

    test('deve registrar agendamento falhado', () => {
      recordBooking(false, 'barba', 'pedro');
      const metrics = getMetrics();
      expect(metrics.bookings.failed).toBe(1);
      expect(metrics.bookings.successful).toBe(0);
    });
  });

  describe('recordError', () => {
    test('deve registrar erro', () => {
      recordError('ValidationError', 'VALIDATION_ERROR');
      const metrics = getMetrics();
      expect(metrics.errors.total).toBe(1);
      expect(metrics.errors.byType.ValidationError).toBe(1);
      expect(metrics.errors.byCode.VALIDATION_ERROR).toBe(1);
    });
  });

  describe('recordCache', () => {
    test('deve registrar cache hit', () => {
      recordCache(true);
      const metrics = getMetrics();
      expect(metrics.cache.hits).toBe(1);
      expect(metrics.cache.misses).toBe(0);
    });

    test('deve registrar cache miss', () => {
      recordCache(false);
      const metrics = getMetrics();
      expect(metrics.cache.hits).toBe(0);
      expect(metrics.cache.misses).toBe(1);
    });

    test('deve calcular hit rate corretamente', () => {
      recordCache(true);
      recordCache(true);
      recordCache(false);
      const metrics = getMetrics();
      expect(metrics.cache.hitRate).toBe('66.67%');
    });
  });

  describe('getMetrics', () => {
    test('deve retornar todas as métricas', () => {
      recordRequest('INIT', null, 50, true);
      recordBooking(true, 'corte_masculino', 'joao');
      
      const metrics = getMetrics();
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('bookings');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('timestamp');
    });
  });
});

