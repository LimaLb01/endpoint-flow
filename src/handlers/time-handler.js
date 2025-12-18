/**
 * Handler para seleção de horário
 */

const { getServiceById, getServicePrice } = require('../config/services');
const { getBarbersByBranch } = require('../config/branches');
const { formatDate } = require('../utils/date-formatter');
const { cleanMultipleFields } = require('../utils/placeholder-cleaner');
const { generateBookingId } = require('../utils/booking-id-generator');
const { getCustomerByCpf } = require('../services/customer-service');
const { globalLogger } = require('../utils/logger');

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
  let { selected_service, selected_date, selected_barber, selected_time, selected_branch, client_cpf, client_name, has_plan, is_club_member } = payload;
  
  // Limpar placeholders
  const cleaned = cleanMultipleFields(
    { selected_service, selected_date, selected_barber, selected_time, selected_branch },
    previousFlowData
  );
  selected_service = cleaned.selected_service;
  selected_date = cleaned.selected_date;
  selected_barber = cleaned.selected_barber;
  selected_time = cleaned.selected_time;
  selected_branch = cleaned.selected_branch;
  
  const service = getServiceById(selected_service);
  const barbers = getBarbersByBranch(selected_branch);
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  const price = getServicePrice(selected_service, has_plan || false, is_club_member || false);
  const priceText = price === 0 ? 'R$ 0,00' : `R$ ${price.toFixed(2).replace('.', ',')}`;
  
  // Formatar data
  const dateToFormat = selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
  
  // Buscar dados do cliente se tiver CPF
  let clientName = '';
  let clientPhone = '';
  let clientEmail = '';
  
  // Limpar CPF para busca
  const cleanCpf = client_cpf ? client_cpf.replace(/\D/g, '') : null;
  
  if (cleanCpf && cleanCpf.length === 11) {
    try {
      const customer = await getCustomerByCpf(cleanCpf);
      if (customer) {
        clientName = customer.name || '';
        clientPhone = customer.phone || '';
        clientEmail = customer.email || '';
        
        globalLogger.info('Dados do cliente encontrados para preenchimento', {
          cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*'),
          hasName: !!clientName,
          hasPhone: !!clientPhone,
          hasEmail: !!clientEmail
        });
      } else {
        globalLogger.info('Cliente não encontrado no banco de dados', {
          cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*')
        });
      }
    } catch (error) {
      globalLogger.warn('Erro ao buscar dados do cliente para preenchimento', {
        cpf: cleanCpf?.replace(/\d(?=\d{4})/g, '*'),
        error: error.message
      });
      // Não interrompe o fluxo se falhar
    }
  } else if (client_cpf) {
    globalLogger.warn('CPF inválido para busca de dados do cliente', {
      cpf: client_cpf?.replace(/\d(?=\d{4})/g, '*')
    });
  }
  
  // Gerar booking_id antecipadamente
  const bookingId = generateBookingId();
  
  const responseData = {
    selected_service: selected_service || previousFlowData.selected_service,
    selected_date: selected_date || previousFlowData.selected_date,
    selected_barber: selected_barber || previousFlowData.selected_barber,
    selected_branch: selected_branch || previousFlowData.selected_branch,
    selected_time: selected_time || previousFlowData.selected_time,
    client_cpf: client_cpf || previousFlowData.client_cpf,
    has_plan: has_plan || previousFlowData.has_plan || false,
    is_club_member: is_club_member || previousFlowData.is_club_member || false,
    service_name: service.title,
    service_price: priceText,
    barber_name: barber ? barber.title : 'Barbeiro',
    formatted_date: formatDate(dateToFormat),
    booking_id: bookingId,
    client_name: clientName || '',
    client_phone: clientPhone || '',
    client_email: clientEmail || ''
  };
  
  globalLogger.info('📤 TIME_SELECTION - Dados enviados para tela DETAILS', {
    hasClientName: !!clientName,
    hasClientPhone: !!clientPhone,
    hasClientEmail: !!clientEmail,
    clientName: clientName || 'vazio',
    clientPhone: clientPhone || 'vazio',
    clientEmail: clientEmail || 'vazio',
    clientCpf: client_cpf ? client_cpf.replace(/\d(?=\d{4})/g, '*') : 'não informado'
  });
  
  return {
    version: '3.0',
    screen: 'DETAILS',
    data: responseData
  };
}

module.exports = {
  handleSelectTime,
  setPreviousData
};

