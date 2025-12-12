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

    // Processar requisição
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

/**
 * Processa requisições do Flow
 */
async function handleFlowRequest(data) {
  const { action, screen, data: flowData, version } = data;
  const payload = flowData || {};
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
  const { selected_service, selected_date } = payload;
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
  const { selected_service, selected_date, selected_barber } = payload;
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
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
  const { selected_service, selected_date, selected_barber, selected_time } = payload;
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Formatar data
  const dateObj = new Date(selected_date + 'T12:00:00');
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  
  return {
    version: '3.0',
    screen: 'DETAILS',
    data: {
      selected_service,
      selected_date,
      selected_barber,
      selected_time,
      service_name: service.title,
      service_price: `R$ ${service.price}`,
      barber_name: barber.title,
      formatted_date: formattedDate
    }
  };
}

/**
 * Envio dos dados pessoais → vai para confirmação
 */
async function handleSubmitDetails(payload) {
  const { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes 
  } = payload;
  
  console.log('📋 SUBMIT_DETAILS - Payload recebido:', JSON.stringify(payload, null, 2));
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  // Formatar data
  const dateObj = new Date(selected_date + 'T12:00:00');
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
  
  const responseData = {
    selected_service,
    selected_date,
    selected_barber,
    selected_time,
    client_name,
    client_phone,
    client_email: client_email || '',
    contact_preference,
    notes: notes || '',
    service_name: service.title,
    service_price: `R$ ${service.price}`,
    barber_name: barber.title,
    formatted_date: formattedDate
  };
  
  console.log('📤 SUBMIT_DETAILS - Dados que serão retornados:', JSON.stringify(responseData, null, 2));
  
  return {
    version: '3.0',
    screen: 'CONFIRMATION',
    data: responseData
  };
}

/**
 * Confirmação → cria agendamento e vai para sucesso
 */
async function handleConfirmBooking(payload) {
  const { 
    selected_service, selected_date, selected_barber, selected_time,
    client_name, client_phone, client_email, contact_preference, notes 
  } = payload;
  
  const service = SERVICES.find(s => s.id === selected_service) || SERVICES[0];
  const barbers = await getBarbers();
  const barber = barbers.find(b => b.id === selected_barber) || barbers[0];
  
  console.log('✅ Criando agendamento no Google Calendar...');
  
  try {
    // Criar evento no Google Calendar
    const appointment = await createAppointment({
      service: selected_service,
      barber: selected_barber,
      date: selected_date,
      time: selected_time,
      clientName: client_name,
      clientPhone: client_phone,
      clientEmail: client_email,
      contactPreference: contact_preference,
      notes: notes
    });
    
    // Gerar código do agendamento
    const bookingId = `AGD-${Date.now().toString().slice(-6)}`;
    
    // Formatar data
    const dateObj = new Date(selected_date + 'T12:00:00');
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const formattedDate = `${selected_date.split('-').reverse().join('/')} (${diasSemana[dateObj.getDay()]})`;
    
    console.log(`✅ Agendamento criado: ${bookingId}`);
    
    return {
      version: '3.0',
      screen: 'SUCCESS',
      data: {
        booking_id: bookingId,
        service_name: service.title,
        barber_name: barber.title,
        formatted_date: formattedDate,
        selected_time: selected_time,
        service_price: `R$ ${service.price}`
      }
    };
    
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error.message);
    
    // Retornar erro amigável
    return {
      version: '3.0',
      screen: 'CONFIRMATION',
      data: {
        ...payload,
        error_message: 'Não foi possível confirmar. Tente novamente.'
      }
    };
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
