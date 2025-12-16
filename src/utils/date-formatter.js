/**
 * Utilitários para formatação de datas
 */

const { DATE_CONFIG } = require('../config/constants');

/**
 * Formata data para exibição no formato brasileiro
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @param {boolean} includeWeekday - Incluir dia da semana
 * @returns {string} Data formatada (ex: "17/12/2025 (Quarta)")
 */
function formatDate(dateString, includeWeekday = true) {
  if (!dateString) {
    return '';
  }

  const dateObj = new Date(dateString + 'T12:00:00');
  const [year, month, day] = dateString.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  if (includeWeekday) {
    const weekday = DATE_CONFIG.WEEKDAYS[dateObj.getDay()];
    return `${formattedDate} (${weekday})`;
  }

  return formattedDate;
}

/**
 * Calcula data mínima (hoje) no timezone de São Paulo
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getMinDate() {
  // Usar Intl.DateTimeFormat para obter a data atual no timezone de São Paulo
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Formato retornado: YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Calcula data máxima (hoje + N dias) no timezone de São Paulo
 * @param {number} daysAhead - Número de dias à frente
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getMaxDate(daysAhead = DATE_CONFIG.DAYS_AHEAD) {
  // Calcular data futura no timezone de São Paulo
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Formato retornado: YYYY-MM-DD
  return formatter.format(futureDate);
}

/**
 * Valida formato de data
 * @param {string} dateString - Data a validar
 * @returns {boolean} True se válida
 */
function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString + 'T12:00:00');
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  formatDate,
  getMinDate,
  getMaxDate,
  isValidDate
};

