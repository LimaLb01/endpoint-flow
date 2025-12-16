/**
 * Handler para confirmação de agendamento
 */

const { getServiceById } = require('../config/services');
const { getBarbers, createAppointment } = require('../services/calendar-service');
const { WHATSAPP_CONFIG, MESSAGES } = require('../config/constants');

/**
 * Processa confirmação de agendamento
 * @param {object} payload - Dados da requisição
 * @returns {object|null} Resposta ou null se chamado via webhook
 */
async function handleConfirmBooking(payload) {
  const { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes,
    booking_id
  } = payload;
  
  const service = getServiceById(selected_service);
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  console.log('✅ Criando agendamento no Google Calendar...');
  console.log('📝 Dados do agendamento:', {
    service: selected_service,
    barber: selected_barber,
    date: selected_date,
    time: selected_time,
    clientName: client_name,
    clientPhone: client_phone,
    bookingId: booking_id
  });
  
  try {
    console.log('='.repeat(60));
    console.log('🔄 INICIANDO CRIAÇÃO DE AGENDAMENTO');
    console.log('='.repeat(60));
    console.log('📋 Dados recebidos:', {
      service: selected_service,
      barber: selected_barber,
      date: selected_date,
      time: selected_time,
      clientName: client_name,
      clientPhone: client_phone,
      clientEmail: client_email,
      bookingId: booking_id
    });
    
    // Criar evento no Google Calendar
    console.log('📅 Chamando createAppointment...');
    const appointment = await createAppointment({
      service: selected_service,
      barber: selected_barber,
      date: selected_date,
      time: selected_time,
      clientName: client_name,
      clientPhone: client_phone,
      clientEmail: client_email || '',
      contactPreference: contact_preference || '',
      notes: notes || ''
    });
    
    const finalBookingId = booking_id || `AGD-${Date.now().toString().slice(-6)}`;
    
    console.log('='.repeat(60));
    console.log('✅ AGENDAMENTO CRIADO COM SUCESSO');
    console.log('='.repeat(60));
    console.log(`📋 Booking ID: ${finalBookingId}`);
    console.log(`📅 Evento ID: ${appointment.id || 'N/A'}`);
    console.log(`🔗 Link: ${appointment.htmlLink || 'N/A'}`);
    console.log(`📊 Status: ${appointment.status || 'N/A'}`);
    console.log('='.repeat(60));
    
    // Se foi chamado via data_exchange, retornar SUCCESS
    if (payload.action_type === 'CONFIRM_BOOKING') {
      return {
        version: '3.0',
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: {
              flow_token: payload.flow_token || 'agendamento-flow-token',
              booking_id: finalBookingId,
              selected_service: selected_service || payload.selected_service,
              selected_date: selected_date || payload.selected_date,
              selected_barber: selected_barber || payload.selected_barber,
              selected_time: selected_time || payload.selected_time,
              client_name: client_name || payload.client_name || '',
              client_phone: client_phone || payload.client_phone || '',
              service_name: service.title,
              barber_name: barber.title,
              status: 'confirmed'
            }
          }
        }
      };
    }
    
    // Se foi chamado via webhook, não retorna nada
    return null;
    
  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ ERRO AO CRIAR AGENDAMENTO');
    console.error('='.repeat(60));
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error response:', error.response ? JSON.stringify(error.response.data, null, 2) : 'N/A');
    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('='.repeat(60));
    
    // Se foi chamado via data_exchange, retornar erro
    if (payload.action_type === 'CONFIRM_BOOKING') {
      return {
        version: '3.0',
        screen: 'CONFIRMATION',
        data: {
          ...payload,
          error_message: MESSAGES.ERROR_BOOKING_FAILED
        }
      };
    }
    
    throw error;
  }
}

module.exports = {
  handleConfirmBooking
};

