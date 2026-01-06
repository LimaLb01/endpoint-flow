/**
 * Serviço de Gerenciamento de Planos
 * Gerencia operações CRUD de planos no Supabase
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');
const { createProductAndPriceFromPlan, isConfigured: isStripeConfigured } = require('./stripe-products-service');
const Stripe = require('stripe');

// Inicializar Stripe para atualizar metadata
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Lista todos os planos (ativos e inativos)
 * @param {object} options - Opções de filtro
 * @param {string} [options.barbershop_id] - Filtrar por barbearia
 * @returns {Promise<Array>} Lista de planos
 */
async function getAllPlans(options = {}) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    let query = supabaseAdmin
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (options.barbershop_id) {
      query = query.eq('barbershop_id', options.barbershop_id);
    }

    if (options.active !== undefined) {
      query = query.eq('active', options.active);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    globalLogger.error('Erro ao listar planos', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Busca um plano por ID
 * @param {string} planId - ID do plano
 * @returns {Promise<object|null>} Plano encontrado ou null
 */
async function getPlanById(planId) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    globalLogger.error('Erro ao buscar plano', {
      error: error.message,
      planId
    });
    throw error;
  }
}

/**
 * Cria um novo plano
 * @param {object} planData - Dados do plano
 * @param {string} planData.barbershop_id - ID da barbearia (obrigatório)
 * @returns {Promise<object>} Plano criado
 */
async function createPlan(planData) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    const { name, type, price, currency = 'BRL', description, active = true, stripe_price_id, barbershop_id } = planData;

    // Validações
    if (!barbershop_id) {
      throw new Error('barbershop_id é obrigatório');
    }

    if (!name || !type || price === undefined) {
      throw new Error('Nome, tipo e preço são obrigatórios');
    }

    if (!['monthly', 'yearly', 'one_time'].includes(type)) {
      throw new Error('Tipo inválido. Deve ser: monthly, yearly ou one_time');
    }

    if (parseFloat(price) < 0) {
      throw new Error('Preço não pode ser negativo');
    }

    // Validar se barbearia tem conta Stripe Connect configurada
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('id, nome, stripe_account_id, stripe_onboarding_completed')
      .eq('id', barbershop_id)
      .single();

    if (barbershopError || !barbershop) {
      throw new Error('Barbearia não encontrada');
    }

    if (!barbershop.stripe_account_id) {
      throw new Error('Antes de criar planos, conecte sua conta de pagamento (Stripe). Acesse a página "Pagamentos" e clique em "Conectar pagamentos".');
    }

    if (!barbershop.stripe_onboarding_completed) {
      throw new Error('Onboarding do Stripe não foi concluído. Complete o processo de conexão na página "Pagamentos".');
    }

    // Criar produto e preço no Stripe automaticamente (se Stripe estiver configurado)
    // Apenas se stripe_price_id não foi fornecido manualmente
    // IMPORTANTE: Products/prices são criados na conta principal, não na conta Connect
    // O repasse será feito via transfer_data.destination no checkout
    let stripeProductId = null;
    let stripePriceId = stripe_price_id || null;

    if (!stripe_price_id && isStripeConfigured()) {
      try {
        // Criar produto/preço na conta principal (não na conta Connect)
        // Passar barbershop_id para metadata
        const stripeResult = await createProductAndPriceFromPlan({
          ...planData,
          barbershop_id: barbershop_id,
          // plan_id será null aqui, será atualizado após criação do plano
        });

        if (stripeResult && stripeResult.priceId) {
          stripeProductId = stripeResult.productId;
          stripePriceId = stripeResult.priceId;

          globalLogger.info('Produto e preço criados automaticamente no Stripe (conta principal)', {
            barbershopId: barbershop_id,
            barbershopName: barbershop.nome,
            stripeAccountId: barbershop.stripe_account_id,
            productId: stripeResult.productId,
            priceId: stripeResult.priceId,
          });
        }
      } catch (stripeError) {
        // Falhar se não conseguir criar no Stripe (regra de negócio)
        globalLogger.error('Erro ao criar produto no Stripe', {
          barbershopId: barbershop_id,
          error: stripeError.message,
        });
        throw new Error(`Erro ao criar produto no Stripe: ${stripeError.message}`);
      }
    }

    // Criar plano no banco
    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert({
        barbershop_id,
        name,
        type,
        price: parseFloat(price),
        currency,
        description: description || null,
        active: active !== undefined ? active : true,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Atualizar metadata do produto/preço com o plan_id criado (se Stripe foi usado)
    if (stripeProductId && stripePriceId && isStripeConfigured()) {
      try {
        // Atualizar metadata do produto
        await stripe.products.update(stripeProductId, {
          metadata: {
            barbershop_id: barbershop_id,
            plan_id: data.id,
          },
        });

        // Atualizar metadata do preço
        await stripe.prices.update(stripePriceId, {
          metadata: {
            barbershop_id: barbershop_id,
            plan_id: data.id,
          },
        });

        globalLogger.info('Metadata atualizada no Stripe com plan_id', {
          planId: data.id,
          productId: stripeProductId,
          priceId: stripePriceId,
        });
      } catch (metadataError) {
        // Não falhar se não conseguir atualizar metadata (não crítico)
        globalLogger.warn('Erro ao atualizar metadata no Stripe', {
          planId: data.id,
          error: metadataError.message,
        });
      }
    }

    globalLogger.info('Plano criado com sucesso', {
      planId: data.id,
      barbershopId: barbershop_id,
      name: data.name,
      stripe_product_id: data.stripe_product_id || 'não configurado',
      stripe_price_id: data.stripe_price_id || 'não configurado',
    });

    return data;
  } catch (error) {
    globalLogger.error('Erro ao criar plano', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Atualiza um plano existente
 * @param {string} planId - ID do plano
 * @param {object} updates - Dados para atualizar
 * @returns {Promise<object>} Plano atualizado
 */
async function updatePlan(planId, updates) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    // Verificar se o plano existe
    const existingPlan = await getPlanById(planId);
    if (!existingPlan) {
      throw new Error('Plano não encontrado');
    }

    // Preparar dados para atualização
    const updateData = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) {
      if (!['monthly', 'yearly', 'one_time'].includes(updates.type)) {
        throw new Error('Tipo inválido. Deve ser: monthly, yearly ou one_time');
      }
      updateData.type = updates.type;
    }
    if (updates.price !== undefined) {
      if (parseFloat(updates.price) < 0) {
        throw new Error('Preço não pode ser negativo');
      }
      updateData.price = parseFloat(updates.price);
    }
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.stripe_product_id !== undefined) updateData.stripe_product_id = updates.stripe_product_id || null;
    if (updates.stripe_price_id !== undefined) updateData.stripe_price_id = updates.stripe_price_id || null;

    if (Object.keys(updateData).length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    const { data, error } = await supabaseAdmin
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    globalLogger.info('Plano atualizado com sucesso', {
      planId,
      updates: Object.keys(updateData)
    });

    return data;
  } catch (error) {
    globalLogger.error('Erro ao atualizar plano', {
      error: error.message,
      planId
    });
    throw error;
  }
}

/**
 * Desativa um plano (soft delete)
 * @param {string} planId - ID do plano
 * @returns {Promise<object>} Plano desativado
 */
async function deactivatePlan(planId) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    return await updatePlan(planId, { active: false });
  } catch (error) {
    globalLogger.error('Erro ao desativar plano', {
      error: error.message,
      planId
    });
    throw error;
  }
}

/**
 * Ativa um plano
 * @param {string} planId - ID do plano
 * @returns {Promise<object>} Plano ativado
 */
async function activatePlan(planId) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    return await updatePlan(planId, { active: true });
  } catch (error) {
    globalLogger.error('Erro ao ativar plano', {
      error: error.message,
      planId
    });
    throw error;
  }
}

/**
 * Obtém estatísticas de um plano
 * @param {string} planId - ID do plano
 * @returns {Promise<object>} Estatísticas do plano
 */
async function getPlanStats(planId) {
  if (!isAdminConfigured()) {
    throw new Error('Supabase Admin não configurado');
  }

  try {
    // Buscar plano
    const plan = await getPlanById(planId);
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    // Assinaturas ativas
    const { count: activeSubscriptions, error: activeError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('status', 'active');

    if (activeError) {
      throw activeError;
    }

    // Total de assinaturas (todas)
    const { count: totalSubscriptions, error: totalError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId);

    if (totalError) {
      throw totalError;
    }

    // Receita total (pagamentos confirmados)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('manual_payments')
      .select('amount')
      .eq('plan_id', planId)
      .eq('status', 'confirmed');

    const { data: stripePayments, error: stripeError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded');

    // Filtrar pagamentos Stripe por assinatura do plano
    let stripeRevenue = 0;
    if (stripePayments && !stripeError) {
      const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('plan_id', planId);

      const subscriptionIds = subscriptions?.map(s => s.id) || [];
      
      for (const payment of stripePayments) {
        if (subscriptionIds.includes(payment.subscription_id)) {
          stripeRevenue += parseFloat(payment.amount || 0);
        }
      }
    }

    const manualRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const totalRevenue = manualRevenue + stripeRevenue;

    return {
      plan,
      stats: {
        activeSubscriptions: activeSubscriptions || 0,
        totalSubscriptions: totalSubscriptions || 0,
        totalRevenue,
        manualRevenue,
        stripeRevenue
      }
    };
  } catch (error) {
    globalLogger.error('Erro ao obter estatísticas do plano', {
      error: error.message,
      planId
    });
    throw error;
  }
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deactivatePlan,
  activatePlan,
  getPlanStats
};

