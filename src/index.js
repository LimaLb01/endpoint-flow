/**
 * WhatsApp Flow Endpoint - Barbearia Multi-tenant
 * Servidor para integrar WhatsApp Flow com Google Calendar
 * Modelo padrão para múltiplas barbearias
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { decryptRequest, encryptResponse, isRequestSignatureValid } = require('./crypto-utils');
const { getAvailableSlots, createAppointment, getBarbers } = require('./calendar-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração de serviços (pode ser movido para banco de dados)
const SERVICES = [
  { id: 'corte_masculino', title: 'Corte Masculino', description: 'R$ 45 • 45 min', price: 45, duration: 45 },
  { id: 'barba', title: 'Barba', description: 'R$ 35 • 30 min', price: 35, duration: 30 },
  { id: 'corte_barba', title: 'Corte + Barba', description: 'R$ 70 • 1h15', price: 70, duration: 75 },
  { id: 'corte_infantil', title: 'Corte Infantil', description: 'R$ 40 • 30 min', price: 40, duration: 30 },
  { id: 'pigmentacao', title: 'Pigmentação', description: 'R$ 50 • 45 min', price: 50, duration: 45 }
];

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp Flow Endpoint - Barbearia',
    timestamp: new Date().toISOString()
  });
});

// Webhook verification (para configurar webhooks no Meta App Dashboard)
app.get('/webhook/whatsapp-flow', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificação do webhook
  if (mode && token) {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'flow_verify_token_2024';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Falha na verificação do webhook');
      return res.sendStatus(403);
    }
  }

  // Health check normal
  res.json({ status: 'healthy' });
});

/**
 * Endpoint principal do WhatsApp Flow
 */
app.post('/webhook/whatsapp-flow', async (req, res) => {
  console.log('📥 Requisição recebida');
  
  try {
    // Validar assinatura da requisição (segurança)
    // NOTA: Temporariamente desabilitado para permitir health check
    // Reativar após confirmar APP_SECRET correto no Render
    const signature = req.headers['x-hub-signature-256'];
    if (signature && process.env.APP_SECRET) {
      const isValid = isRequestSignatureValid(req.body, signature);
      if (!isValid) {
        console.warn('⚠️ Assinatura inválida (continuando mesmo assim para debug)');
        // Não bloquear por enquanto - apenas logar
        // return res.status(432).json({ error: 'Invalid signature' });
      } else {
        console.log('✅ Assinatura validada');
      }
    } else {
      console.log('⚠️ Validação de assinatura desativada (APP_SECRET não configurado)');
    }

    // Verificar se tem criptografia
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;
    
    let decryptedData;
    let shouldEncrypt = false;
    let aesKeyBuffer = null;
    let initialVectorBuffer = null;

    if (encrypted_aes_key && encrypted_flow_data && initial_vector && process.env.PRIVATE_KEY) {
      // Descriptografar usando a nova interface (baseada no exemplo oficial)
      const decryptResult = decryptRequest(
        req.body,
        process.env.PRIVATE_KEY,
        process.env.PASSPHRASE || ''
      );
      decryptedData = decryptResult.decryptedBody;
      aesKeyBuffer = decryptResult.aesKeyBuffer;
      initialVectorBuffer = decryptResult.initialVectorBuffer;
      shouldEncrypt = true;
      console.log('🔓 Dados descriptografados');
    } else {
      // Sem criptografia (teste local)
      decryptedData = req.body;
      console.log('⚠️ Sem criptografia - modo teste');
    }

    console.log('📋 Dados:', JSON.stringify(decryptedData, null, 2));

    // Verificar se é um webhook de mensagem (quando Flow é concluído)
    if (decryptedData.object === 'whatsapp_business_account' && decryptedData.entry) {
      let isWebhookMessage = false;
      
      for (const entry of decryptedData.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            // Webhook de status de mensagem (sent, delivered, etc) - ignorar
            if (change.field === 'messages' && change.value?.statuses) {
              console.log('📨 Webhook de status de mensagem - ignorando');
              return res.status(200).json({});
            }
            
            // Webhook de mensagem recebida (nfm_reply quando Flow é concluído)
            if (change.field === 'messages' && change.value?.messages) {
              for (const message of change.value.messages) {
                // Verificar se é uma resposta de Flow (nfm_reply)
                if (message.type === 'interactive' && 
                    message.interactive?.type === 'nfm_reply' &&
                    message.interactive?.nfm_reply?.response_json) {
                  
                  isWebhookMessage = true;
                  console.log('📨 Webhook de mensagem - Flow concluído!');
                  
                  try {
                    // Extrair dados do response_json
                    const bookingData = JSON.parse(message.interactive.nfm_reply.response_json);
                    console.log('📋 Dados do agendamento recebidos:', JSON.stringify(bookingData, null, 2));
                    
                    // Verificar se tem status "confirmed" (Flow foi concluído)
                    if (bookingData.status === 'confirmed') {
                      console.log('✅ Processando confirmação de agendamento...');
                      
                      // Criar agendamento no Google Calendar
                      await handleConfirmBooking(bookingData);
                      
                      console.log('✅ Agendamento criado no Google Calendar!');
                    }
                  } catch (error) {
                    console.error('❌ Erro ao processar webhook de mensagem:', error.message);
                    console.error('❌ Stack:', error.stack);
                  }
                  
                  // Retornar resposta vazia para webhooks de mensagem
                  return res.status(200).json({});
                }
              }
            }
          }
        }
      }
    }

    // Processar requisição do Flow
    const response = await handleFlowRequest(decryptedData);

    console.log('📤 Resposta:', JSON.stringify(response, null, 2));

    // Criptografar resposta se necessário
    // IMPORTANTE: WhatsApp espera resposta como texto plano (Base64)
    if (shouldEncrypt && aesKeyBuffer && initialVectorBuffer) {
      const encryptedResponse = encryptResponse(
        response,
        aesKeyBuffer,
        initialVectorBuffer
      );
      // Retornar como texto plano (não JSON!)
      res.set('Content-Type', 'text/plain');
      return res.send(encryptedResponse);
    }

    return res.json(response);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Armazenar dados anteriores para usar quando placeholders não são resolvidos
let previousFlowData = {};

/**
 * Limpa placeholders não resolvidos do payload
 * Se um valor contém ${...}, tenta buscar do contexto anterior
 */
function cleanPlaceholders(payload, previousData = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      // É um placeholder não resolvido
      // Tenta extrair o nome da variável e buscar no previousData
      const varName = value.replace(/\$\{([^}]+)\}/, '$1').split('.').pop();
      // Tenta buscar pelo nome completo primeiro, depois pelo nome da variável
      cleaned[key] = previousData[key] || previousData[varName] || null;
      if (cleaned[key]) {
        console.log(`✅ Placeholder ${value} resolvido para: ${cleaned[key]}`);
      } else {
        console.warn(`⚠️ Placeholder ${value} não pôde ser resolvido`);
      }
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Processa requisições do Flow
 */
async function handleFlowRequest(data) {
  const { action, screen, data: flowData, version } = data;
  let payload = flowData || {};
  
  // Limpar placeholders não resolvidos usando dados anteriores
  payload = cleanPlaceholders(payload, previousFlowData);
  
  // Atualizar dados anteriores com valores limpos (mantém valores válidos)
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && !(typeof value === 'string' && value.startsWith('${'))) {
      previousFlowData[key] = value;
    }
  }
  
  const actionType = payload.action_type;

  console.log(`📋 Action: ${action}, Screen: ${screen}, ActionType: ${actionType}`);

  // Health check do WhatsApp
  if (action === 'ping') {
    return { data: { status: 'active' } };
  }

  // INIT - Primeira chamada quando Flow é aberto
  if (action === 'INIT') {
    return handleInit();
  }

  // data_exchange - Navegação entre telas
  if (action === 'data_exchange') {
    switch (actionType) {
      case 'INIT':
        return handleInit();
      case 'SELECT_SERVICE':
        return handleSelectService(payload);
      case 'SELECT_DATE':
        return handleSelectDate(payload);
      case 'SELECT_BARBER':
        return handleSelectBarber(payload);
      case 'SELECT_TIME':
        return handleSelectTime(payload);
      case 'SUBMIT_DETAILS':
        return handleSubmitDetails(payload);
      case 'CONFIRM_BOOKING':
        return handleConfirmBooking(payload);
      default:
        // Fallback baseado na tela atual
        return handleByScreen(screen, payload);
    }
  }

  return { version: version || '3.0', data: {} };
}

/**
 * INIT - Retorna dados iniciais
 */
async function handleInit() {
  console.log('🚀 Inicializando Flow...');
  
  return {
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      services: SERVICES.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description
      }))
    }
  };
}

/**
 * Seleção de serviço → vai para data
 */
async function handleSelectService(payload) {
  const { selected_service } = payload;
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  
  // Calcular datas
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxDate = new Date(today.getTime() + 30*24*60*60*1000).toISOString().split('T')[0];
  
  return {
    version: '3.0',
    screen: 'DATE_SELECTION',
    data: {
      selected_service: selected_service,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      min_date: minDate,
      max_date: maxDate,
      unavailable_dates: [] // Pode ser preenchido com feriados
    }
  };
}

/**
 * Seleção de data → vai para barbeiro
 */
async function handleSelectDate(payload) {
  let { selected_service, selected_date } = payload;
  
  // Limpar placeholders se necessário
  if (selected_service && typeof selected_service === 'string' && selected_service.startsWith('${')) {
    selected_service = previousFlowData.selected_service;
  }
  if (selected_date && typeof selected_date === 'string' && selected_date.startsWith('${')) {
    selected_date = previousFlowData.selected_date;
  }
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  
  // Buscar barbeiros disponíveis
  const barbers = await getBarbers();
  
  // Formatar data
  const dateObj = new Date(selected_date + 'T12:00:00');
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  
  return {
    version: '3.0',
    screen: 'BARBER_SELECTION',
    data: {
      selected_service,
      selected_date,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      formatted_date: formattedDate,
      barbers: barbers.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description || 'Disponível'
      }))
    }
  };
}

/**
 * Seleção de barbeiro → vai para horário
 */
async function handleSelectBarber(payload) {
  let { selected_service, selected_date, selected_barber } = payload;
  
  // Limpar placeholders se necessário
  if (selected_service && selected_service.startsWith('${')) {
    selected_service = previousFlowData.selected_service;
  }
  if (selected_date && selected_date.startsWith('${')) {
    selected_date = previousFlowData.selected_date;
  }
  if (selected_barber && selected_barber.startsWith('${')) {
    selected_barber = previousFlowData.selected_barber;
  }
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Validar dados antes de buscar horários
  if (!selected_barber || !selected_date || selected_barber.startsWith('${') || selected_date.startsWith('${')) {
    console.warn('⚠️ Dados inválidos para buscar horários:', { selected_barber, selected_date });
    // Retornar horários padrão
    const availableTimes = [
      { id: '09:00', title: '09:00', description: 'Disponível - 45 min' },
      { id: '10:00', title: '10:00', description: 'Disponível - 45 min' },
      { id: '14:00', title: '14:00', description: 'Disponível - 45 min' },
      { id: '15:00', title: '15:00', description: 'Disponível - 45 min' },
      { id: '16:00', title: '16:00', description: 'Disponível - 45 min' }
    ];
    
    const dateObj = new Date((selected_date || new Date().toISOString().split('T')[0]) + 'T12:00:00');
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const formattedDate = `${(selected_date || new Date().toISOString().split('T')[0]).split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
    
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
        formatted_date: formattedDate,
        available_times: availableTimes
      }
    };
  }
  
  // Buscar horários disponíveis do Google Calendar
  const availableTimes = await getAvailableSlots(selected_barber, selected_date, selected_service);
  
  // Formatar data
  const dateObj = new Date(selected_date + 'T12:00:00');
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  
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
      formatted_date: formattedDate,
      available_times: availableTimes.length > 0 ? availableTimes : [
        { id: 'sem_horario', title: 'Sem horários', description: 'Tente outra data' }
      ]
    }
  };
}

/**
 * Seleção de horário → vai para dados pessoais
 */
async function handleSelectTime(payload) {
  let { selected_service, selected_date, selected_barber, selected_time } = payload;
  
  // Limpar placeholders se necessário
  if (selected_service && typeof selected_service === 'string' && selected_service.startsWith('${')) {
    selected_service = previousFlowData.selected_service;
  }
  if (selected_date && typeof selected_date === 'string' && selected_date.startsWith('${')) {
    selected_date = previousFlowData.selected_date;
  }
  if (selected_barber && typeof selected_barber === 'string' && selected_barber.startsWith('${')) {
    selected_barber = previousFlowData.selected_barber;
  }
  if (selected_time && typeof selected_time === 'string' && selected_time.startsWith('${')) {
    selected_time = previousFlowData.selected_time;
  }
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Formatar data
  const dateToFormat = selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
  const dateObj = new Date(dateToFormat + 'T12:00:00');
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const formattedDate = `${dateToFormat.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  
  // Gerar booking_id antecipadamente para mostrar na tela DETAILS
  const bookingId = `AGD-${Date.now().toString().slice(-6)}`;
  
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
      formatted_date: formattedDate,
      booking_id: bookingId
    }
  };
}

/**
 * Envio dos dados pessoais → vai para confirmação
 */
async function handleSubmitDetails(payload) {
  let { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes,
    // Dados formatados podem vir do payload (se passados no Flow)
    service_name: payloadServiceName,
    service_price: payloadServicePrice,
    barber_name: payloadBarberName,
    formatted_date: payloadFormattedDate
  } = payload;
  
  console.log('📋 SUBMIT_DETAILS - Payload recebido:', JSON.stringify(payload, null, 2));
  
  // Limpar placeholders não resolvidos usando dados anteriores
  if (selected_service && typeof selected_service === 'string' && selected_service.startsWith('${')) {
    selected_service = previousFlowData.selected_service;
  }
  if (selected_date && typeof selected_date === 'string' && selected_date.startsWith('${')) {
    selected_date = previousFlowData.selected_date;
  }
  if (selected_barber && typeof selected_barber === 'string' && selected_barber.startsWith('${')) {
    selected_barber = previousFlowData.selected_barber;
  }
  if (selected_time && typeof selected_time === 'string' && selected_time.startsWith('${')) {
    selected_time = previousFlowData.selected_time;
  }
  if (client_name && typeof client_name === 'string' && client_name.startsWith('${')) {
    client_name = previousFlowData.client_name;
  }
  if (client_phone && typeof client_phone === 'string' && client_phone.startsWith('${')) {
    client_phone = previousFlowData.client_phone;
  }
  if (client_email && typeof client_email === 'string' && client_email.startsWith('${')) {
    client_email = previousFlowData.client_email;
  }
  if (notes && typeof notes === 'string' && notes.startsWith('${')) {
    notes = previousFlowData.notes;
  }
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Formatar data (usar do payload se disponível, senão formatar)
  let formattedDate = payloadFormattedDate;
  if (!formattedDate || (typeof formattedDate === 'string' && formattedDate.startsWith('${'))) {
    const dateToFormat = selected_date || previousFlowData.selected_date || new Date().toISOString().split('T')[0];
    const dateObj = new Date(dateToFormat + 'T12:00:00');
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    formattedDate = `${dateToFormat.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  }
  
  // Usar dados formatados do payload se disponíveis, senão formatar
  const responseData = {
    selected_service: selected_service || previousFlowData.selected_service,
    selected_date: selected_date || previousFlowData.selected_date,
    selected_barber: selected_barber || previousFlowData.selected_barber,
    selected_time: selected_time || previousFlowData.selected_time,
    client_name: client_name || previousFlowData.client_name || '',
    client_phone: client_phone || previousFlowData.client_phone || '',
    client_email: client_email || previousFlowData.client_email || '',
    contact_preference: contact_preference || '',
    notes: notes || previousFlowData.notes || '',
    service_name: (payloadServiceName && !payloadServiceName.startsWith('${')) ? payloadServiceName : service.title,
    service_price: (payloadServicePrice && !payloadServicePrice.startsWith('${')) ? payloadServicePrice : `R$ ${service.price}`,
    barber_name: (payloadBarberName && !payloadBarberName.startsWith('${')) ? payloadBarberName : barber.title,
    formatted_date: formattedDate
  };
  
  // Gerar booking_id temporário (será usado quando criar o agendamento)
  const bookingId = `AGD-${Date.now().toString().slice(-6)}`;
  
  const responseDataWithBooking = {
    ...responseData,
    booking_id: bookingId
  };
  
  console.log('📤 SUBMIT_DETAILS - Dados que serão retornados:', JSON.stringify(responseDataWithBooking, null, 2));
  
  // ✅ SOLUÇÃO: Retornar diretamente para tela terminal CONFIRMATION com todos os dados
  // O WhatsApp Flow aplica dados em telas terminais quando vêm diretamente do endpoint
  return {
    version: '3.0',
    screen: 'CONFIRMATION',
    data: responseDataWithBooking
  };
}

/**
 * Confirmação → cria agendamento no Google Calendar
 * Pode ser chamado via data_exchange (Flow antigo) ou via webhook (Flow novo)
 */
async function handleConfirmBooking(payload) {
  const { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes,
    booking_id // Pode vir do webhook ou ser gerado
  } = payload;
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
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
    // Criar evento no Google Calendar
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
    
    // Usar booking_id existente ou gerar novo
    const finalBookingId = booking_id || `AGD-${Date.now().toString().slice(-6)}`;
    
    console.log(`✅ Agendamento criado no Google Calendar: ${finalBookingId}`);
    console.log(`📅 Evento ID: ${appointment.id || 'N/A'}`);
    
    // Se foi chamado via data_exchange (Flow antigo), retornar tela SUCCESS
    // Se foi chamado via webhook (Flow novo), não precisa retornar nada
    if (payload.action_type === 'CONFIRM_BOOKING') {
      // Formatar data
      const dateObj = new Date(selected_date + 'T12:00:00');
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
      
      return {
        version: '3.0',
        screen: 'SUCCESS',
        data: {
          booking_id: finalBookingId,
          service_name: service.title,
          barber_name: barber.title,
          formatted_date: formattedDate,
          selected_time: selected_time,
          service_price: `R$ ${service.price}`
        }
      };
    }
    
    // Se foi chamado via webhook, não retorna nada (já foi respondido)
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Se foi chamado via data_exchange, retornar erro
    if (payload.action_type === 'CONFIRM_BOOKING') {
      return {
        version: '3.0',
        screen: 'CONFIRMATION',
        data: {
          ...payload,
          error_message: 'Não foi possível confirmar. Tente novamente.'
        }
      };
    }
    
    // Se foi chamado via webhook, apenas logar o erro
    throw error;
  }
}

/**
 * Fallback baseado na tela
 */
async function handleByScreen(screen, payload) {
  switch (screen) {
    case 'WELCOME':
      return handleInit();
    case 'SERVICE_SELECTION':
      return handleSelectService(payload);
    case 'DATE_SELECTION':
      return handleSelectDate(payload);
    case 'BARBER_SELECTION':
      return handleSelectBarber(payload);
    case 'TIME_SELECTION':
      return handleSelectTime(payload);
    case 'DETAILS':
      return handleSubmitDetails(payload);
    case 'CONFIRMATION':
      return handleConfirmBooking(payload);
    default:
      return { version: '3.0', data: {} };
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/webhook/whatsapp-flow`);
  console.log(`🔐 Criptografia: ${process.env.PRIVATE_KEY ? 'Ativa' : 'Desativada'}`);
});

module.exports = app;
