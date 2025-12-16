/**
 * Gerador de IDs únicos para agendamentos
 */

const { BOOKING_CONFIG } = require('../config/constants');

/**
 * Gera um ID único para agendamento
 * @returns {string} ID do agendamento (ex: "AGD-123456")
 */
function generateBookingId() {
  const timestamp = Date.now().toString().slice(-6);
  return `${BOOKING_CONFIG.BOOKING_ID_PREFIX}${timestamp}`;
}

/**
 * Valida formato de booking ID
 * @param {string} bookingId - ID a validar
 * @returns {boolean} True se válido
 */
function isValidBookingId(bookingId) {
  if (!bookingId || typeof bookingId !== 'string') {
    return false;
  }

  const regex = new RegExp(`^${BOOKING_CONFIG.BOOKING_ID_PREFIX}\\d{6}$`);
  return regex.test(bookingId);
}

module.exports = {
  generateBookingId,
  isValidBookingId
};

