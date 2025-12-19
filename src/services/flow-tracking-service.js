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
      payload = {}
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
        timestamp: new Date().toISOString()
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
 */
async function getFlowInteractions(filters = {}) {
  if (!isAdminConfigured()) {
    return { interactions: [], total: 0 };
  }

  try {
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

    // Paginação
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      interactions: data || [],
      total: count || 0
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

module.exports = {
  trackFlowInteraction,
  getFlowInteractions,
  getFlowTimeline,
  getAbandonmentStats
};

