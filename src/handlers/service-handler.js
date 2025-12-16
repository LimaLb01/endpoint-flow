/**
 * Handler para seleção de serviço
 */

const { getServiceById } = require('../config/services');
const { getMinDate, getMaxDate } = require('../utils/date-formatter');

/**
 * Processa seleção de serviço
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para seleção de data
 */
async function handleSelectService(payload) {
  const { selected_service } = payload;
  const service = getServiceById(selected_service);
  
  return {
    version: '3.0',
    screen: 'DATE_SELECTION',
    data: {
      selected_service: selected_service,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      min_date: getMinDate(),
      max_date: getMaxDate(),
      unavailable_dates: [] // Pode ser preenchido com feriados
    }
  };
}

module.exports = {
  handleSelectService
};

