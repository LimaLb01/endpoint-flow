/**
 * Utilitário para Timeout em Requisições Externas
 * Previne que requisições travem o servidor
 */

const { TimeoutError } = require('./errors');
const { globalLogger } = require('./logger');

/**
 * Timeout padrão para requisições externas (10 segundos)
 */
const DEFAULT_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);

/**
 * Timeout para requisições do Google Calendar (15 segundos)
 */
const GOOGLE_CALENDAR_TIMEOUT_MS = parseInt(process.env.GOOGLE_CALENDAR_TIMEOUT_MS || '15000', 10);

/**
 * Timeout para requisições do WhatsApp API (10 segundos)
 */
const WHATSAPP_API_TIMEOUT_MS = parseInt(process.env.WHATSAPP_API_TIMEOUT_MS || '10000', 10);

/**
 * Cria uma Promise que rejeita após o timeout especificado
 * @param {number} timeoutMs - Timeout em milissegundos
 * @param {string} serviceName - Nome do serviço (para mensagens de erro)
 * @returns {Promise} Promise que rejeita com TimeoutError
 */
function createTimeoutPromise(timeoutMs, serviceName = 'Serviço') {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(serviceName, timeoutMs));
    }, timeoutMs);
  });
}

/**
 * Executa uma função assíncrona com timeout
 * @param {Promise} promise - Promise a ser executada
 * @param {number} timeoutMs - Timeout em milissegundos
 * @param {string} serviceName - Nome do serviço (para mensagens de erro)
 * @param {string} requestId - Request ID para logs (opcional)
 * @returns {Promise} Promise que resolve ou rejeita com TimeoutError
 */
async function withTimeout(promise, timeoutMs, serviceName = 'Serviço', requestId = null) {
  const logger = requestId ? require('./logger').createRequestLogger(requestId) : globalLogger;
  
  logger.debug('Executando operação com timeout', {
    service: serviceName,
    timeoutMs
  });
  
  try {
    const result = await Promise.race([
      promise,
      createTimeoutPromise(timeoutMs, serviceName)
    ]);
    
    return result;
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.warn('Timeout em requisição externa', {
        service: serviceName,
        timeoutMs,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Configura timeout para cliente do Google Calendar
 * @param {object} calendarClient - Cliente do Google Calendar
 * @returns {object} Cliente configurado com timeout
 */
function configureGoogleCalendarTimeout(calendarClient) {
  // O googleapis usa axios internamente
  // Podemos configurar timeout através das opções do cliente
  // Mas como o cliente já está criado, vamos usar withTimeout nas chamadas
  
  return calendarClient;
}

/**
 * Wrapper para requisições do Google Calendar com timeout
 * @param {Function} operation - Função assíncrona que faz a requisição
 * @param {string} operationName - Nome da operação (para logs)
 * @param {string} requestId - Request ID para logs (opcional)
 * @returns {Promise} Resultado da operação ou TimeoutError
 */
async function withGoogleCalendarTimeout(operation, operationName = 'Google Calendar', requestId = null) {
  return withTimeout(
    operation(),
    GOOGLE_CALENDAR_TIMEOUT_MS,
    operationName,
    requestId
  );
}

/**
 * Wrapper para requisições do WhatsApp API com timeout
 * @param {Function} operation - Função assíncrona que faz a requisição
 * @param {string} operationName - Nome da operação (para logs)
 * @param {string} requestId - Request ID para logs (opcional)
 * @returns {Promise} Resultado da operação ou TimeoutError
 */
async function withWhatsAppTimeout(operation, operationName = 'WhatsApp API', requestId = null) {
  return withTimeout(
    operation(),
    WHATSAPP_API_TIMEOUT_MS,
    operationName,
    requestId
  );
}

module.exports = {
  DEFAULT_TIMEOUT_MS,
  GOOGLE_CALENDAR_TIMEOUT_MS,
  WHATSAPP_API_TIMEOUT_MS,
  createTimeoutPromise,
  withTimeout,
  configureGoogleCalendarTimeout,
  withGoogleCalendarTimeout,
  withWhatsAppTimeout
};

