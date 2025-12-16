/**
 * WhatsApp Flow Endpoint - Barbearia Multi-tenant
 * Servidor para integrar WhatsApp Flow com Google Calendar
 * Modelo padrão para múltiplas barbearias
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { decryptRequest, encryptResponse, isRequestSignatureValid } = require('./crypto-utils');
const { getAvailableSlots, createAppointment, getBarbers } = require('./calendar-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Armazenamento temporário de agendamentos (usando booking_id como chave)
// Em produção, use um banco de dados ou cache (Redis)
const bookingStorage = new Map();

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
      console.log('🔍 Detectado webhook do WhatsApp Business Account');
      let isWebhookMessage = false;
      
      for (const entry of decryptedData.entry) {
        if (entry.changes) {
          console.log(`🔍 Processando ${entry.changes.length} mudança(s) no entry`);
          for (const change of entry.changes) {
            console.log(`🔍 Campo da mudança: ${change.field}`);
            
            // Webhook de flows (notificações do Flow) - ignorar
            if (change.field === 'flows') {
              console.log('📨 Webhook de flows - ignorando');
              return res.status(200).json({ version: '3.0', data: {} });
            }
            
            // Webhook de status de mensagem (sent, delivered, etc) - ignorar
            if (change.field === 'messages' && change.value?.statuses) {
              console.log('📨 Webhook de status de mensagem - ignorando');
              return res.status(200).json({});
            }
            
            // Webhook de mensagem recebida
            if (change.field === 'messages' && change.value?.messages) {
              console.log(`🔍 Processando ${change.value.messages.length} mensagem(ns) recebida(s)`);
              
              for (const message of change.value.messages) {
                const fromNumber = message.from;
                console.log(`🔍 Analisando mensagem - Tipo: ${message.type}, De: ${fromNumber}`);
                
                // Verificar se é uma resposta de Flow (nfm_reply quando Flow é concluído)
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
                    if (bookingData.status === 'confirmed' && bookingData.booking_id) {
                      console.log('✅ Processando confirmação de agendamento...');
                      
                      // ✅ Recuperar dados completos do armazenamento usando booking_id
                      const storedData = bookingStorage.get(bookingData.booking_id);
                      
                      if (storedData) {
                        console.log('📦 Dados completos recuperados do armazenamento');
                        // Combinar dados do webhook com dados armazenados
                        const completeBookingData = {
                          ...storedData,
                          ...bookingData,
                          // Remover timestamp do armazenamento
                          timestamp: undefined
                        };
                        
                        // Criar agendamento no Google Calendar com dados completos
                        await handleConfirmBooking(completeBookingData);
                        
                        // Remover dados do armazenamento após processar
                        bookingStorage.delete(bookingData.booking_id);
                        console.log(`🗑️ Dados removidos do armazenamento: ${bookingData.booking_id}`);
                        
                        console.log('✅ Agendamento criado no Google Calendar!');
                      } else {
                        console.warn(`⚠️ Dados não encontrados para booking_id: ${bookingData.booking_id}`);
                        console.warn('⚠️ Tentando criar agendamento com dados limitados do webhook...');
                        // Tentar criar com dados disponíveis (pode falhar se faltar dados essenciais)
                        await handleConfirmBooking(bookingData);
                      }
                    } else {
                      console.warn('⚠️ Webhook recebido sem booking_id ou status confirmed');
                    }
                  } catch (error) {
                    console.error('❌ Erro ao processar webhook de mensagem:', error.message);
                    console.error('❌ Stack:', error.stack);
                  }
                  
                  // Retornar resposta vazia para webhooks de mensagem
                  return res.status(200).json({});
                }
                
                // Verificar se é uma mensagem de texto normal (para enviar flow automaticamente)
                if (message.type === 'text' && message.text) {
                  isWebhookMessage = true;
                  console.log(`📨 Mensagem de texto recebida de ${fromNumber}: ${message.text.body}`);
                  
                  // Verificar se deve enviar flow automaticamente
                  const AUTO_SEND_FLOW_NUMBER = process.env.AUTO_SEND_FLOW_NUMBER; // Número específico ou deixar vazio para qualquer número
                  
                  console.log(`🔍 AUTO_SEND_FLOW_NUMBER configurado: ${AUTO_SEND_FLOW_NUMBER || '(vazio - enviar para qualquer número)'}`);
                  
                  // Formatar números para comparação (remover caracteres não numéricos)
                  const formattedFromNumber = fromNumber.replace(/\D/g, '');
                  const formattedAutoSendNumber = AUTO_SEND_FLOW_NUMBER ? AUTO_SEND_FLOW_NUMBER.replace(/\D/g, '') : '';
                  
                  console.log(`🔍 Comparando números - De: ${formattedFromNumber}, Configurado: ${formattedAutoSendNumber || '(qualquer número)'}`);
                  
                  if (!AUTO_SEND_FLOW_NUMBER || formattedFromNumber === formattedAutoSendNumber) {
                    console.log('🚀 Enviando flow automaticamente...');
                    
                    try {
                      await sendFlowAutomatically(fromNumber);
                      console.log('✅ Flow enviado automaticamente!');
                    } catch (error) {
                      console.error('❌ Erro ao enviar flow automaticamente:', error.message);
                      console.error('❌ Stack:', error.stack);
                    }
                  } else {
                    console.log(`⏭️ Número ${fromNumber} não está na lista de envio automático`);
                  }
                  
                  // Retornar resposta vazia
                  return res.status(200).json({});
                }
                
                console.log(`⚠️ Tipo de mensagem não tratado: ${message.type}`);
              }
            }
          }
        }
      }
    }

  // Processar requisição do Flow
  const response = await handleFlowRequest(decryptedData);

  console.log('📤 Resposta:', JSON.stringify(response, null, 2));
  
  // Log específico para CONFIRMATION screen
  if (response.screen === 'CONFIRMATION') {
    console.log('✅ Retornando para tela CONFIRMATION');
    console.log(`📊 Número de campos no data: ${Object.keys(response.data || {}).length}`);
    console.log(`📋 Campos: ${Object.keys(response.data || {}).join(', ')}`);
  }

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
  
  // ✅ Armazenar dados do agendamento para uso no webhook
  // Quando o webhook chegar com booking_id, poderemos recuperar todos os dados
  bookingStorage.set(bookingId, {
    ...responseDataWithBooking,
    timestamp: Date.now()
  });
  console.log(`💾 Dados do agendamento armazenados com booking_id: ${bookingId}`);
  
  // Limpar dados antigos (mais de 1 hora)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [id, data] of bookingStorage.entries()) {
    if (data.timestamp < oneHourAgo) {
      bookingStorage.delete(id);
      console.log(`🗑️ Dados antigos removidos: ${id}`);
    }
  }
  
  // ✅ SOLUÇÃO: Retornar diretamente para CONFIRMATION com todos os dados formatados
  // Isso evita o problema do componente If não funcionar corretamente na tela DETAILS
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
 * Envia Flow automaticamente quando recebe mensagem de texto
 */
async function sendFlowAutomatically(toNumber) {
  const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  const FLOW_ID = process.env.WHATSAPP_FLOW_ID || '888145740552051';
  
  console.log('🔑 Verificando credenciais...');
  console.log(`🔑 PHONE_NUMBER_ID: ${PHONE_NUMBER_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`🔑 ACCESS_TOKEN: ${ACCESS_TOKEN ? `✅ Configurado (${ACCESS_TOKEN.substring(0, 20)}...)` : '❌ Não configurado'}`);
  console.log(`🔑 FLOW_ID: ${FLOW_ID}`);
  
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID devem estar configurados');
  }
  
  // Formatar número de telefone (remover caracteres especiais)
  const formattedPhone = toNumber.replace(/\D/g, '');
  console.log(`📱 Número formatado: ${formattedPhone}`);
  
  // Gerar flow_token único
  const flowToken = `agendamento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🎫 Flow token gerado: ${flowToken}`);
  
  // Payload da mensagem
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: {
        text: 'Olá! Agende seu horário na barbearia de forma rápida e prática. 🎯'
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: FLOW_ID,
          flow_cta: 'Agendar Horário',
          flow_action: 'navigate',
          flow_action_payload: {
            screen: 'WELCOME'
          }
        }
      }
    }
  };
  
  const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
  console.log(`📤 URL da requisição: ${url}`);
  console.log(`📦 Payload: ${JSON.stringify(messagePayload, null, 2)}`);
  
  try {
    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  
    console.log(`✅ Flow enviado automaticamente para ${formattedPhone}`);
    console.log(`   🆔 Flow ID: ${FLOW_ID}`);
    console.log(`   🎫 Flow Token: ${flowToken}`);
    console.log(`   📋 Resposta: ${JSON.stringify(response.data, null, 2)}`);
  
    return response.data;
  } catch (error) {
    console.error('❌ Erro detalhado ao enviar flow:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Status Text: ${error.response?.statusText}`);
    console.error(`   Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.status === 401) {
      throw new Error('Token de acesso inválido ou expirado. Gere um novo token em: https://developers.facebook.com/apps/[SEU_APP_ID]/whatsapp-business/wa-settings/');
    }
    
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
