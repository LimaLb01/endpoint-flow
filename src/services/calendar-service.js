/**
 * Serviço de integração com Google Calendar
 * Gerencia horários disponíveis e criação de agendamentos
 */

const { google } = require('googleapis');
const { generateCacheKey, get, set, clearByPrefix } = require('../utils/cache');
const { globalLogger } = require('../utils/logger');
const { withGoogleCalendarTimeout } = require('../utils/timeout');
const { recordCache } = require('../utils/metrics');

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
// Para barbeiros específicos, definir CALENDAR_[BARBER_ID] (ex: CALENDAR_EMANOEL_PIRES)
const { BRANCHES } = require('../config/branches');

// Gerar mapeamento dinâmico de todos os barbeiros
const BARBER_CALENDARS = {};
BRANCHES.forEach(branch => {
  branch.barbers.forEach(barber => {
    // Ignorar "Sem preferência"
    if (!barber.id.startsWith('sem_preferencia')) {
      const envKey = `CALENDAR_${barber.id.toUpperCase().replace(/-/g, '_')}`;
      BARBER_CALENDARS[barber.id] = process.env.CALENDAR_LUCAS || process.env[envKey] || 'primary';
    }
  });
});

// Mapeamento de nomes dos barbeiros
const BARBER_NAMES = {};
BRANCHES.forEach(branch => {
  branch.barbers.forEach(barber => {
    BARBER_NAMES[barber.id] = barber.name;
  });
});

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
 * @deprecated Use getBarbersByBranch de branches.js para obter barbeiros por filial
 * Mantido para compatibilidade
 */
async function getBarbers() {
  const { getAllBarbers } = require('../config/branches');
  return getAllBarbers();
}

/**
 * Busca horários disponíveis para um barbeiro em uma data específica
 * Usa cache para reduzir chamadas à API do Google Calendar
 * @param {string} barberId - ID do barbeiro
 * @param {string} date - Data no formato YYYY-MM-DD
 * @param {string} serviceId - ID do serviço (para calcular duração)
 * @param {string} requestId - Request ID para logs (opcional)
 * @returns {Array} Lista de horários disponíveis
 */
async function getAvailableSlots(barberId, date, serviceId, requestId = null) {
  const logger = requestId ? require('../utils/logger').createRequestLogger(requestId) : globalLogger;
  
  logger.debug('Buscando horários disponíveis', {
    barberId,
    date,
    serviceId
  });
  
  await initializeCalendar();
  
  const serviceDuration = SERVICE_DURATION[serviceId] || 45;
  
  // Se não houver integração real, retornar dados mock
  if (!calendar) {
    logger.warn('Calendar não inicializado, usando mock');
    return getMockAvailableSlots(date, serviceDuration);
  }

  // Verificar cache primeiro
  const cacheKey = generateCacheKey('availableSlots', {
    barberId,
    date,
    serviceId,
    serviceDuration
  });
  
  const cached = get(cacheKey);
  if (cached) {
    logger.debug('Horários encontrados no cache', {
      barberId,
      date,
      serviceId,
      slotsCount: cached.length
    });
    recordCache(true); // Cache hit
    return cached;
  }
  
  recordCache(false); // Cache miss

  try {
    const calendarId = BARBER_CALENDARS[barberId] || 'primary';
    logger.debug('Usando calendário', { calendarId });
    
    // Usar formato ISO com timezone de São Paulo para buscar eventos
    // O Google Calendar API aceita RFC3339 com offset
    const startOfDayStr = `${date}T${String(WORKING_HOURS.start).padStart(2, '0')}:00:00-03:00`;
    const endOfDayStr = `${date}T${String(WORKING_HOURS.end).padStart(2, '0')}:00:00-03:00`;

    logger.debug('Buscando eventos do Google Calendar', {
      timeMin: startOfDayStr,
      timeMax: endOfDayStr
    });

    // Buscar eventos existentes no calendário (com timeout)
    const response = await withGoogleCalendarTimeout(
      () => calendar.events.list({
        calendarId,
        timeMin: startOfDayStr,
        timeMax: endOfDayStr,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Sao_Paulo'
      }),
      'Google Calendar - List Events',
      requestId
    );

    logger.debug('Eventos encontrados no Google Calendar', {
      count: response.data.items.length
    });
    
    // Extrair horários ocupados (em formato local de São Paulo)
    const busySlots = response.data.items.map(event => {
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      
      // Extrair apenas a hora (HH:MM) do horário
      const startHour = startTime.substring(11, 16); // "2025-12-11T14:30:00-03:00" -> "14:30"
      const endHour = endTime.substring(11, 16);
      
      logger.debug('Evento ocupado encontrado', {
        startHour,
        endHour,
        summary: event.summary
      });
      
      return {
        startHour,
        endHour,
        startMinutes: parseInt(startHour.split(':')[0]) * 60 + parseInt(startHour.split(':')[1]),
        endMinutes: parseInt(endHour.split(':')[0]) * 60 + parseInt(endHour.split(':')[1])
      };
    });

    logger.debug('Total de eventos ocupados', { count: busySlots.length });

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
    
    // Verificar se a data selecionada é hoje
    const today = new Date();
    const selectedDate = new Date(date + 'T00:00:00-03:00'); // Usar timezone de São Paulo
    const isToday = today.toDateString() === selectedDate.toDateString();
    
    // Se for hoje, calcular o horário atual com buffer de 30 minutos
    let currentTimeMinutes = null;
    if (isToday) {
      // Obter hora atual no timezone de São Paulo
      const now = new Date();
      const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const currentHour = saoPauloTime.getHours();
      const currentMinute = saoPauloTime.getMinutes();
      // Adicionar buffer de 30 minutos
      currentTimeMinutes = currentHour * 60 + currentMinute + 30;
      
      logger.debug('Filtrando horários passados para o dia atual', {
        currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
        bufferMinutes: 30,
        filterAfter: `${String(Math.floor(currentTimeMinutes / 60)).padStart(2, '0')}:${String(currentTimeMinutes % 60).padStart(2, '0')}`
      });
    }
    
    // Filtrar slots disponíveis
    const availableSlots = allSlots.filter(slot => {
      const slotStart = slot.minutes;
      const slotEnd = slot.minutes + serviceDuration;
      
      // Se for hoje, filtrar horários que já passaram (com buffer)
      if (isToday && currentTimeMinutes !== null) {
        if (slotStart < currentTimeMinutes) {
          logger.debug('Slot filtrado por estar no passado', { 
            time: slot.time, 
            currentTimeMinutes,
            slotStart 
          });
          return false;
        }
      }
      
      // Verificar se o slot não conflita com nenhum evento existente
      const hasConflict = busySlots.some(busy => {
        // Conflito: slot começa antes do evento terminar E slot termina depois do evento começar
        return slotStart < busy.endMinutes && slotEnd > busy.startMinutes;
      });
      
      if (hasConflict) {
        logger.debug('Slot bloqueado por conflito', { time: slot.time });
      }
      
      return !hasConflict;
    });

    logger.info('Horários disponíveis calculados', {
      barberId,
      date,
      serviceId,
      availableCount: availableSlots.length,
      busyCount: busySlots.length
    });

    // Formatar para o formato do WhatsApp Flow
    const formattedSlots = availableSlots.map(slot => ({
      id: slot.time,
      title: slot.time,
      description: `Disponível - ${serviceDuration} min`
    }));

    // Armazenar no cache (TTL de 5 minutos)
    // Cache mais curto para garantir que novos agendamentos apareçam rapidamente
    set(cacheKey, formattedSlots, 5 * 60 * 1000);
    
    logger.debug('Horários armazenados no cache', {
      cacheKey,
      ttl: '5 minutos'
    });

    return formattedSlots;

  } catch (error) {
    logger.error('Erro ao buscar horários do Google Calendar', {
      error: error.message,
      stack: error.stack,
      barberId,
      date,
      serviceId
    });
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
  
  // Verificar se a data selecionada é hoje
  const today = new Date();
  const selectedDate = new Date(date + 'T00:00:00-03:00');
  const isToday = today.toDateString() === selectedDate.toDateString();
  
  // Se for hoje, filtrar horários passados
  let filteredTimes = allTimes;
  if (isToday) {
    // Obter hora atual no timezone de São Paulo
    const now = new Date();
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentHour = saoPauloTime.getHours();
    const currentMinute = saoPauloTime.getMinutes();
    // Adicionar buffer de 30 minutos
    const currentTimeMinutes = currentHour * 60 + currentMinute + 30;
    
    filteredTimes = allTimes.filter(time => {
      const [hour, minute] = time.split(':').map(Number);
      const timeMinutes = hour * 60 + minute;
      return timeMinutes >= currentTimeMinutes;
    });
  }
  
  // Remover alguns horários aleatoriamente para simular ocupação
  const availableTimes = filteredTimes.filter(() => Math.random() > 0.3);
  
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
async function createAppointment(appointment, requestId = null) {
  const { CalendarError } = require('../utils/errors');
  const { withRetry } = require('../utils/retry');
  const logger = requestId ? require('../utils/logger').createRequestLogger(requestId) : globalLogger;
  
  logger.debug('Criando agendamento', {
    service: appointment.service,
    barber: appointment.barber,
    date: appointment.date,
    time: appointment.time
  });
  
  await initializeCalendar();
  
  const { service, barber, date, time, clientName, clientPhone, clientEmail, notes } = appointment;
  const duration = SERVICE_DURATION[service] || 45;

  // Se não houver integração real, retornar mock
  if (!calendar) {
    logger.warn('Usando mock - agendamento não foi salvo no Google Calendar');
    // Invalidar cache mesmo em modo mock para consistência
    clearByPrefix(`availableSlots:barberId:${barber}|date:${date}`);
    return {
      id: `mock_${Date.now()}`,
      status: 'confirmed',
      htmlLink: '#'
    };
  }

  try {
    // Usar retry para operações do Google Calendar
    return await withRetry(async () => {
    const calendarId = BARBER_CALENDARS[barber] || 'primary';
    
    // Mapear nome do serviço
    const serviceNames = {
      'corte_masculino': 'Corte Masculino',
      'barba': 'Barba',
      'corte_barba': 'Corte + Barba',
      'corte_infantil': 'Corte Infantil',
      'pigmentacao': 'Pigmentação'
    };

    // Mapear nome do barbeiro (usando BARBER_NAMES gerado dinamicamente)
    const serviceName = serviceNames[service] || service;
    const barberName = BARBER_NAMES[barber] || barber;

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

    // NOTA: Service Accounts não podem adicionar convidados sem Domain-Wide Delegation
    // Se precisar enviar convites, use OAuth2 em vez de Service Account
    // Por enquanto, o email do cliente será apenas incluído na descrição do evento
    // if (clientEmail) {
    //   event.attendees = [{ email: clientEmail }];
    //   event.sendUpdates = 'all';
    // }

      logger.debug('Enviando requisição para Google Calendar API', {
        calendarId,
        eventSummary: event.summary
      });
      
      // Criar evento com timeout
      const response = await withGoogleCalendarTimeout(
        () => calendar.events.insert({
          calendarId,
          resource: event
        }),
        'Google Calendar - Create Event',
        requestId
      );

      logger.info('Evento criado no Google Calendar', {
        eventId: response.data.id,
        status: response.data.status,
        htmlLink: response.data.htmlLink
      });

      // Invalidar cache de horários disponíveis para este barbeiro e data
      // Isso garante que novos agendamentos apareçam imediatamente
      clearByPrefix(`availableSlots:barberId:${barber}|date:${date}`);
      
      logger.debug('Cache invalidado após criação de agendamento', {
        barber,
        date,
        eventId: response.data.id
      });

      return {
        id: response.data.id,
        status: response.data.status || 'confirmed',
        htmlLink: response.data.htmlLink
      };
    }, {
      maxRetries: 3,
      initialDelay: 1000
    }, 'createAppointment');
    
  } catch (error) {
    // Verificar se é erro retryable
    const isRetryable = error.response?.status === 429 || 
                       error.response?.status === 503 || 
                       error.code === 'ECONNRESET' || 
                       error.code === 'ETIMEDOUT';
    
    throw new CalendarError(
      `Erro ao criar agendamento no Google Calendar: ${error.message}`,
      error,
      isRetryable
    );
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

/**
 * Lista agendamentos do Google Calendar
 * @param {object} options - Opções de filtro
 * @param {string} options.startDate - Data de início (ISO string)
 * @param {string} options.endDate - Data de fim (ISO string)
 * @param {string} options.barberId - ID do barbeiro (opcional)
 * @param {number} options.maxResults - Número máximo de resultados
 * @returns {Array} Lista de agendamentos
 */
async function listAppointments(options = {}) {
  const logger = options.requestId ? require('../utils/logger').createRequestLogger(options.requestId) : globalLogger;
  
  await initializeCalendar();
  
  if (!calendar) {
    logger.warn('Google Calendar não configurado');
    return [];
  }

  try {
    const {
      startDate = new Date().toISOString(),
      endDate,
      barberId,
      maxResults = 250
    } = options;

    // Se não especificou endDate, buscar próximos 30 dias
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Se especificou barbeiro, usar calendário específico, senão buscar em todos
    let calendarsToSearch = barberId 
      ? [{ id: barberId, calendarId: BARBER_CALENDARS[barberId] || 'primary' }]
      : Object.entries(BARBER_CALENDARS).map(([id, calId]) => ({ id, calendarId: calId }));

    // Se não há calendários configurados, usar primary
    if (calendarsToSearch.length === 0) {
      calendarsToSearch.push({ id: 'default', calendarId: 'primary' });
    }

    // Remover calendários duplicados (mesmo calendarId)
    const uniqueCalendars = [];
    const seenCalendarIds = new Set();
    
    for (const cal of calendarsToSearch) {
      if (!seenCalendarIds.has(cal.calendarId)) {
        seenCalendarIds.add(cal.calendarId);
        uniqueCalendars.push(cal);
      }
    }
    
    calendarsToSearch = uniqueCalendars;

    const allAppointments = [];

    // Buscar em cada calendário
    for (const { id: barber, calendarId } of calendarsToSearch) {
      try {
        const response = await withGoogleCalendarTimeout(
          () => calendar.events.list({
            calendarId,
            timeMin: startDate,
            timeMax: end,
            maxResults: maxResults,
            singleEvents: true,
            orderBy: 'startTime'
          }),
          'Google Calendar - List Events',
          options.requestId
        );

        if (response.data.items) {
          response.data.items.forEach(event => {
            // Extrair informações do evento
            const summary = event.summary || 'Sem título';
            const description = event.description || '';
            
            // Tentar extrair informações do cliente da descrição
            const clientMatch = description.match(/📱 Cliente: (.+)/);
            const phoneMatch = description.match(/📞 Telefone: (.+)/);
            const barberMatch = description.match(/✂️ Barbeiro: (.+)/);
            const emailMatch = description.match(/📧 Email: (.+)/);
            const notesMatch = description.match(/📝 Obs: (.+)/);

            // Tentar identificar o serviço do título
            const serviceMatch = summary.match(/^(.+?)\s*-\s*(.+?)\s*\(/);

            allAppointments.push({
              id: event.id,
              title: summary,
              service: serviceMatch ? serviceMatch[1] : 'Serviço não identificado',
              clientName: clientMatch ? clientMatch[1] : (serviceMatch ? serviceMatch[2] : 'Cliente não identificado'),
              clientPhone: phoneMatch ? phoneMatch[1] : null,
              clientEmail: emailMatch ? emailMatch[1] : null,
              barber: barberMatch ? barberMatch[1] : BARBER_NAMES[barber] || 'Barbeiro não identificado',
              barberId: barber,
              start: event.start?.dateTime || event.start?.date,
              end: event.end?.dateTime || event.end?.date,
              status: event.status || 'confirmed',
              htmlLink: event.htmlLink,
              location: event.location,
              notes: notesMatch ? notesMatch[1] : null,
              created: event.created,
              updated: event.updated
            });
          });
        }
      } catch (error) {
        logger.warn(`Erro ao buscar eventos do calendário ${calendarId}`, {
          error: error.message,
          barber
        });
        // Continuar com outros calendários mesmo se um falhar
      }
    }

    // Remover duplicatas (mesmo event.id)
    const uniqueAppointments = [];
    const seenIds = new Set();
    
    for (const appointment of allAppointments) {
      // Usar ID do evento como chave única
      const uniqueKey = `${appointment.id}-${appointment.start}`;
      
      if (!seenIds.has(uniqueKey)) {
        seenIds.add(uniqueKey);
        uniqueAppointments.push(appointment);
      } else {
        logger.debug('Agendamento duplicado removido', {
          id: appointment.id,
          start: appointment.start,
          title: appointment.title
        });
      }
    }

    // Ordenar por data de início
    uniqueAppointments.sort((a, b) => {
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      return dateA - dateB;
    });

    logger.info('Agendamentos listados', {
      total: uniqueAppointments.length,
      duplicadosRemovidos: allAppointments.length - uniqueAppointments.length,
      startDate,
      endDate: end
    });

    return uniqueAppointments;

  } catch (error) {
    logger.error('Erro ao listar agendamentos', {
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  getBarbers,
  getAvailableSlots,
  createAppointment,
  isSlotAvailable,
  cancelAppointment,
  listAppointments
};

