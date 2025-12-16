/**
 * Sistema de Cache em Memória
 * Cache simples com TTL (Time To Live) para melhorar performance
 */

/**
 * Store do cache
 * Estrutura: { key: { data, expiresAt } }
 */
const cacheStore = new Map();

/**
 * Estatísticas do cache
 */
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  clears: 0
};

/**
 * Limpar entradas expiradas periodicamente
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cacheStore.entries()) {
    if (value.expiresAt < now) {
      cacheStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    cacheStats.clears += cleaned;
  }
}, 60 * 1000); // Limpar a cada 1 minuto

/**
 * Gerar chave de cache
 * @param {string} prefix - Prefixo da chave
 * @param {object} params - Parâmetros para gerar a chave
 * @returns {string} Chave de cache
 */
function generateCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

/**
 * Obter valor do cache
 * @param {string} key - Chave do cache
 * @returns {any|null} Valor do cache ou null se não existir/expirado
 */
function get(key) {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    cacheStats.misses++;
    return null;
  }
  
  // Verificar se expirou
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key);
    cacheStats.misses++;
    return null;
  }
  
  cacheStats.hits++;
  return entry.data;
}

/**
 * Armazenar valor no cache
 * @param {string} key - Chave do cache
 * @param {any} data - Dados para armazenar
 * @param {number} ttlMs - Tempo de vida em milissegundos
 */
function set(key, data, ttlMs = 5 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  cacheStore.set(key, { data, expiresAt });
  cacheStats.sets++;
}

/**
 * Remover valor do cache
 * @param {string} key - Chave do cache
 */
function del(key) {
  if (cacheStore.delete(key)) {
    cacheStats.deletes++;
  }
}

/**
 * Limpar cache por prefixo
 * @param {string} prefix - Prefixo para limpar
 */
function clearByPrefix(prefix) {
  let deleted = 0;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
      deleted++;
    }
  }
  if (deleted > 0) {
    cacheStats.deletes += deleted;
  }
  return deleted;
}

/**
 * Limpar todo o cache
 */
function clear() {
  const size = cacheStore.size;
  cacheStore.clear();
  cacheStats.clears += size;
}

/**
 * Obter estatísticas do cache
 * @returns {object} Estatísticas do cache
 */
function getStats() {
  const now = Date.now();
  let expired = 0;
  
  for (const entry of cacheStore.values()) {
    if (entry.expiresAt < now) {
      expired++;
    }
  }
  
  const totalRequests = cacheStats.hits + cacheStats.misses;
  const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests * 100).toFixed(2) : 0;
  
  return {
    size: cacheStore.size,
    expired,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    sets: cacheStats.sets,
    deletes: cacheStats.deletes,
    clears: cacheStats.clears,
    hitRate: `${hitRate}%`,
    totalRequests
  };
}

/**
 * Obter todas as chaves do cache (para debug)
 * @returns {Array<string>} Lista de chaves
 */
function getKeys() {
  return Array.from(cacheStore.keys());
}

module.exports = {
  generateCacheKey,
  get,
  set,
  del,
  clearByPrefix,
  clear,
  getStats,
  getKeys
};

