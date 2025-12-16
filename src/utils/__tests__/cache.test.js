/**
 * Testes Unitários - Cache
 */

const {
  generateCacheKey,
  get,
  set,
  del,
  clearByPrefix,
  clear,
  getStats,
  getKeys
} = require('../cache');

describe('Cache', () => {
  beforeEach(() => {
    clear();
  });

  describe('generateCacheKey', () => {
    test('deve gerar chave única para parâmetros diferentes', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2 });
      const key2 = generateCacheKey('test', { a: 2, b: 1 });
      expect(key1).not.toBe(key2);
    });

    test('deve gerar chave igual para parâmetros iguais em ordem diferente', () => {
      const key1 = generateCacheKey('test', { a: 1, b: 2 });
      const key2 = generateCacheKey('test', { b: 2, a: 1 });
      expect(key1).toBe(key2);
    });
  });

  describe('get e set', () => {
    test('deve retornar null para chave inexistente', () => {
      const result = get('inexistente');
      expect(result).toBeNull();
    });

    test('deve armazenar e recuperar valor', () => {
      set('test', 'value', 1000);
      const result = get('test');
      expect(result).toBe('value');
    });

    test('deve retornar null após expiração', (done) => {
      set('test', 'value', 100); // 100ms
      setTimeout(() => {
        const result = get('test');
        expect(result).toBeNull();
        done();
      }, 150);
    });
  });

  describe('del', () => {
    test('deve remover chave do cache', () => {
      set('test', 'value');
      expect(get('test')).toBe('value');
      del('test');
      expect(get('test')).toBeNull();
    });
  });

  describe('clearByPrefix', () => {
    test('deve limpar todas as chaves com prefixo', () => {
      set('prefix:key1', 'value1');
      set('prefix:key2', 'value2');
      set('other:key1', 'value3');
      
      const deleted = clearByPrefix('prefix:');
      expect(deleted).toBe(2);
      expect(get('prefix:key1')).toBeNull();
      expect(get('prefix:key2')).toBeNull();
      expect(get('other:key1')).toBe('value3');
    });
  });

  describe('getStats', () => {
    test('deve retornar estatísticas corretas', () => {
      // Limpar stats antes do teste
      const initialStats = getStats();
      const initialHits = initialStats.hits;
      const initialMisses = initialStats.misses;
      
      set('key1', 'value1');
      get('key1'); // hit
      get('key2'); // miss
      
      const stats = getStats();
      expect(stats.hits).toBe(initialHits + 1);
      expect(stats.misses).toBe(initialMisses + 1);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});

