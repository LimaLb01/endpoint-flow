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
// Configure com os IDs dos calendários reais
const BARBER_CALENDARS = {
  'joao': process.env.CALENDAR_JOAO || 'primary',
  'pedro': process.env.CALENDAR_PEDRO || 'primary',
  'carlos': process.env.CALENDAR_CARLOS || 'primary'
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
    return getMockAvailableSlots(date, serviceDuration);
  }

  try {
    const calendarId = BARBER_CALENDARS[barberId] || 'primary';
    
    // Definir início e fim do dia
    const startOfDay = new Date(`${date}T${String(WORKING_HOURS.start).padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${date}T${String(WORKING_HOURS.end).padStart(2, '0')}:00:00`);

    // Buscar eventos existentes no calendário
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const busySlots = response.data.items.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date)
    }));

    console.log(`📋 Encontrados ${busySlots.length} eventos ocupados`);

    // Gerar todos os slots possíveis
    const allSlots = generateTimeSlots(startOfDay, endOfDay, WORKING_HOURS.interval);
    
    // Filtrar slots disponíveis
    const availableSlots = allSlots.filter(slot => {
      const slotEnd = new Date(slot.getTime() + serviceDuration * 60000);
      
      // Verificar se o slot não conflita com nenhum evento existente
      return !busySlots.some(busy => {
        return slot < busy.end && slotEnd > busy.start;
      });
    });

    // Formatar para o formato do WhatsApp Flow
    return availableSlots.map(slot => {
      const time = slot.toTimeString().slice(0, 5);
      return {
        id: time,
        title: time,
        description: `Disponível - ${serviceDuration} min`
      };
    });

  } catch (error) {
    console.error('❌ Erro ao buscar horários:', error.message);
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
    
    // Criar data/hora de início
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // Mapear nome do serviço
    const serviceNames = {
      'corte_masculino': 'Corte Masculino',
      'barba': 'Barba',
      'corte_barba': 'Corte + Barba',
      'corte_infantil': 'Corte Infantil',
      'pigmentacao': 'Pigmentação'
    };

    const serviceName = serviceNames[service] || service;

    // Criar evento
    const event = {
      summary: `${serviceName} - ${clientName}`,
      description: `
📱 Cliente: ${clientName}
📞 Telefone: ${clientPhone}
${clientEmail ? `📧 Email: ${clientEmail}` : ''}
${notes ? `📝 Obs: ${notes}` : ''}

Agendado via WhatsApp Flow
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endDateTime.toISOString(),
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

    const response = await calendar.events.insert({
      calendarId,
      resource: event
    });

    console.log('✅ Evento criado:', response.data.id);

    return {
      id: response.data.id,
      status: 'confirmed',
      htmlLink: response.data.htmlLink
    };

  } catch (error) {
    console.error('❌ Erro ao criar evento:', error.message);
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

