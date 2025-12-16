/**
 * Constantes do Sistema
 */

// Configurações do WhatsApp
const WHATSAPP_CONFIG = {
  API_URL: 'https://graph.facebook.com/v21.0',
  FLOW_MESSAGE_VERSION: '3',
  DEFAULT_FLOW_ID: '888145740552051',
  DEFAULT_VERIFY_TOKEN: 'flow_verify_token_2024'
};

// Configurações de agendamento
const BOOKING_CONFIG = {
  STORAGE_EXPIRATION_MS: 60 * 60 * 1000, // 1 hora
  CLEANUP_INTERVAL_MS: 30 * 60 * 1000, // 30 minutos
  BOOKING_ID_PREFIX: 'AGD-'
};

// Configurações de data
const DATE_CONFIG = {
  DAYS_AHEAD: 30, // Dias à frente para seleção
  TIMEZONE: 'America/Sao_Paulo',
  WEEKDAYS: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
};

// Mensagens padrão
const MESSAGES = {
  FLOW_WELCOME: 'Olá! Agende seu horário na barbearia de forma rápida e prática. 🎯',
  FLOW_CTA: 'Agendar Horário',
  ERROR_INVALID_SIGNATURE: 'Assinatura inválida',
  ERROR_INTERNAL: 'Erro interno do servidor',
  ERROR_BOOKING_FAILED: 'Não foi possível confirmar. Tente novamente.'
};

module.exports = {
  WHATSAPP_CONFIG,
  BOOKING_CONFIG,
  DATE_CONFIG,
  MESSAGES
};

