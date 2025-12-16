/**
 * Middleware de Tratamento de Erros Centralizado
 * Trata todos os erros de forma consistente e retorna respostas apropriadas
 */

const { normalizeError, getUserFriendlyMessage, ErrorCodes } = require('../utils/errors');
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * Middleware de tratamento de erros para Express
 */
function errorHandlerMiddleware(err, req, res, next) {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  // Normalizar erro
  const error = normalizeError(err);
  
  // Log do erro
  logger.error('Erro capturado pelo middleware de tratamento de erros', error);
  
  // Determinar status code
  const statusCode = error.statusCode || 500;
  
  // Resposta para requisições do WhatsApp Flow
  if (req.path.includes('/whatsapp-flow') && req.method === 'POST') {
    // WhatsApp Flow espera sempre status 200 com dados estruturados
    return res.status(200).json({
      version: '3.0',
      data: {
        error: true,
        error_message: getUserFriendlyMessage(error.code),
        error_code: error.code,
        requestId: req.requestId
      }
    });
  }
  
  // Resposta padrão para outras requisições
  const response = {
    error: {
      message: error.message,
      code: error.code,
      requestId: req.requestId
    }
  };
  
  // Adicionar mensagem amigável em desenvolvimento ou para erros operacionais
  if (process.env.NODE_ENV === 'development' || error.isOperational) {
    response.error.userMessage = getUserFriendlyMessage(error.code);
  }
  
  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.error.details = error.details;
    response.error.stack = error.stack;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Wrapper para handlers assíncronos
 * Captura erros automaticamente e passa para o error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Cria uma resposta de erro para WhatsApp Flow
 */
function createFlowErrorResponse(error, requestId = null) {
  const normalizedError = normalizeError(error);
  const { getUserFriendlyMessage } = require('../utils/errors');
  
  return {
    version: '3.0',
    data: {
      error: true,
      error_message: getUserFriendlyMessage(normalizedError.code),
      error_code: normalizedError.code,
      requestId
    }
  };
}

module.exports = {
  errorHandlerMiddleware,
  asyncHandler,
  createFlowErrorResponse
};

