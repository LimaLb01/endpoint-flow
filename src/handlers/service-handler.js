/**
 * Handler para seleção de serviço
 */

const { getServiceById, getServicePrice } = require('../config/services');
const { getMinDate, getMaxDate } = require('../utils/date-formatter');

/**
 * Processa seleção de serviço
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para seleção de data
 */
async function handleSelectService(payload) {
  const { selected_service, selected_branch, selected_barber, client_cpf, client_name, has_plan, is_club_member } = payload;
  
  if (!selected_service) {
    return {
      version: '3.0',
      screen: 'SERVICE_SELECTION',
      data: {
        error: true,
        error_message: 'Por favor, selecione um serviço'
      }
    };
  }
  
  const service = getServiceById(selected_service);
  const price = getServicePrice(selected_service, has_plan || false, is_club_member || false);
  const priceText = price === 0 ? 'R$ 0,00' : `R$ ${price.toFixed(2).replace('.', ',')}`;
  
  return {
    version: '3.0',
    screen: 'DATE_SELECTION',
    data: {
      selected_service: selected_service,
      selected_branch: selected_branch,
      selected_barber: selected_barber,
      client_cpf: client_cpf,
      client_name: client_name || '',
      has_plan: has_plan || false,
      is_club_member: is_club_member || false,
      service_name: service.title,
      service_price: priceText,
      min_date: getMinDate(),
      max_date: getMaxDate(),
      unavailable_dates: [] // Pode ser preenchido com feriados
    }
  };
}

module.exports = {
  handleSelectService
};

