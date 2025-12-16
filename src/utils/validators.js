/**
 * Validadores de Dados de Entrada
 * Valida estrutura e tipos dos dados recebidos do WhatsApp Flow
 * 
 * Agora também usa schemas Zod para validação declarativa
 */

const { validateFlowRequestSchema, validateByActionTypeSchema } = require('./schemas');

/**
 * Resultado de validação
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Se os dados são válidos
 * @property {string|null} error - Mensagem de erro (se inválido)
 * @property {object|null} data - Dados validados e normalizados
 */

/**
 * Valida estrutura básica de uma requisição do Flow
 * Usa schema Zod para validação declarativa
 * @param {object} data - Dados da requisição
 * @returns {ValidationResult}
 */
function validateFlowRequest(data) {
  // Primeiro tentar validação com schema Zod (mais robusta)
  const schemaResult = validateFlowRequestSchema(data);
  
  // Se schema passou, retornar resultado
  if (schemaResult.valid) {
    return schemaResult;
  }
  
  // Se schema falhou, fazer validação manual como fallback
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Dados da requisição inválidos ou ausentes',
      data: null
    };
  }

  const { action, version, screen, data: flowData } = data;

  // Validar action
  if (!action || typeof action !== 'string') {
    return {
      valid: false,
      error: 'Campo "action" é obrigatório e deve ser uma string',
      data: null
    };
  }

  // Normalizar version (pode vir como número 300 ou string "3.0")
  let normalizedVersion = version;
  if (typeof version === 'number') {
    // Se vier como número (ex: 300), converter para string "3.0"
    if (version === 300) {
      normalizedVersion = '3.0';
    } else {
      return {
        valid: false,
        error: `Versão "${version}" não suportada. Versão esperada: 3.0`,
        data: null
      };
    }
  } else if (version && version !== '3.0') {
    return {
      valid: false,
      error: `Versão "${version}" não suportada. Versão esperada: 3.0`,
      data: null
    };
  }

  // Validar que flowData é um objeto (se presente)
  if (flowData !== undefined && (typeof flowData !== 'object' || Array.isArray(flowData))) {
    return {
      valid: false,
      error: 'Campo "data" deve ser um objeto',
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      action,
      version: normalizedVersion || '3.0',
      screen: screen || null,
      data: flowData || {}
    }
  };
}

/**
 * Valida dados para SELECT_SERVICE
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateSelectService(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para SELECT_SERVICE',
      data: null
    };
  }

  const { selected_service } = payload;

  if (!selected_service || typeof selected_service !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_service" é obrigatório e deve ser uma string',
      data: null
    };
  }

  // Validar se o serviço é válido (IDs conhecidos)
  const validServices = ['corte_masculino', 'barba', 'corte_barba', 'corte_infantil', 'pigmentacao'];
  if (!validServices.includes(selected_service)) {
    return {
      valid: false,
      error: `Serviço "${selected_service}" não é válido`,
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      selected_service,
      action_type: 'SELECT_SERVICE'
    }
  };
}

/**
 * Valida dados para SELECT_DATE
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateSelectDate(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para SELECT_DATE',
      data: null
    };
  }

  const { selected_service, selected_date } = payload;

  // Validar selected_service
  if (!selected_service || typeof selected_service !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_service" é obrigatório para SELECT_DATE',
      data: null
    };
  }

  // Validar selected_date
  if (!selected_date || typeof selected_date !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_date" é obrigatório e deve ser uma string (formato YYYY-MM-DD)',
      data: null
    };
  }

  // Validar formato da data (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(selected_date)) {
    return {
      valid: false,
      error: 'Formato de data inválido. Use YYYY-MM-DD (ex: 2025-12-19)',
      data: null
    };
  }

  // Validar se a data é válida
  const date = new Date(selected_date + 'T12:00:00');
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: 'Data inválida',
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      selected_service,
      selected_date,
      action_type: 'SELECT_DATE'
    }
  };
}

/**
 * Valida dados para SELECT_BARBER
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateSelectBarber(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para SELECT_BARBER',
      data: null
    };
  }

  const { selected_service, selected_date, selected_barber } = payload;

  // Validar campos obrigatórios
  if (!selected_service || typeof selected_service !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_service" é obrigatório para SELECT_BARBER',
      data: null
    };
  }

  if (!selected_date || typeof selected_date !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_date" é obrigatório para SELECT_BARBER',
      data: null
    };
  }

  if (!selected_barber || typeof selected_barber !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_barber" é obrigatório e deve ser uma string',
      data: null
    };
  }

  // Validar se o barbeiro é válido
  const validBarbers = ['joao', 'pedro', 'carlos'];
  if (!validBarbers.includes(selected_barber)) {
    return {
      valid: false,
      error: `Barbeiro "${selected_barber}" não é válido`,
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      selected_service,
      selected_date,
      selected_barber,
      action_type: 'SELECT_BARBER'
    }
  };
}

/**
 * Valida dados para SELECT_TIME
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateSelectTime(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para SELECT_TIME',
      data: null
    };
  }

  const { selected_service, selected_date, selected_barber, selected_time } = payload;

  // Validar campos obrigatórios
  if (!selected_service || typeof selected_service !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_service" é obrigatório para SELECT_TIME',
      data: null
    };
  }

  if (!selected_date || typeof selected_date !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_date" é obrigatório para SELECT_TIME',
      data: null
    };
  }

  if (!selected_barber || typeof selected_barber !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_barber" é obrigatório para SELECT_TIME',
      data: null
    };
  }

  if (!selected_time || typeof selected_time !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_time" é obrigatório e deve ser uma string (formato HH:MM)',
      data: null
    };
  }

  // Validar formato do horário (HH:MM)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(selected_time)) {
    return {
      valid: false,
      error: 'Formato de horário inválido. Use HH:MM (ex: 09:00, 14:30)',
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      selected_service,
      selected_date,
      selected_barber,
      selected_time,
      action_type: 'SELECT_TIME'
    }
  };
}

/**
 * Valida dados para SUBMIT_DETAILS
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateSubmitDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para SUBMIT_DETAILS',
      data: null
    };
  }

  const {
    selected_service,
    selected_date,
    selected_barber,
    selected_time,
    client_name,
    client_phone
  } = payload;

  // Validar campos obrigatórios anteriores
  if (!selected_service || typeof selected_service !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_service" é obrigatório para SUBMIT_DETAILS',
      data: null
    };
  }

  if (!selected_date || typeof selected_date !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_date" é obrigatório para SUBMIT_DETAILS',
      data: null
    };
  }

  if (!selected_barber || typeof selected_barber !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_barber" é obrigatório para SUBMIT_DETAILS',
      data: null
    };
  }

  if (!selected_time || typeof selected_time !== 'string') {
    return {
      valid: false,
      error: 'Campo "selected_time" é obrigatório para SUBMIT_DETAILS',
      data: null
    };
  }

  // Validar campos obrigatórios do cliente
  if (!client_name || typeof client_name !== 'string' || client_name.trim().length === 0) {
    return {
      valid: false,
      error: 'Campo "client_name" é obrigatório e não pode estar vazio',
      data: null
    };
  }

  if (!client_phone || typeof client_phone !== 'string' || client_phone.trim().length === 0) {
    return {
      valid: false,
      error: 'Campo "client_phone" é obrigatório e não pode estar vazio',
      data: null
    };
  }

  // Validar formato do telefone (básico - apenas números)
  const phoneRegex = /^[0-9]{10,15}$/;
  const cleanPhone = client_phone.replace(/\D/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Formato de telefone inválido. Use apenas números (10-15 dígitos)',
      data: null
    };
  }

  // Campos opcionais
  const client_email = payload.client_email || '';
  const contact_preference = payload.contact_preference || '';
  const notes = payload.notes || '';

  // Validar email se fornecido
  if (client_email && typeof client_email === 'string' && client_email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return {
        valid: false,
        error: 'Formato de email inválido',
        data: null
      };
    }
  }

  return {
    valid: true,
    error: null,
    data: {
      selected_service,
      selected_date,
      selected_barber,
      selected_time,
      client_name: client_name.trim(),
      client_phone: cleanPhone,
      client_email: client_email.trim(),
      contact_preference: contact_preference.trim(),
      notes: notes.trim(),
      action_type: 'SUBMIT_DETAILS'
    }
  };
}

/**
 * Valida dados para CONFIRM_BOOKING
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateConfirmBooking(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: 'Payload inválido para CONFIRM_BOOKING',
      data: null
    };
  }

  const { booking_id } = payload;

  if (!booking_id || typeof booking_id !== 'string') {
    return {
      valid: false,
      error: 'Campo "booking_id" é obrigatório para CONFIRM_BOOKING',
      data: null
    };
  }

  // Validar formato do booking_id (AGD-XXXXXX)
  const bookingIdRegex = /^AGD-\d+$/;
  if (!bookingIdRegex.test(booking_id)) {
    return {
      valid: false,
      error: 'Formato de booking_id inválido. Deve ser AGD-XXXXXX',
      data: null
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      ...payload,
      action_type: 'CONFIRM_BOOKING'
    }
  };
}

/**
 * Valida dados baseado no action_type
 * Usa schema Zod primeiro, depois fallback para validadores manuais
 * @param {string} actionType - Tipo de ação
 * @param {object} payload - Dados do payload
 * @returns {ValidationResult}
 */
function validateByActionType(actionType, payload) {
  // Primeiro tentar validação com schema Zod (mais robusta e declarativa)
  const schemaResult = validateByActionTypeSchema(actionType, payload);
  
  // Se schema passou, retornar resultado
  if (schemaResult.valid) {
    return schemaResult;
  }
  
  // Se schema falhou, usar validadores manuais como fallback
  // Isso garante compatibilidade e mensagens de erro mais específicas quando necessário
  switch (actionType) {
    case 'SELECT_SERVICE':
      return validateSelectService(payload);
    case 'SELECT_DATE':
      return validateSelectDate(payload);
    case 'SELECT_BARBER':
      return validateSelectBarber(payload);
    case 'SELECT_TIME':
      return validateSelectTime(payload);
    case 'SUBMIT_DETAILS':
      return validateSubmitDetails(payload);
    case 'CONFIRM_BOOKING':
      return validateConfirmBooking(payload);
    default:
      // Para ações desconhecidas, apenas validar que payload é um objeto
      if (!payload || typeof payload !== 'object') {
        return {
          valid: false,
          error: `Payload inválido para action_type: ${actionType}`,
          data: null
        };
      }
      return {
        valid: true,
        error: null,
        data: payload
      };
  }
}

module.exports = {
  validateFlowRequest,
  validateSelectService,
  validateSelectDate,
  validateSelectBarber,
  validateSelectTime,
  validateSubmitDetails,
  validateConfirmBooking,
  validateByActionType
};

