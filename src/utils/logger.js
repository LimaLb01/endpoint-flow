/**
 * Logger Estruturado
 * Usa pino para logs estruturados em JSON
 */

const pino = require('pino');

// Determinar se está em desenvolvimento ou produção
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Configuração do logger
 */
const loggerConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Em desenvolvimento, usar formatação legível
  // Em produção, usar JSON puro
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
};

// Criar instância do logger
const logger = pino(loggerConfig);

/**
 * Logger com contexto de Request ID
 * Permite adicionar requestId a todos os logs de uma requisição
 */
class RequestLogger {
  constructor(requestId, baseLogger = logger) {
    this.requestId = requestId;
    this.logger = baseLogger.child({ requestId });
  }

  info(message, data = {}) {
    this.logger.info(data, message);
  }

  warn(message, data = {}) {
    this.logger.warn(data, message);
  }

  error(message, error = {}) {
    if (error instanceof Error) {
      this.logger.error({
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        ...error
      }, message);
    } else {
      this.logger.error(error, message);
    }
  }

  debug(message, data = {}) {
    this.logger.debug(data, message);
  }

  trace(message, data = {}) {
    this.logger.trace(data, message);
  }

  // Métodos de conveniência para logs comuns
  request(method, url, data = {}) {
    this.info(`📥 ${method} ${url}`, {
      method,
      url,
      ...data
    });
  }

  response(statusCode, data = {}) {
    this.info(`📤 Response ${statusCode}`, {
      statusCode,
      ...data
    });
  }

  flow(action, screen, data = {}) {
    this.info(`🔄 Flow: ${action}`, {
      action,
      screen,
      ...data
    });
  }

  service(serviceName, status, data = {}) {
    this.info(`🔧 ${serviceName}: ${status}`, {
      service: serviceName,
      status,
      ...data
    });
  }
}

/**
 * Cria um logger com request ID
 * @param {string} requestId - ID único da requisição
 * @returns {RequestLogger} Logger com contexto
 */
function createRequestLogger(requestId) {
  return new RequestLogger(requestId, logger);
}

/**
 * Logger global (sem request ID)
 * Use apenas quando não há contexto de requisição
 */
const globalLogger = {
  info: (message, data = {}) => logger.info(data, message),
  warn: (message, data = {}) => logger.warn(data, message),
  error: (message, error = {}) => {
    if (error instanceof Error) {
      logger.error({
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        }
      }, message);
    } else {
      logger.error(error, message);
    }
  },
  debug: (message, data = {}) => logger.debug(data, message),
  trace: (message, data = {}) => logger.trace(data, message)
};

module.exports = {
  logger,
  globalLogger,
  createRequestLogger,
  RequestLogger
};

