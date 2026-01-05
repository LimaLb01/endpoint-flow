/**
 * Serviço de Rastreamento de Interações do Flow
 * Registra todas as interações do usuário no WhatsApp Flow
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');

/**
 * Mapeia telas do flow para nomes amigáveis
 */
const SCREEN_NAMES = {
  'WELCOME': 'Iniciou cadastro',
  'CPF_INPUT': 'Informou CPF',
  'CLUB_OPTION': 'Opção de clube',
  'BRANCH_SELECTION': 'Selecionou filial',
  'BARBER_SELECTION': 'Selecionou barbeiro',
  'SERVICE_SELECTION': 'Selecionou serviço',
  'DATE_SELECTION': 'Selecionou data',
  'TIME_SELECTION': 'Selecionou horário',
  'DETAILS': 'Dados pessoais',
  'CONFIRMATION': 'Concluiu pagamento'
};

/**
 * Determina o status baseado na tela e ação
 */
function determineStatus(screen, actionType) {
  if (screen === 'CONFIRMATION' && actionType === 'CONFIRM_BOOKING') {
    return 'completed';
  }
  if (screen === 'CPF_INPUT' || screen === 'WELCOME') {
    return 'in_progress';
  }
  // Se não houve interação há mais de 30 minutos, considerar abandonado
  return 'in_progress';
}

/**
 * Registra uma interação do flow
 */
async function trackFlowInteraction(data) {
  if (!isAdminConfigured()) {
    globalLogger.warn('Supabase Admin não configurado, pulando tracking');
    return null;
  }

  try {
    const {
      flow_token,
      client_cpf,
      client_phone,
      action_type,
      screen,
      previous_screen,
      payload = {},
      metadata = {}
    } = data;

    const cleanCpf = client_cpf ? client_cpf.replace(/\D/g, '') : null;
    const status = determineStatus(screen, action_type);
    const lastStep = SCREEN_NAMES[screen] || screen;

    // Sempre criar um novo registro para cada etapa (para timeline completa)
    // Mas também atualizar o status da última interação do mesmo flow_token
    const interactionData = {
      flow_token: flow_token || null,
      client_cpf: cleanCpf,
      client_phone: client_phone ? client_phone.replace(/\D/g, '') : null,
      action_type: action_type || 'UNKNOWN',
      screen: screen || 'UNKNOWN',
      previous_screen: previous_screen || null,
      status: status,
      last_step: lastStep,
      payload: payload,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata // Incluir metadata adicional (localização, IP, etc.)
      }
    };

    // Criar novo registro para esta etapa
    const { data: newInteraction, error: insertError } = await supabaseAdmin
      .from('flow_interactions')
      .insert(interactionData)
      .select()
      .single();

    if (insertError) throw insertError;

    // Atualizar status de todas as interações anteriores do mesmo flow_token para 'in_progress'
    // (exceto a atual que acabamos de criar)
    if (flow_token && newInteraction) {
      await supabaseAdmin
        .from('flow_interactions')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('flow_token', flow_token)
        .neq('id', newInteraction.id)
        .neq('status', 'completed'); // Não atualizar se já estiver completed
    }

    // Se a ação for CONFIRM_BOOKING, marcar todas as interações deste flow_token como completed
    if (action_type === 'CONFIRM_BOOKING' && flow_token) {
      await supabaseAdmin
        .from('flow_interactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('flow_token', flow_token);
    }

    return newInteraction.id;
  } catch (error) {
    globalLogger.error('Erro ao rastrear interação do flow', {
      error: error.message,
      screen: data?.screen,
      action_type: data?.action_type
    });
    return null;
  }
}

/**
 * Busca interações do flow com filtros
 * Retorna apenas a interação mais recente de cada flow_token
 */
async function getFlowInteractions(filters = {}) {
  if (!isAdminConfigured()) {
    return { interactions: [], total: 0 };
  }

  try {
    // Primeiro, buscar todas as interações com filtros aplicados
    let query = supabaseAdmin
      .from('flow_interactions')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.client_cpf) {
      const cleanCpf = filters.client_cpf.replace(/\D/g, '');
      query = query.eq('client_cpf', cleanCpf);
    }
    if (filters.screen) {
      query = query.eq('screen', filters.screen);
    }
    if (filters.search) {
      query = query.or(`client_cpf.ilike.%${filters.search}%,client_phone.ilike.%${filters.search}%`);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Ordenar por data mais recente
    query = query.order('created_at', { ascending: false });

    // Buscar todas as interações (sem paginação inicial para agrupar)
    const { data: allInteractions, error, count } = await query;

    if (error) throw error;

    // Agrupar por cliente (CPF) - mostrar apenas UMA entrada por cliente
    // Priorizar a interação mais completa (com localização, dados completos, etc.)
    const groupedByClient = {};
    (allInteractions || []).forEach(interaction => {
      // Usar APENAS CPF como chave - uma entrada por cliente
      // Se não tiver CPF, usar flow_token como fallback para agrupar flows únicos
      const clientKey = interaction.client_cpf || `flow_${interaction.flow_token || interaction.id}`;
      
      const current = groupedByClient[clientKey];
      
      // Função para calcular "completude" de uma interação
      const getCompleteness = (inter) => {
        if (!inter) return 0;
        let score = 0;
        
        // Priorizar interação INIT (tem localização e timestamp de acesso)
        if (inter.screen === 'WELCOME' && inter.action_type === 'INIT') {
          score += 10; // Bonus alto para INIT
        }
        
        // Verificar se tem localização no metadata
        if (inter.metadata?.location && !inter.metadata.location.isLocal) {
          score += 5;
        }
        
        // Verificar dados do payload
        if (inter.payload) {
          const payload = inter.payload;
          if (payload.selected_branch) score += 1;
          if (payload.selected_date) score += 1;
          if (payload.selected_time) score += 1;
          if (payload.client_name) score += 1;
          if (payload.client_phone) score += 1;
        }
        
        return score;
      };
      
      if (!current) {
        groupedByClient[clientKey] = interaction;
      } else {
        const currentCompleteness = getCompleteness(current);
        const newCompleteness = getCompleteness(interaction);
        
        // Verificar se tem localização
        const newHasLocation = interaction.metadata?.location && !interaction.metadata.location.isLocal;
        const currentHasLocation = current.metadata?.location && !current.metadata.location.isLocal;
        
        // Priorizar interação com localização
        if (newHasLocation && !currentHasLocation) {
          groupedByClient[clientKey] = interaction;
        } else if (!newHasLocation && currentHasLocation) {
          // Manter a atual se ela tem localização e a nova não tem
          // Não fazer nada, manter current
        } else {
          // Ambas têm ou não têm localização - priorizar mais completa ou mais recente
          if (newCompleteness > currentCompleteness) {
            groupedByClient[clientKey] = interaction;
          } else if (newCompleteness === currentCompleteness && 
                     new Date(interaction.created_at) > new Date(current.created_at)) {
            groupedByClient[clientKey] = interaction;
          }
        }
      }
    });

    // Converter para array e ordenar por data mais recente
    let uniqueInteractions = Object.values(groupedByClient);
    uniqueInteractions.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    // Aplicar paginação após agrupar
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedInteractions = uniqueInteractions.slice(offset, offset + limit);

    return {
      interactions: paginatedInteractions,
      total: uniqueInteractions.length
    };
  } catch (error) {
    globalLogger.error('Erro ao buscar interações do flow', {
      error: error.message
    });
    return { interactions: [], total: 0 };
  }
}

/**
 * Busca timeline de interações de um flow_token específico
 */
async function getFlowTimeline(flowToken) {
  if (!isAdminConfigured() || !flowToken) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('flow_interactions')
      .select('*')
      .eq('flow_token', flowToken)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    globalLogger.error('Erro ao buscar timeline do flow', {
      error: error.message,
      flow_token: flowToken
    });
    return [];
  }
}

/**
 * Busca estatísticas de abandono por etapa
 */
async function getAbandonmentStats() {
  if (!isAdminConfigured()) {
    return {};
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('flow_interactions')
      .select('screen, status');

    if (error) throw error;

    const stats = {};
    data.forEach(interaction => {
      if (!stats[interaction.screen]) {
        stats[interaction.screen] = {
          total: 0,
          abandoned: 0,
          completed: 0,
          in_progress: 0
        };
      }
      stats[interaction.screen].total++;
      stats[interaction.screen][interaction.status]++;
    });

    return stats;
  } catch (error) {
    globalLogger.error('Erro ao buscar estatísticas de abandono', {
      error: error.message
    });
    return {};
  }
}

/**
 * Busca estatísticas completas de analytics do Flow
 * Inclui: funil, abandono, tempo médio, interações ao longo do tempo, heatmap, localização
 */
async function getFlowAnalytics(filters = {}) {
  if (!isAdminConfigured()) {
    return {
      funnel: [],
      abandonment: {},
      averageTime: {},
      interactionsOverTime: [],
      heatmap: {},
      location: {}
    };
  }

  try {
    // Definir período padrão (últimos 30 dias)
    const endDate = filters.endDate || new Date().toISOString();
    const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Buscar todas as interações no período
    let query = supabaseAdmin
      .from('flow_interactions')
      .select('id, flow_token, screen, status, created_at, metadata, previous_screen')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    const { data: interactions, error } = await query;
    if (error) throw error;

    // Ordem das etapas do funil
    const funnelOrder = [
      'WELCOME',
      'CPF_INPUT',
      'CLUB_OPTION',
      'BRANCH_SELECTION',
      'BARBER_SELECTION',
      'SERVICE_SELECTION',
      'DATE_SELECTION',
      'TIME_SELECTION',
      'DETAILS',
      'CONFIRMATION'
    ];

    // 1. FUNIL DE CONVERSÃO
    const funnel = [];
    const uniqueTokensByScreen = {};
    const screenStats = {};

    // Agrupar por flow_token e encontrar a última tela alcançada
    const tokensByLastScreen = {};
    interactions.forEach(interaction => {
      if (!interaction.flow_token) return;
      
      const token = interaction.flow_token;
      const screen = interaction.screen;
      
      if (!tokensByLastScreen[token] || 
          funnelOrder.indexOf(screen) > funnelOrder.indexOf(tokensByLastScreen[token])) {
        tokensByLastScreen[token] = screen;
      }

      if (!screenStats[screen]) {
        screenStats[screen] = {
          total: 0,
          uniqueTokens: new Set(),
          abandoned: 0,
          completed: 0,
          in_progress: 0,
          timestamps: []
        };
      }
      
      screenStats[screen].total++;
      screenStats[screen].uniqueTokens.add(token);
      screenStats[screen][interaction.status]++;
      if (interaction.created_at) {
        screenStats[screen].timestamps.push(new Date(interaction.created_at).getTime());
      }
    });

    // Construir funil
    let previousCount = 0;
    funnelOrder.forEach(screen => {
      const stats = screenStats[screen] || { uniqueTokens: new Set(), total: 0 };
      const count = stats.uniqueTokens ? stats.uniqueTokens.size : 0;
      const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount * 100) : 0;
      
      funnel.push({
        screen,
        name: SCREEN_NAMES[screen] || screen,
        count,
        dropoff: previousCount > 0 ? dropoff.toFixed(1) : 0,
        conversion: previousCount > 0 ? (count / previousCount * 100).toFixed(1) : 100
      });
      
      previousCount = count;
    });

    // 2. TAXA DE ABANDONO POR ETAPA
    const abandonment = {};
    Object.keys(screenStats).forEach(screen => {
      const stats = screenStats[screen];
      const total = stats.uniqueTokens ? stats.uniqueTokens.size : 0;
      if (total > 0) {
        abandonment[screen] = {
          total,
          abandoned: stats.abandoned || 0,
          completed: stats.completed || 0,
          in_progress: stats.in_progress || 0,
          abandonmentRate: ((stats.abandoned || 0) / total * 100).toFixed(1),
          completionRate: ((stats.completed || 0) / total * 100).toFixed(1)
        };
      }
    });

    // 3. TEMPO MÉDIO POR ETAPA
    const averageTime = {};
    const tokensByScreen = {};
    
    // Agrupar interações por flow_token e screen
    interactions.forEach(interaction => {
      if (!interaction.flow_token || !interaction.screen) return;
      
      const token = interaction.flow_token;
      const screen = interaction.screen;
      
      if (!tokensByScreen[token]) {
        tokensByScreen[token] = {};
      }
      
      if (!tokensByScreen[token][screen]) {
        tokensByScreen[token][screen] = [];
      }
      
      tokensByScreen[token][screen].push(new Date(interaction.created_at).getTime());
    });

    // Calcular tempo médio entre etapas
    Object.keys(screenStats).forEach(screen => {
      const screenIndex = funnelOrder.indexOf(screen);
      if (screenIndex <= 0) return;
      
      const previousScreen = funnelOrder[screenIndex - 1];
      const timeDiffs = [];
      
      Object.keys(tokensByScreen).forEach(token => {
        const screenTimes = tokensByScreen[token][screen];
        const previousTimes = tokensByScreen[token][previousScreen];
        
        if (screenTimes && previousTimes && screenTimes.length > 0 && previousTimes.length > 0) {
          const screenTime = Math.min(...screenTimes);
          const previousTime = Math.max(...previousTimes);
          timeDiffs.push((screenTime - previousTime) / 1000 / 60); // em minutos
        }
      });
      
      if (timeDiffs.length > 0) {
        const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        averageTime[screen] = {
          average: avgTime.toFixed(1),
          min: Math.min(...timeDiffs).toFixed(1),
          max: Math.max(...timeDiffs).toFixed(1),
          count: timeDiffs.length
        };
      }
    });

    // 4. INTERAÇÕES AO LONGO DO TEMPO (últimos 30 dias, agrupado por dia)
    const interactionsOverTime = [];
    const interactionsByDate = {};
    
    interactions.forEach(interaction => {
      if (!interaction.created_at) return;
      const date = new Date(interaction.created_at).toISOString().split('T')[0];
      if (!interactionsByDate[date]) {
        interactionsByDate[date] = { total: 0, completed: 0, abandoned: 0 };
      }
      interactionsByDate[date].total++;
      if (interaction.status === 'completed') interactionsByDate[date].completed++;
      if (interaction.status === 'abandoned') interactionsByDate[date].abandoned++;
    });

    // Ordenar por data
    Object.keys(interactionsByDate).sort().forEach(date => {
      interactionsOverTime.push({
        date,
        total: interactionsByDate[date].total,
        completed: interactionsByDate[date].completed,
        abandoned: interactionsByDate[date].abandoned
      });
    });

    // 5. HEATMAP DE HORÁRIOS (agrupar por hora do dia)
    const heatmap = {};
    for (let hour = 0; hour < 24; hour++) {
      heatmap[hour] = { total: 0, completed: 0, abandoned: 0 };
    }
    
    interactions.forEach(interaction => {
      if (!interaction.created_at) return;
      const hour = new Date(interaction.created_at).getHours();
      if (heatmap[hour]) {
        heatmap[hour].total++;
        if (interaction.status === 'completed') heatmap[hour].completed++;
        if (interaction.status === 'abandoned') heatmap[hour].abandoned++;
      }
    });

    // 6. ANÁLISE DE LOCALIZAÇÃO
    const location = {};
    const locationStats = {};
    
    interactions.forEach(interaction => {
      const loc = interaction.metadata?.location;
      if (!loc || loc.isLocal) return;
      
      const locationKey = loc.city || loc.region || loc.country || 'Desconhecido';
      if (!locationStats[locationKey]) {
        locationStats[locationKey] = {
          total: 0,
          completed: 0,
          abandoned: 0,
          uniqueTokens: new Set()
        };
      }
      
      locationStats[locationKey].total++;
      if (interaction.flow_token) {
        locationStats[locationKey].uniqueTokens.add(interaction.flow_token);
      }
      if (interaction.status === 'completed') locationStats[locationKey].completed++;
      if (interaction.status === 'abandoned') locationStats[locationKey].abandoned++;
    });

    // Converter para formato de resposta
    Object.keys(locationStats).forEach(key => {
      const stats = locationStats[key];
      location[key] = {
        total: stats.uniqueTokens.size,
        interactions: stats.total,
        completed: stats.completed,
        abandoned: stats.abandoned,
        conversionRate: stats.uniqueTokens.size > 0 
          ? ((stats.completed / stats.uniqueTokens.size) * 100).toFixed(1)
          : '0.0'
      };
    });

    return {
      funnel,
      abandonment,
      averageTime,
      interactionsOverTime,
      heatmap,
      location
    };
  } catch (error) {
    globalLogger.error('Erro ao buscar analytics do flow', {
      error: error.message
    });
    return {
      funnel: [],
      abandonment: {},
      averageTime: {},
      interactionsOverTime: [],
      heatmap: {},
      location: {}
    };
  }
}

/**
 * Exclui uma interação do flow
 * @param {string} interactionId - ID da interação
 * @returns {Promise<boolean>} true se excluído com sucesso
 */
async function deleteFlowInteraction(interactionId) {
  if (!isAdminConfigured()) {
    globalLogger.warn('Supabase Admin não configurado, pulando exclusão');
    return false;
  }

  try {
    const { error } = await supabaseAdmin
      .from('flow_interactions')
      .delete()
      .eq('id', interactionId);

    if (error) throw error;

    globalLogger.info('Interação do flow excluída', {
      interactionId
    });

    return true;
  } catch (error) {
    globalLogger.error('Erro ao excluir interação do flow', {
      error: error.message,
      interactionId
    });
    return false;
  }
}

/**
 * Exclui todas as interações de um flow_token
 * @param {string} flowToken - Token do flow
 * @returns {Promise<boolean>} true se excluído com sucesso
 */
async function deleteFlowInteractionsByToken(flowToken) {
  if (!isAdminConfigured()) {
    globalLogger.warn('Supabase Admin não configurado, pulando exclusão');
    return false;
  }

  try {
    const { error } = await supabaseAdmin
      .from('flow_interactions')
      .delete()
      .eq('flow_token', flowToken);

    if (error) throw error;

    globalLogger.info('Interações do flow excluídas', {
      flowToken
    });

    return true;
  } catch (error) {
    globalLogger.error('Erro ao excluir interações do flow', {
      error: error.message,
      flowToken
    });
    return false;
  }
}

module.exports = {
  trackFlowInteraction,
  getFlowInteractions,
  getFlowTimeline,
  getAbandonmentStats,
  getFlowAnalytics,
  deleteFlowInteraction,
  deleteFlowInteractionsByToken
};

