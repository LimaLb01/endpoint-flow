/**
 * Serviço de integração com Google Calendar
 * Gerencia horários disponíveis e criação de agendamentos
 */

const { google } = require('googleapis');

// Configuração do Google Calendar
let calendar;
let auth;

// Duração dos serviços em minutos
const SERVICE_DURATION = {
  'corte_masculino': 45,
  'barba': 30,
  'corte_barba': 75,
  'corte_infantil': 30,
  'pigmentacao': 45
};

// Horários de funcionamento (configurável)
const WORKING_HOURS = {
  start: 9, // 9:00
  end: 19,  // 19:00
  interval: 30 // intervalo em minutos
};

// Mapeamento de barbeiros para calendários
// Para uso único (apenas um calendário), definir CALENDAR_LUCAS
const BARBER_CALENDARS = {
  joao: process.env.CALENDAR_LUCAS || process.env.CALENDAR_JOAO || 'primary',
  pedro: process.env.CALENDAR_LUCAS || process.env.CALENDAR_PEDRO || 'primary',
  carlos: process.env.CALENDAR_LUCAS || process.env.CALENDAR_CARLOS || 'primary'
};

/**
 * Inicializa a autenticação com Google Calendar
 */
async function initializeCalendar() {
  if (calendar) return calendar;

  try {
    // Verificar se as credenciais estão configuradas
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('⚠️ Credenciais do Google Calendar não configuradas');
      console.log('⚠️ Usando dados mock para teste');
      return null;
    }

    // Autenticação via Service Account
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Google Calendar inicializado');
    return calendar;

  } catch (error) {
    console.error('❌ Erro ao inicializar Google Calendar:', error.message);
    return null;
  }
}

/**
 * Retorna lista de barbeiros disponíveis
 */
async function getBarbers() {
  // Lista de barbeiros configurada
  // Você pode buscar de um banco de dados ou Google Sheets
  const barbers = [
    { 
      id: 'joao', 
      title: 'João Silva', 
      description: 'Especialista em cortes modernos',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
    },
    { 
      id: 'pedro', 
      title: 'Pedro Santos', 
      description: 'Expert em barbas',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300'
    },
    { 
      id: 'carlos', 
      title: 'Carlos Oliveira', 
      description: 'Cortes clássicos e infantis',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300'
    }
  ];

  return barbers;
}

/**
 * Busca horários disponíveis para um barbeiro em uma data específica
 * @param {string} barberId - ID do barbeiro
 * @param {string} date - Data no formato YYYY-MM-DD
 * @param {string} serviceId - ID do serviço (para calcular duração)
 * @returns {Array} Lista de horários disponíveis
 */
async function getAvailableSlots(barberId, date, serviceId) {
  console.log(`📅 Buscando horários para ${barberId} em ${date}`);
  
  await initializeCalendar();
  
  const serviceDuration = SERVICE_DURATION[serviceId] || 45;
  
  // Se não houver integração real, retornar dados mock
  if (!calendar) {
    console.log('⚠️ Calendar não inicializado, usando mock');
    return getMockAvailableSlots(date, serviceDuration);
  }

  try {
    const calendarId = BARBER_CALENDARS[barberId] || 'primary';
    console.log(`📅 Usando calendário: ${calendarId}`);
    
    // Usar formato ISO com timezone de São Paulo para buscar eventos
    // O Google Calendar API aceita RFC3339 com offset
    const startOfDayStr = `${date}T${String(WORKING_HOURS.start).padStart(2, '0')}:00:00-03:00`;
    const endOfDayStr = `${date}T${String(WORKING_HOURS.end).padStart(2, '0')}:00:00-03:00`;

    console.log(`📅 Buscando eventos de ${startOfDayStr} até ${endOfDayStr}`);

    // Buscar eventos existentes no calendário
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDayStr,
      timeMax: endOfDayStr,
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'America/Sao_Paulo'
    });

    console.log(`📋 Eventos encontrados: ${response.data.items.length}`);
    
    // Extrair horários ocupados (em formato local de São Paulo)
    const busySlots = response.data.items.map(event => {
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      
      // Extrair apenas a hora (HH:MM) do horário
      const startHour = startTime.substring(11, 16); // "2025-12-11T14:30:00-03:00" -> "14:30"
      const endHour = endTime.substring(11, 16);
      
      console.log(`   📌 Evento ocupado: ${startHour} - ${endHour} (${event.summary})`);
      
      return {
        startHour,
        endHour,
        startMinutes: parseInt(startHour.split(':')[0]) * 60 + parseInt(startHour.split(':')[1]),
        endMinutes: parseInt(endHour.split(':')[0]) * 60 + parseInt(endHour.split(':')[1])
      };
    });

    console.log(`📋 Total de ${busySlots.length} eventos ocupados`);

    // Gerar todos os slots possíveis (em minutos desde meia-noite)
    const allSlots = [];
    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      for (let min = 0; min < 60; min += WORKING_HOURS.interval) {
        allSlots.push({
          hour,
          min,
          minutes: hour * 60 + min,
          time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        });
      }
    }
    
    // Filtrar slots disponíveis
    const availableSlots = allSlots.filter(slot => {
      const slotStart = slot.minutes;
      const slotEnd = slot.minutes + serviceDuration;
      
      // Verificar se o slot não conflita com nenhum evento existente
      const hasConflict = busySlots.some(busy => {
        // Conflito: slot começa antes do evento terminar E slot termina depois do evento começar
        return slotStart < busy.endMinutes && slotEnd > busy.startMinutes;
      });
      
      if (hasConflict) {
        console.log(`   ❌ Slot ${slot.time} bloqueado por conflito`);
      }
      
      return !hasConflict;
    });

    console.log(`✅ ${availableSlots.length} horários disponíveis`);

    // Formatar para o formato do WhatsApp Flow
    return availableSlots.map(slot => ({
      id: slot.time,
      title: slot.time,
      description: `Disponível - ${serviceDuration} min`
    }));

  } catch (error) {
    console.error('❌ Erro ao buscar horários:', error.message);
    console.error('❌ Stack:', error.stack);
    return getMockAvailableSlots(date, serviceDuration);
  }
}

/**
 * Gera slots de tempo entre duas datas
 */
function generateTimeSlots(start, end, intervalMinutes) {
  const slots = [];
  let current = new Date(start);
  
  while (current < end) {
    slots.push(new Date(current));
    current = new Date(current.getTime() + intervalMinutes * 60000);
  }
  
  return slots;
}

/**
 * Retorna horários mock para teste (quando não há Google Calendar configurado)
 */
function getMockAvailableSlots(date, duration) {
  const isWeekend = [0, 6].includes(new Date(date).getDay());
  
  // Simular alguns horários ocupados aleatoriamente
  const allTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
  
  // Remover alguns horários aleatoriamente para simular ocupação
  const availableTimes = allTimes.filter(() => Math.random() > 0.3);
  
  if (isWeekend) {
    // Menos horários no fim de semana
    return availableTimes.slice(0, 6).map(time => ({
      id: time,
      title: time,
      description: `Disponível - ${duration} min`
    }));
  }
  
  return availableTimes.map(time => ({
    id: time,
    title: time,
    description: `Disponível - ${duration} min`
  }));
}

/**
 * Cria um agendamento no Google Calendar
 * @param {object} appointment - Dados do agendamento
 * @returns {object} Evento criado
 */
async function createAppointment(appointment) {
  console.log('📝 Criando agendamento:', appointment);
  
  await initializeCalendar();
  
  const { service, barber, date, time, clientName, clientPhone, clientEmail, notes } = appointment;
  const duration = SERVICE_DURATION[service] || 45;

  // Se não houver integração real, retornar mock
  if (!calendar) {
    console.log('⚠️ Usando mock - agendamento não foi salvo no Google Calendar');
    return {
      id: `mock_${Date.now()}`,
      status: 'confirmed',
      htmlLink: '#'
    };
  }

  try {
    const calendarId = BARBER_CALENDARS[barber] || 'primary';
    
    // Mapear nome do serviço
    const serviceNames = {
      'corte_masculino': 'Corte Masculino',
      'barba': 'Barba',
      'corte_barba': 'Corte + Barba',
      'corte_infantil': 'Corte Infantil',
      'pigmentacao': 'Pigmentação'
    };

    // Mapear nome do barbeiro
    const barberNames = {
      'joao': 'João Silva',
      'pedro': 'Pedro Santos',
      'carlos': 'Carlos Oliveira'
    };

    const serviceName = serviceNames[service] || service;
    const barberName = barberNames[barber] || barber;

    // Calcular horário de fim (adicionar duração)
    const [hours, minutes] = time.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // IMPORTANTE: Usar formato RFC3339 com offset explícito -03:00 (Brasil não usa mais horário de verão)
    // Isso garante que o Google Calendar interprete corretamente o horário de São Paulo
    // Formato: YYYY-MM-DDTHH:MM:SS-03:00
    const startDateTime = `${date}T${time}:00-03:00`;
    const endDateTime = `${date}T${endTime}:00-03:00`;

    console.log('🕐 Datas formatadas com timezone:');
    console.log(`   Início: ${startDateTime} (America/Sao_Paulo)`);
    console.log(`   Fim: ${endDateTime} (America/Sao_Paulo)`);

    // Criar evento usando formato RFC3339 com timezone explícito
    const event = {
      summary: `${serviceName} - ${clientName} (${barberName})`,
      description: `
📱 Cliente: ${clientName}
📞 Telefone: ${clientPhone}
✂️ Barbeiro: ${barberName}
${clientEmail ? `📧 Email: ${clientEmail}` : ''}
${notes ? `📝 Obs: ${notes}` : ''}

Agendado via WhatsApp Flow
      `.trim(),
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    // Se tiver email do cliente, adicionar como convidado
    if (clientEmail) {
      event.attendees = [{ email: clientEmail }];
      event.sendUpdates = 'all'; // Enviar convite por email
    }

    console.log('📤 Enviando requisição para Google Calendar API...');
    console.log('📋 Calendar ID:', calendarId);
    console.log('📋 Evento a ser criado:', JSON.stringify(event, null, 2));
    
    const response = await calendar.events.insert({
      calendarId,
      resource: event
    });

    console.log('='.repeat(60));
    console.log('✅ EVENTO CRIADO NO GOOGLE CALENDAR');
    console.log('='.repeat(60));
    console.log('📅 Evento ID:', response.data.id);
    console.log('📊 Status:', response.data.status);
    console.log('🔗 Link:', response.data.htmlLink);
    console.log('📋 Resposta completa:', JSON.stringify(response.data, null, 2));
    console.log('='.repeat(60));

    return {
      id: response.data.id,
      status: response.data.status || 'confirmed',
      htmlLink: response.data.htmlLink
    };

  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ ERRO AO CRIAR EVENTO NO GOOGLE CALENDAR');
    console.error('='.repeat(60));
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    
    if (error.response) {
      console.error('❌ Status code:', error.response.status);
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('❌ Response headers:', JSON.stringify(error.response.headers, null, 2));
    }
    
    if (error.errors) {
      console.error('❌ Errors array:', JSON.stringify(error.errors, null, 2));
    }
    
    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Verifica se um horário específico está disponível
 */
async function isSlotAvailable(barberId, date, time, serviceId) {
  const availableSlots = await getAvailableSlots(barberId, date, serviceId);
  return availableSlots.some(slot => slot.id === time);
}

/**
 * Cancela um agendamento
 */
async function cancelAppointment(eventId, barberId) {
  await initializeCalendar();
  
  if (!calendar) {
    console.log('⚠️ Google Calendar não configurado');
    return { success: true };
  }

  try {
    const calendarId = BARBER_CALENDARS[barberId] || 'primary';
    
    await calendar.events.delete({
      calendarId,
      eventId
    });

    console.log('✅ Evento cancelado:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erro ao cancelar evento:', error.message);
    throw error;
  }
}

module.exports = {
  getBarbers,
  getAvailableSlots,
  createAppointment,
  isSlotAvailable,
  cancelAppointment
};

