/**
 * Utilitário de Retry Automático
 * Implementa retry com backoff exponencial para erros temporários
 */

const { isRetryableError, normalizeError } = require('./errors');
const { globalLogger } = require('./logger');

/**
 * Configuração padrão de retry
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 503, 504],
  retryableErrorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNABORTED']
};

/**
 * Calcula o delay para o próximo retry usando backoff exponencial
 */
function calculateDelay(attempt, config = DEFAULT_RETRY_CONFIG) {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Executa uma função com retry automático
 * @param {Function} fn - Função assíncrona a ser executada
 * @param {object} options - Opções de retry
 * @param {string} context - Contexto para logs (opcional)
 * @returns {Promise} Resultado da função
 */
async function withRetry(fn, options = {}, context = null) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0 && context) {
        globalLogger.info(`Retry bem-sucedido após ${attempt} tentativa(s)`, { context });
      }
      return result;
    } catch (error) {
      lastError = error;
      
      // Normalizar erro
      const normalizedError = normalizeError(error);
      
      // Verificar se é retryable
      if (!isRetryableError(normalizedError)) {
        if (context) {
          globalLogger.warn('Erro não é retryable, abortando retry', {
            context,
            error: normalizedError.message,
            code: normalizedError.code
          });
        }
        throw normalizedError;
      }
      
      // Se é a última tentativa, lançar erro
      if (attempt >= config.maxRetries) {
        if (context) {
          globalLogger.error(`Retry esgotado após ${attempt + 1} tentativa(s)`, {
            context,
            error: normalizedError.message,
            code: normalizedError.code
          });
        }
        throw normalizedError;
      }
      
      // Calcular delay para próximo retry
      const delay = calculateDelay(attempt, config);
      
      if (context) {
        globalLogger.warn(`Tentativa ${attempt + 1}/${config.maxRetries + 1} falhou, tentando novamente em ${delay}ms`, {
          context,
          error: normalizedError.message,
          code: normalizedError.code,
          delay,
          attempt: attempt + 1,
          maxRetries: config.maxRetries + 1
        });
      }
      
      // Aguardar antes do próximo retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Não deveria chegar aqui, mas por segurança
  throw lastError;
}

/**
 * Wrapper para funções que precisam de retry
 * @param {Function} fn - Função a ser envolvida
 * @param {object} retryConfig - Configuração de retry
 * @returns {Function} Função envolvida com retry
 */
function retryable(fn, retryConfig = {}) {
  return async (...args) => {
    const context = fn.name || 'unknown';
    return withRetry(
      () => fn(...args),
      retryConfig,
      context
    );
  };
}

module.exports = {
  withRetry,
  retryable,
  calculateDelay,
  DEFAULT_RETRY_CONFIG
};

