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
 * Calcula data mínima (hoje)
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getMinDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcula data máxima (hoje + N dias)
 * @param {number} daysAhead - Número de dias à frente
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getMaxDate(daysAhead = DATE_CONFIG.DAYS_AHEAD) {
  const today = new Date();
  const maxDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return maxDate.toISOString().split('T')[0];
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

