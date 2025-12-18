/**
 * Handler para seleção de data
 */

const { getServiceById } = require('../config/services');
const { getBarbers } = require('../services/calendar-service');
const { formatDate } = require('../utils/date-formatter');
const { cleanMultipleFields } = require('../utils/placeholder-cleaner');

// Armazenamento temporário de dados anteriores (será movido para contexto)
let previousFlowData = {};

/**
 * Define dados anteriores para resolução de placeholders
 * @param {object} data - Dados anteriores
 */
function setPreviousData(data) {
  previousFlowData = { ...previousFlowData, ...data };
}

/**
 * Processa seleção de data
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com horários disponíveis
 */
async function handleSelectDate(payload) {
  let { selected_service, selected_date, selected_branch, selected_barber, client_cpf, client_name, has_plan, is_club_member } = payload;
  
  // Limpar placeholders se necessário
  const cleaned = cleanMultipleFields({ selected_service, selected_date }, previousFlowData);
  selected_service = cleaned.selected_service;
  selected_date = cleaned.selected_date;
  
  const service = getServiceById(selected_service);
  const { getServicePrice } = require('../config/services');
  const { getAvailableSlots } = require('../services/calendar-service');
  
  const price = getServicePrice(selected_service, has_plan || false, is_club_member || false);
  const priceText = price === 0 ? 'R$ 0,00' : `R$ ${price.toFixed(2).replace('.', ',')}`;
  
  // Buscar horários disponíveis do Google Calendar
  const requestId = payload.requestId || null;
  const availableTimes = await getAvailableSlots(selected_barber, selected_date, selected_service, requestId);
  
  return {
    version: '3.0',
    screen: 'TIME_SELECTION',
    data: {
      selected_service,
      selected_date,
      selected_branch,
      selected_barber,
      client_cpf,
      client_name: client_name || '',
      has_plan: has_plan || false,
      is_club_member: is_club_member || false,
      service_name: service.title,
      service_price: priceText,
      formatted_date: formatDate(selected_date),
      available_times: availableTimes.length > 0 ? availableTimes : [
        { id: 'sem_horario', title: 'Sem horários', description: 'Tente outra data' }
      ]
    }
  };
}

module.exports = {
  handleSelectDate,
  setPreviousData
};

