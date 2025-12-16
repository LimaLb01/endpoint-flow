/**
 * Classes de Erro Customizadas
 * Fornece erros específicos com códigos e mensagens claras
 */

/**
 * Classe base para erros da aplicação
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational; // Erros operacionais vs erros de programação
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converte erro para formato JSON
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(Object.keys(this.details).length > 0 && { details: this.details })
      }
    };
  }
}

/**
 * Erro de validação
 */
class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(
      message || 'Dados inválidos fornecidos',
      400,
      'VALIDATION_ERROR',
      true,
      { field, value }
    );
  }
}

/**
 * Erro de autenticação/autorização
 */
class AuthenticationError extends AppError {
  constructor(message = 'Falha na autenticação') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

/**
 * Erro de autorização
 */
class AuthorizationError extends AppError {
  constructor(message = 'Acesso não autorizado') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

/**
 * Erro de recurso não encontrado
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso', identifier = null) {
    super(
      `${resource} não encontrado${identifier ? `: ${identifier}` : ''}`,
      404,
      'NOT_FOUND',
      true,
      { resource, identifier }
    );
  }
}

/**
 * Erro do Google Calendar
 */
class CalendarError extends AppError {
  constructor(message, googleError = null, isRetryable = false) {
    const code = isRetryable ? 'CALENDAR_TEMPORARY_ERROR' : 'CALENDAR_ERROR';
    const statusCode = isRetryable ? 503 : 500;
    
    super(
      message || 'Erro ao acessar Google Calendar',
      statusCode,
      code,
      true,
      {
        googleError: googleError ? {
          message: googleError.message,
          code: googleError.code,
          status: googleError.response?.status
        } : null,
        isRetryable
      }
    );
    this.isRetryable = isRetryable;
  }
}

/**
 * Erro do WhatsApp API
 */
class WhatsAppError extends AppError {
  constructor(message, whatsappError = null, isRetryable = false) {
    const code = isRetryable ? 'WHATSAPP_TEMPORARY_ERROR' : 'WHATSAPP_ERROR';
    const statusCode = isRetryable ? 503 : 500;
    
    super(
      message || 'Erro ao acessar WhatsApp API',
      statusCode,
      code,
      true,
      {
        whatsappError: whatsappError ? {
          message: whatsappError.message,
          code: whatsappError.code,
          status: whatsappError.response?.status
        } : null,
        isRetryable
      }
    );
    this.isRetryable = isRetryable;
  }
}

/**
 * Erro de Flow (WhatsApp Flow)
 */
class FlowError extends AppError {
  constructor(message, screen = null, actionType = null) {
    super(
      message || 'Erro ao processar Flow',
      400,
      'FLOW_ERROR',
      true,
      { screen, actionType }
    );
  }
}

/**
 * Erro de rate limit
 */
class RateLimitError extends AppError {
  constructor(message = 'Muitas requisições. Tente novamente mais tarde.', retryAfter = null) {
    super(
      message,
      429,
      'RATE_LIMIT_EXCEEDED',
      true,
      { retryAfter }
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Erro de timeout
 */
class TimeoutError extends AppError {
  constructor(service = 'Serviço', timeout = null) {
    super(
      `Timeout ao acessar ${service}${timeout ? ` (${timeout}ms)` : ''}`,
      504,
      'TIMEOUT_ERROR',
      true,
      { service, timeout }
    );
  }
}

/**
 * Erro de configuração
 */
class ConfigurationError extends AppError {
  constructor(message, configKey = null) {
    super(
      message || 'Erro de configuração',
      500,
      'CONFIGURATION_ERROR',
      false, // Erro de configuração não é operacional
      { configKey }
    );
  }
}

/**
 * Códigos de erro padronizados
 */
const ErrorCodes = {
  // Erros gerais
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  
  // Erros de autenticação
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  
  // Erros de serviços externos
  CALENDAR_ERROR: 'CALENDAR_ERROR',
  CALENDAR_TEMPORARY_ERROR: 'CALENDAR_TEMPORARY_ERROR',
  WHATSAPP_ERROR: 'WHATSAPP_ERROR',
  WHATSAPP_TEMPORARY_ERROR: 'WHATSAPP_TEMPORARY_ERROR',
  
  // Erros de Flow
  FLOW_ERROR: 'FLOW_ERROR',
  
  // Erros de limite
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Erros de configuração
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
};

/**
 * Mensagens de erro amigáveis para o usuário
 */
const UserFriendlyMessages = {
  [ErrorCodes.VALIDATION_ERROR]: 'Por favor, verifique os dados informados e tente novamente.',
  [ErrorCodes.CALENDAR_ERROR]: 'Não foi possível acessar o calendário. Tente novamente em alguns instantes.',
  [ErrorCodes.CALENDAR_TEMPORARY_ERROR]: 'O serviço de calendário está temporariamente indisponível. Tente novamente em alguns instantes.',
  [ErrorCodes.WHATSAPP_ERROR]: 'Erro ao processar sua solicitação. Tente novamente.',
  [ErrorCodes.WHATSAPP_TEMPORARY_ERROR]: 'O serviço está temporariamente indisponível. Tente novamente em alguns instantes.',
  [ErrorCodes.FLOW_ERROR]: 'Erro ao processar o formulário. Tente novamente.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Muitas requisições. Aguarde alguns instantes e tente novamente.',
  [ErrorCodes.TIMEOUT_ERROR]: 'A requisição demorou muito para responder. Tente novamente.',
  [ErrorCodes.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
  [ErrorCodes.INTERNAL_ERROR]: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
};

/**
 * Verifica se um erro é retryable (pode ser tentado novamente)
 */
function isRetryableError(error) {
  if (error instanceof CalendarError || error instanceof WhatsAppError) {
    return error.isRetryable;
  }
  
  // Erros de rede geralmente são retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  // Status codes que indicam erro temporário
  if (error.response?.status) {
    const status = error.response.status;
    return status === 429 || status === 503 || status === 504;
  }
  
  return false;
}

/**
 * Obtém mensagem amigável para o usuário baseada no código de erro
 */
function getUserFriendlyMessage(errorCode) {
  return UserFriendlyMessages[errorCode] || UserFriendlyMessages[ErrorCodes.INTERNAL_ERROR];
}

/**
 * Converte erro genérico para AppError
 */
function normalizeError(error) {
  // Se já é um AppError, retornar como está
  if (error instanceof AppError) {
    return error;
  }
  
  // Erros do Google Calendar
  if (error.response?.config?.url?.includes('googleapis.com')) {
    const isRetryable = isRetryableError(error);
    return new CalendarError(
      `Erro ao acessar Google Calendar: ${error.message}`,
      error,
      isRetryable
    );
  }
  
  // Erros do WhatsApp API
  if (error.response?.config?.url?.includes('graph.facebook.com')) {
    const isRetryable = isRetryableError(error);
    return new WhatsAppError(
      `Erro ao acessar WhatsApp API: ${error.message}`,
      error,
      isRetryable
    );
  }
  
  // Erros de validação
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return new ValidationError(error.message);
  }
  
  // Erros de timeout
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return new TimeoutError('Serviço externo', error.timeout);
  }
  
  // Erro genérico
  return new AppError(
    error.message || 'Erro interno do servidor',
    error.statusCode || 500,
    ErrorCodes.INTERNAL_ERROR,
    false
  );
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  CalendarError,
  WhatsAppError,
  FlowError,
  RateLimitError,
  TimeoutError,
  ConfigurationError,
  ErrorCodes,
  UserFriendlyMessages,
  isRetryableError,
  getUserFriendlyMessage,
  normalizeError
};

