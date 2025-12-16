/**
 * Handler para envio de dados pessoais (SUBMIT_DETAILS)
 */

const { getServiceById } = require('../config/services');
const { getBarbers } = require('../services/calendar-service');
const { formatDate } = require('../utils/date-formatter');
const { cleanMultipleFields } = require('../utils/placeholder-cleaner');
const { generateBookingId } = require('../utils/booking-id-generator');
const bookingStorage = require('../storage/booking-storage');

// Armazenamento temporário de dados anteriores
let previousFlowData = {};

/**
 * Define dados anteriores
 */
function setPreviousData(data) {
  previousFlowData = { ...previousFlowData, ...data };
}

/**
 * Processa envio de dados pessoais
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para tela de confirmação
 */
async function handleSubmitDetails(payload) {
  let { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes,
    service_name: payloadServiceName,
    service_price: payloadServicePrice,
    barber_name: payloadBarberName,
    formatted_date: payloadFormattedDate
  } = payload;
  
  console.log('📋 SUBMIT_DETAILS - Payload recebido:', JSON.stringify(payload, null, 2));
  
  // Limpar placeholders não resolvidos
  const fieldsToClean = {
    selected_service,
    selected_date,
    selected_barber,
    selected_time,
    client_name,
    client_phone,
    client_email,
    notes
  };
  
  const cleaned = cleanMultipleFields(fieldsToClean, previousFlowData);
  
  const service = getServiceById(cleaned.selected_service);
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === cleaned.selected_barber) || barbers[0];
  
  // Formatar data
  let formattedDate = payloadFormattedDate;
  if (!formattedDate || formattedDate.startsWith('${')) {
    const dateToFormat = cleaned.selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
    formattedDate = formatDate(dateToFormat);
  }
  
  // Montar dados de resposta
  const responseData = {
    selected_service: cleaned.selected_service || previousFlowData.selected_service,
    selected_date: cleaned.selected_date || previousFlowData.selected_date,
    selected_barber: cleaned.selected_barber || previousFlowData.selected_barber,
    selected_time: cleaned.selected_time || previousFlowData.selected_time,
    client_name: cleaned.client_name || previousFlowData.client_name || '',
    client_phone: cleaned.client_phone || previousFlowData.client_phone || '',
    client_email: cleaned.client_email || previousFlowData.client_email || '',
    contact_preference: contact_preference || '',
    notes: cleaned.notes || previousFlowData.notes || '',
    service_name: (payloadServiceName && !payloadServiceName.startsWith('${')) ? payloadServiceName : service.title,
    service_price: (payloadServicePrice && !payloadServicePrice.startsWith('${')) ? payloadServicePrice : `R$ ${service.price}`,
    barber_name: (payloadBarberName && !payloadBarberName.startsWith('${')) ? payloadBarberName : barber.title,
    formatted_date: formattedDate
  };
  
  // Gerar booking_id
  const bookingId = generateBookingId();
  
  const responseDataWithBooking = {
    ...responseData,
    booking_id: bookingId
  };
  
  console.log('📤 SUBMIT_DETAILS - Dados que serão retornados:', JSON.stringify(responseDataWithBooking, null, 2));
  
  // Armazenar dados do agendamento para uso no webhook
  bookingStorage.set(bookingId, responseDataWithBooking);
  
  // Retornar para tela de confirmação
  return {
    version: '3.0',
    screen: 'CONFIRMATION',
    data: responseDataWithBooking
  };
}

module.exports = {
  handleSubmitDetails,
  setPreviousData
};

