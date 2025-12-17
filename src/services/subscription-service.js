/**
 * Serviço de Gerenciamento de Assinaturas
 * Gerencia assinaturas e verificação de planos ativos
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');
const { getCustomerByCpf } = require('./customer-service');

/**
 * Verifica se um CPF tem plano ativo
 * @param {string} cpf - CPF do cliente (apenas números)
 * @returns {Promise<object>} Objeto com informações do plano
 */
async function getActiveSubscriptionByCpf(cpf) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return {
      has_plan: false,
      is_club_member: false,
      subscription: null
    };
  }

  try {
    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Busca cliente
    const customer = await getCustomerByCpf(cleanCpf);
    if (!customer) {
      return {
        has_plan: false,
        is_club_member: false,
        subscription: null
      };
    }

    // Busca assinatura ativa
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .or('current_period_end.is.null,current_period_end.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma assinatura ativa encontrada
        return {
          has_plan: false,
          is_club_member: false,
          subscription: null
        };
      }
      throw error;
    }

    return {
      has_plan: true,
      is_club_member: true,
      subscription: data,
      plan: data.plan,
      expires_at: data.current_period_end
    };
  } catch (error) {
    globalLogger.error('Erro ao verificar assinatura ativa', {
      cpf: cpf.replace(/\d(?=\d{4})/g, '*'),
      error: error.message
    });
    return {
      has_plan: false,
      is_club_member: false,
      subscription: null
    };
  }
}

/**
 * Cria uma nova assinatura
 * @param {string} customerId - ID do cliente (UUID)
 * @param {string} planId - ID do plano (UUID)
 * @param {object} [stripeData] - Dados do Stripe (opcional)
 * @returns {Promise<object|null>} Assinatura criada ou null
 */
async function createSubscription(customerId, planId, stripeData = {}) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    // Buscar dados do plano para calcular período
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      throw planError;
    }

    // Calcular current_period_end se não fornecido e se não for plano único
    let currentPeriodStart = stripeData.current_period_start || new Date();
    let currentPeriodEnd = stripeData.current_period_end;

    if (!currentPeriodEnd && plan) {
      const startDate = new Date(currentPeriodStart);
      
      if (plan.type === 'monthly') {
        // Adiciona 30 dias
        currentPeriodEnd = new Date(startDate);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else if (plan.type === 'yearly') {
        // Adiciona 1 ano
        currentPeriodEnd = new Date(startDate);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else if (plan.type === 'one_time') {
        // Plano único: sem data de expiração (null)
        currentPeriodEnd = null;
      }
    }

    const subscriptionData = {
      customer_id: customerId,
      plan_id: planId,
      status: 'active',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      ...stripeData
    };

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        plan:plans(*),
        customer:customers(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    globalLogger.info('Assinatura criada com sucesso', {
      subscriptionId: data.id,
      customerId,
      planId,
      currentPeriodEnd: currentPeriodEnd?.toISOString()
    });

    return data;
  } catch (error) {
    globalLogger.error('Erro ao criar assinatura', {
      customerId,
      planId,
      error: error.message
    });
    return null;
  }
}

/**
 * Atualiza status de uma assinatura
 * @param {string} subscriptionId - ID da assinatura (UUID)
 * @param {object} updates - Dados para atualizar
 * @returns {Promise<object|null>} Assinatura atualizada ou null
 */
async function updateSubscription(subscriptionId, updates) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    globalLogger.error('Erro ao atualizar assinatura', {
      subscriptionId,
      error: error.message
    });
    return null;
  }
}

/**
 * Cancela uma assinatura
 * @param {string} subscriptionId - ID da assinatura (UUID)
 * @param {boolean} [cancelAtPeriodEnd] - Se true, cancela ao final do período
 * @returns {Promise<object|null>} Assinatura atualizada ou null
 */
async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = false) {
  if (cancelAtPeriodEnd) {
    return await updateSubscription(subscriptionId, {
      cancel_at_period_end: true
    });
  }

  return await updateSubscription(subscriptionId, {
    status: 'canceled',
    cancel_at_period_end: false
  });
}

/**
 * Busca assinatura por ID do Stripe
 * @param {string} stripeSubscriptionId - ID da assinatura no Stripe
 * @returns {Promise<object|null>} Assinatura encontrada ou null
 */
async function getSubscriptionByStripeId(stripeSubscriptionId) {
  if (!isAdminConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*),
        customer:customers(*)
      `)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    globalLogger.error('Erro ao buscar assinatura por Stripe ID', {
      stripeSubscriptionId,
      error: error.message
    });
    return null;
  }
}

module.exports = {
  getActiveSubscriptionByCpf,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionByStripeId
};

