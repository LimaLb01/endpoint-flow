/**
 * Handler para confirmação de agendamento
 */

const { getServiceById, getServicePrice } = require('../config/services');
const { getBarbersByBranch } = require('../config/branches');
const { createAppointment } = require('../services/calendar-service');
const { WHATSAPP_CONFIG, MESSAGES } = require('../config/constants');
const { recordBooking } = require('../utils/metrics');
const { getCustomerByCpf, updateCustomer } = require('../services/customer-service');
const { globalLogger } = require('../utils/logger');

/**
 * Processa confirmação de agendamento
 * @param {object} payload - Dados da requisição
 * @param {string} requestId - Request ID para logs (opcional)
 * @returns {object|null} Resposta ou null se chamado via webhook
 */
async function handleConfirmBooking(payload, requestId = null) {
  const { 
    selected_service, selected_date, selected_barber, selected_time,
    selected_branch, client_name, client_phone, client_email, contact_preference, notes,
    client_cpf, has_plan, is_club_member, booking_id
  } = payload;
  
  const service = getServiceById(selected_service);
  const barbers = getBarbersByBranch(selected_branch);
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Calcular preço baseado em plano/clube
  const price = getServicePrice(selected_service, has_plan || false, is_club_member || false);
  
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
  
  // Atualizar dados do cliente se CPF estiver disponível
  if (client_cpf && (client_name || client_phone || client_email)) {
    try {
      const cleanCpf = client_cpf.replace(/\D/g, '');
      const customer = await getCustomerByCpf(cleanCpf);
      
      if (customer) {
        const updates = {};
        if (client_name && !customer.name) {
          updates.name = client_name;
        }
        if (client_phone && !customer.phone) {
          updates.phone = client_phone;
        }
        if (client_email && !customer.email) {
          updates.email = client_email;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateCustomer(customer.id, updates);
          globalLogger.info('Cliente atualizado com dados do Flow', {
            customerId: customer.id,
            cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*'),
            updatedFields: Object.keys(updates)
          });
        }
      }
    } catch (error) {
      globalLogger.warn('Erro ao atualizar cliente com dados do Flow', {
        error: error.message,
        cpf: client_cpf?.replace(/\d(?=\d{4})/g, '*')
      });
      // Não interrompe o fluxo se falhar a atualização
    }
  }
  
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
    }, requestId);
    
    const finalBookingId = booking_id || `AGD-${Date.now().toString().slice(-6)}`;
    
    console.log('='.repeat(60));
    console.log('✅ AGENDAMENTO CRIADO COM SUCESSO');
    console.log('='.repeat(60));
    console.log(`📋 Booking ID: ${finalBookingId}`);
    console.log(`📅 Evento ID: ${appointment.id || 'N/A'}`);
    console.log(`🔗 Link: ${appointment.htmlLink || 'N/A'}`);
    console.log(`📊 Status: ${appointment.status || 'N/A'}`);
    console.log('='.repeat(60));
    
    // Registrar agendamento bem-sucedido nas métricas
    recordBooking(true, selected_service, selected_barber);
    
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
    // Registrar agendamento falhado nas métricas
    recordBooking(false, payload.selected_service, payload.selected_barber);
    
    const { CalendarError, FlowError, getUserFriendlyMessage } = require('../utils/errors');
    const { globalLogger } = require('../utils/logger');
    
    globalLogger.error('Erro ao criar agendamento', error);
    
    // Se foi chamado via data_exchange, retornar erro formatado para Flow
    if (payload.action_type === 'CONFIRM_BOOKING') {
      const errorMessage = error instanceof CalendarError || error instanceof FlowError
        ? getUserFriendlyMessage(error.code)
        : MESSAGES.ERROR_BOOKING_FAILED;
      
      return {
        version: '3.0',
        screen: 'CONFIRMATION',
        data: {
          ...payload,
          error: true,
          error_message: errorMessage,
          error_code: error.code || 'BOOKING_ERROR'
        }
      };
    }
    
    // Re-lançar erro para ser tratado pelo middleware
    throw error;
  }
}

module.exports = {
  handleConfirmBooking
};

