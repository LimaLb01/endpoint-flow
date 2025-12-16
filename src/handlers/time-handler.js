/**
 * Handler para seleção de horário
 */

const { getServiceById } = require('../config/services');
const { getBarbers } = require('../services/calendar-service');
const { formatDate } = require('../utils/date-formatter');
const { cleanMultipleFields } = require('../utils/placeholder-cleaner');
const { generateBookingId } = require('../utils/booking-id-generator');

// Armazenamento temporário de dados anteriores
let previousFlowData = {};

/**
 * Define dados anteriores
 */
function setPreviousData(data) {
  previousFlowData = { ...previousFlowData, ...data };
}

/**
 * Processa seleção de horário
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para tela de detalhes
 */
async function handleSelectTime(payload) {
  let { selected_service, selected_date, selected_barber, selected_time } = payload;
  
  // Limpar placeholders
  const cleaned = cleanMultipleFields(
    { selected_service, selected_date, selected_barber, selected_time },
    previousFlowData
  );
  selected_service = cleaned.selected_service;
  selected_date = cleaned.selected_date;
  selected_barber = cleaned.selected_barber;
  selected_time = cleaned.selected_time;
  
  const service = getServiceById(selected_service);
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Formatar data
  const dateToFormat = selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
  
  // Gerar booking_id antecipadamente
  const bookingId = generateBookingId();
  
  return {
    version: '3.0',
    screen: 'DETAILS',
    data: {
      selected_service: selected_service || previousFlowData.selected_service,
      selected_date: selected_date || previousFlowData.selected_date,
      selected_barber: selected_barber || previousFlowData.selected_barber,
      selected_time: selected_time || previousFlowData.selected_time,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      barber_name: barber.title,
      formatted_date: formatDate(dateToFormat),
      booking_id: bookingId
    }
  };
}

module.exports = {
  handleSelectTime,
  setPreviousData
};

