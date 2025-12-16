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
 * @returns {object} Resposta com lista de barbeiros
 */
async function handleSelectDate(payload) {
  let { selected_service, selected_date } = payload;
  
  // Limpar placeholders se necessário
  const cleaned = cleanMultipleFields({ selected_service, selected_date }, previousFlowData);
  selected_service = cleaned.selected_service;
  selected_date = cleaned.selected_date;
  
  const service = getServiceById(selected_service);
  const barbers = await getBarbers();
  
  return {
    version: '3.0',
    screen: 'BARBER_SELECTION',
    data: {
      selected_service,
      selected_date,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      formatted_date: formatDate(selected_date),
      barbers: barbers.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description || 'Disponível'
      }))
    }
  };
}

module.exports = {
  handleSelectDate,
  setPreviousData
};

