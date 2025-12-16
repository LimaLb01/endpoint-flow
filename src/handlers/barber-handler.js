/**
 * Handler para seleção de barbeiro
 */

const { getServiceById } = require('../config/services');
const { getBarbers, getAvailableSlots } = require('../services/calendar-service');
const { formatDate } = require('../utils/date-formatter');
const { cleanMultipleFields } = require('../utils/placeholder-cleaner');

// Armazenamento temporário de dados anteriores
let previousFlowData = {};

/**
 * Define dados anteriores
 */
function setPreviousData(data) {
  previousFlowData = { ...previousFlowData, ...data };
}

/**
 * Processa seleção de barbeiro
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com horários disponíveis
 */
async function handleSelectBarber(payload) {
  let { selected_service, selected_date, selected_barber } = payload;
  
  // Limpar placeholders
  const cleaned = cleanMultipleFields(
    { selected_service, selected_date, selected_barber },
    previousFlowData
  );
  selected_service = cleaned.selected_service;
  selected_date = cleaned.selected_date;
  selected_barber = cleaned.selected_barber;
  
  const service = getServiceById(selected_service);
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Validar dados antes de buscar horários
  if (!selected_barber || !selected_date || 
      selected_barber.startsWith('${') || selected_date.startsWith('${')) {
    console.warn('⚠️ Dados inválidos para buscar horários:', { selected_barber, selected_date });
    return getFallbackTimeSelection(selected_service, selected_date, selected_barber, service, barber);
  }
  
  // Buscar horários disponíveis do Google Calendar (com cache)
  // requestId será passado se disponível para logs
  const requestId = payload.requestId || null;
  const availableTimes = await getAvailableSlots(selected_barber, selected_date, selected_service, requestId);
  
  return {
    version: '3.0',
    screen: 'TIME_SELECTION',
    data: {
      selected_service,
      selected_date,
      selected_barber,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      barber_name: barber.title,
      formatted_date: formatDate(selected_date),
      available_times: availableTimes.length > 0 ? availableTimes : [
        { id: 'sem_horario', title: 'Sem horários', description: 'Tente outra data' }
      ]
    }
  };
}

/**
 * Retorna horários padrão quando não consegue buscar do calendário
 */
function getFallbackTimeSelection(selected_service, selected_date, selected_barber, service, barber) {
  const availableTimes = [
    { id: '09:00', title: '09:00', description: 'Disponível - 45 min' },
    { id: '10:00', title: '10:00', description: 'Disponível - 45 min' },
    { id: '14:00', title: '14:00', description: 'Disponível - 45 min' },
    { id: '15:00', title: '15:00', description: 'Disponível - 45 min' },
    { id: '16:00', title: '16:00', description: 'Disponível - 45 min' }
  ];
  
  const dateToFormat = selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
  
  return {
    version: '3.0',
    screen: 'TIME_SELECTION',
    data: {
      selected_service: selected_service || previousFlowData.selected_service,
      selected_date: selected_date || previousFlowData.selected_date,
      selected_barber: selected_barber || previousFlowData.selected_barber,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      barber_name: barber.title,
      formatted_date: formatDate(dateToFormat),
      available_times: availableTimes
    }
  };
}

module.exports = {
  handleSelectBarber,
  setPreviousData
};

