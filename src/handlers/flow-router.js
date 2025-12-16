/**
 * Roteador principal do Flow
 * Gerencia o roteamento entre diferentes handlers baseado no action_type
 */

const { handleInit } = require('./init-handler');
const { handleSelectService } = require('./service-handler');
const { handleSelectDate, setPreviousData: setDatePreviousData } = require('./date-handler');
const { handleSelectBarber, setPreviousData: setBarberPreviousData } = require('./barber-handler');
const { handleSelectTime, setPreviousData: setTimePreviousData } = require('./time-handler');
const { handleSubmitDetails, setPreviousData: setDetailsPreviousData } = require('./details-handler');
const { handleConfirmBooking } = require('./booking-handler');
const { cleanPlaceholders } = require('../utils/placeholder-cleaner');
const { validateFlowRequest, validateByActionType } = require('../utils/validators');
const { globalLogger } = require('../utils/logger');

// Armazenamento de dados anteriores para resolução de placeholders
let previousFlowData = {};

/**
 * Processa requisições do Flow
 * @param {object} data - Dados da requisição
 * @returns {Promise<object>} Resposta do Flow
 */
async function handleFlowRequest(data, requestId = null) {
  const logger = requestId ? require('../utils/logger').createRequestLogger(requestId) : globalLogger;
  
  // Validar estrutura básica da requisição
  const requestValidation = validateFlowRequest(data);
  if (!requestValidation.valid) {
    logger.error('Validação de requisição falhou', {
      error: requestValidation.error
    });
    return {
      version: '3.0',
      data: {
        error: true,
        error_message: requestValidation.error
      }
    };
  }
  
  const { action, screen, data: flowData, version, flow_token } = requestValidation.data;
  let payload = flowData || {};
  
  logger.flow(action, screen, {
    version,
    actionType: payload.action_type
  });
  
  // Adicionar flow_token ao payload
  if (flow_token) {
    payload.flow_token = flow_token;
  }
  
  // Limpar placeholders não resolvidos
  payload = cleanPlaceholders(payload, previousFlowData);
  
  // Atualizar dados anteriores
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && !(typeof value === 'string' && value.startsWith('${'))) {
      previousFlowData[key] = value;
    }
  }
  
  // Sincronizar dados anteriores com handlers
  setDatePreviousData(previousFlowData);
  setBarberPreviousData(previousFlowData);
  setTimePreviousData(previousFlowData);
  setDetailsPreviousData(previousFlowData);
  
  const actionType = payload.action_type;

  // Health check do WhatsApp
  if (action === 'ping') {
    return { data: { status: 'active' } };
  }

  // INIT - Primeira chamada quando Flow é aberto
  if (action === 'INIT') {
    logger.info('Processando INIT - Inicializando Flow');
    return handleInit();
  }

  // data_exchange - Navegação entre telas
  if (action === 'data_exchange') {
    logger.debug('Processando data_exchange', { actionType });
    
    // Validar dados do payload baseado no action_type
    if (actionType) {
      const payloadValidation = validateByActionType(actionType, payload);
      if (!payloadValidation.valid) {
        logger.error('Validação de payload falhou', {
          actionType,
          error: payloadValidation.error
        });
        return {
          version: '3.0',
          screen: screen || 'SERVICE_SELECTION',
          data: {
            error: true,
            error_message: payloadValidation.error
          }
        };
      }
      // Usar dados validados e normalizados
      payload = { ...payload, ...payloadValidation.data };
    }
    
    switch (actionType) {
      case 'INIT':
        logger.info('Processando INIT via data_exchange');
        return handleInit();
      case 'SELECT_SERVICE':
        return handleSelectService(payload);
      case 'SELECT_DATE':
        return handleSelectDate(payload);
      case 'SELECT_BARBER':
        return handleSelectBarber(payload);
      case 'SELECT_TIME':
        return handleSelectTime(payload);
      case 'SUBMIT_DETAILS':
        return handleSubmitDetails(payload);
      case 'CONFIRM_BOOKING':
        return handleConfirmBooking(payload);
      default:
        // Fallback baseado na tela atual
        return handleByScreen(screen, payload);
    }
  }

  // Se não tem action definida, pode ser uma requisição inválida
  logger.warn('Action não reconhecida', { action });
  return { version: version || '3.0', data: {} };
}

/**
 * Fallback baseado na tela atual
 * @param {string} screen - Nome da tela
 * @param {object} payload - Dados da requisição
 * @returns {Promise<object>} Resposta do Flow
 */
async function handleByScreen(screen, payload) {
  switch (screen) {
    case 'WELCOME':
      return handleInit();
    case 'SERVICE_SELECTION':
      return handleSelectService(payload);
    case 'DATE_SELECTION':
      return handleSelectDate(payload);
    case 'BARBER_SELECTION':
      return handleSelectBarber(payload);
    case 'TIME_SELECTION':
      return handleSelectTime(payload);
    case 'DETAILS':
      return handleSubmitDetails(payload);
    case 'CONFIRMATION':
      return handleConfirmBooking(payload);
    default:
      return { version: '3.0', data: {} };
  }
}

module.exports = {
  handleFlowRequest
};

