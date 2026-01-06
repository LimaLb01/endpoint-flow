/**
 * Rotas Administrativas
 * Interface para gerenciar clientes, assinaturas e pagamentos manuais
 */

const express = require('express');
const router = express.Router();
const { getCustomerByCpf, createCustomer, updateCustomer, deleteCustomer } = require('../services/customer-service');
const { getActiveSubscriptionByCpf, createSubscription, cancelSubscription } = require('../services/subscription-service');
const { getOrCreateCustomer } = require('../services/customer-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');
const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth-middleware');
const { notifyPaymentConfirmed } = require('../services/notification-service');
const { getFlowInteractions, getFlowTimeline, getAbandonmentStats, getFlowAnalytics, deleteFlowInteraction, deleteFlowInteractionsByToken } = require('../services/flow-tracking-service');
const { listAppointments, cancelAppointment } = require('../services/calendar-service');
const { getAllBarbers } = require('../config/branches');
const { getAdminNotifications } = require('../services/admin-notifications-service');
const { getFinancialReport, exportCustomers, exportPayments, getSubscriptionsReport, getAppointmentsReport } = require('../services/reports-service');
const { getAllPlans, getPlanById, createPlan, updatePlan, deactivatePlan, activatePlan, getPlanStats } = require('../services/plans-service');

/**
 * GET /api/admin/customers
 * Lista todos os clientes (com paginação)
 */
router.get('/customers', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    // Busca por CPF ou nome se fornecido
    if (search) {
      const searchTerm = search.replace(/\D/g, '');
      if (searchTerm.length === 11) {
        // Busca por CPF
        query = query.eq('cpf', searchTerm);
      } else {
        // Busca por nome (case insensitive)
        query = query.ilike('name', `%${search}%`);
      }
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.json({
      customers: data || [],
      count: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Erro ao listar clientes', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar clientes',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/customers/:cpf
 * Busca cliente por CPF
 */
router.get('/customers/:cpf', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { cpf } = req.params;
    const customer = await getCustomerByCpf(cpf);
    
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }
    
    // Buscar assinaturas do cliente
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    
    return res.json({
      customer,
      subscriptions: subscriptions || []
    });
  } catch (error) {
    logger.error('Erro ao buscar cliente', {
      error: error.message,
      cpf: req.params.cpf?.replace(/\d(?=\d{4})/g, '*')
    });
    return res.status(500).json({
      error: 'Erro ao buscar cliente',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/customers
 * Cria um novo cliente
 */
router.post('/customers', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { cpf, name, email, phone } = req.body;
    
    // Validações
    if (!cpf) {
      return res.status(400).json({
        error: 'CPF é obrigatório'
      });
    }
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        error: 'CPF inválido',
        message: 'CPF deve conter 11 dígitos'
      });
    }
    
    // Verificar se já existe
    const existing = await getCustomerByCpf(cpfLimpo);
    if (existing) {
      return res.status(409).json({
        error: 'Cliente já existe',
        message: 'Já existe um cliente com este CPF',
        customer: existing
      });
    }
    
    // Criar cliente
    const customer = await createCustomer({
      cpf: cpfLimpo,
      name: name || null,
      email: email || null,
      phone: phone || null
    });
    
    if (!customer) {
      return res.status(500).json({
        error: 'Erro ao criar cliente',
        message: 'Não foi possível criar o cliente'
      });
    }
    
    logger.info('Cliente criado com sucesso', {
      customerId: customer.id,
      cpf: cpfLimpo.replace(/\d(?=\d{4})/g, '*')
    });
    
    return res.status(201).json({
      success: true,
      customer
    });
  } catch (error) {
    logger.error('Erro ao criar cliente', {
      error: error.message,
      cpf: req.body.cpf?.replace(/\d(?=\d{4})/g, '*')
    });
    return res.status(500).json({
      error: 'Erro ao criar cliente',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/customers/:id
 * Exclui um cliente (apenas se não tiver assinaturas ativas)
 */
router.delete('/customers/:id', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'ID do cliente é obrigatório'
      });
    }
    
    const deleted = await deleteCustomer(id);
    
    if (!deleted) {
      return res.status(400).json({
        error: 'Não foi possível excluir o cliente',
        message: 'Cliente pode ter assinaturas ativas ou não foi encontrado'
      });
    }
    
    logger.info('Cliente excluído com sucesso', { customerId: id });
    
    return res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir cliente', {
      error: error.message,
      customerId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao excluir cliente',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/customers/:cpf
 * Atualiza dados de um cliente
 */
router.put('/customers/:cpf', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { cpf } = req.params;
    const { name, email, phone } = req.body;
    
    // Buscar cliente
    const customer = await getCustomerByCpf(cpf);
    if (!customer) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }
    
    // Preparar dados para atualização
    const updates = {};
    if (name !== undefined) updates.name = name || null;
    if (email !== undefined) updates.email = email || null;
    if (phone !== undefined) updates.phone = phone || null;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar',
        message: 'Forneça pelo menos um campo para atualizar (name, email, phone)'
      });
    }
    
    // Atualizar cliente
    const updated = await updateCustomer(customer.id, updates);
    
    if (!updated) {
      return res.status(500).json({
        error: 'Erro ao atualizar cliente',
        message: 'Não foi possível atualizar o cliente'
      });
    }
    
    logger.info('Cliente atualizado com sucesso', {
      customerId: customer.id,
      cpf: cpf.replace(/\d(?=\d{4})/g, '*')
    });
    
    return res.json({
      success: true,
      customer: updated
    });
  } catch (error) {
    logger.error('Erro ao atualizar cliente', {
      error: error.message,
      cpf: req.params.cpf?.replace(/\d(?=\d{4})/g, '*')
    });
    return res.status(500).json({
      error: 'Erro ao atualizar cliente',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/payments/manual
 * Registra pagamento manual (feito no local)
 */
router.post('/payments/manual', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { cpf, plan_id, amount, payment_date, confirmed_by, notes } = req.body;
    
    if (!cpf || !plan_id || !amount || !payment_date || !confirmed_by) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        required: ['cpf', 'plan_id', 'amount', 'payment_date', 'confirmed_by']
      });
    }
    
    // Buscar ou criar cliente
    const customer = await getOrCreateCustomer(cpf);
    if (!customer) {
      return res.status(500).json({
        error: 'Erro ao buscar/criar cliente'
      });
    }
    
    // Criar pagamento manual
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('manual_payments')
      .insert({
        customer_id: customer.id,
        plan_id,
        amount: parseFloat(amount),
        payment_date: new Date(payment_date),
        confirmed_by,
        notes: notes || null,
        status: 'confirmed'
      })
      .select()
      .single();
    
    if (paymentError) {
      throw paymentError;
    }
    
    // Criar assinatura automaticamente
    const subscription = await createSubscription(customer.id, plan_id, {
      status: 'active'
    });
    
    // Buscar dados do plano para notificação
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    // Enviar notificações
    await notifyPaymentConfirmed(customer, payment, plan || {});
    
    logger.info('Pagamento manual registrado', {
      paymentId: payment.id,
      customerId: customer.id,
      planId: plan_id
    });
    
    return res.json({
      success: true,
      payment,
      subscription
    });
  } catch (error) {
    logger.error('Erro ao registrar pagamento manual', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao registrar pagamento',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/subscriptions
 * Lista assinaturas ativas
 */
router.get('/subscriptions', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { status = 'active', limit = 50 } = req.query;
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) {
      throw error;
    }
    
    return res.json({
      subscriptions: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    logger.error('Erro ao listar assinaturas', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar assinaturas',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/subscriptions/:id
 * Obtém detalhes de uma assinatura específica
 */
router.get('/subscriptions/:id', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers(*),
        plan:plans(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Assinatura não encontrada'
        });
      }
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({
        error: 'Assinatura não encontrada'
      });
    }
    
    return res.json(data);
  } catch (error) {
    logger.error('Erro ao buscar assinatura', {
      error: error.message,
      subscriptionId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao buscar assinatura',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/subscriptions/:id/cancel
 * Cancela uma assinatura
 */
router.put('/subscriptions/:id/cancel', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    const { cancel_at_period_end = false } = req.body;
    
    const subscription = await cancelSubscription(id, cancel_at_period_end);
    
    if (!subscription) {
      return res.status(404).json({
        error: 'Assinatura não encontrada'
      });
    }
    
    // Buscar dados do cliente e plano para notificação
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', subscription.customer_id)
      .single();
    
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();
    
    // Enviar notificações
    if (customer && plan) {
      await notifySubscriptionCanceled(customer, subscription, plan);
    }
    
    logger.info('Assinatura cancelada', {
      subscriptionId: id,
      cancelAtPeriodEnd: cancel_at_period_end
    });
    
    return res.json({
      success: true,
      subscription
    });
  } catch (error) {
    logger.error('Erro ao cancelar assinatura', {
      error: error.message,
      subscriptionId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao cancelar assinatura',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/plans
 * Lista planos disponíveis (ativos e inativos)
 */
router.get('/plans', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { active, barbershop_id } = req.query;
    const options = {};
    
    if (active !== undefined && active !== null && active !== '') {
      options.active = active === 'true';
    }
    
    // Se barbershop_id não fornecido na query, tentar pegar do JWT ou header
    const finalBarbershopId = barbershop_id || req.headers['x-barbershop-id'] || req.user?.barbershop_id;
    if (finalBarbershopId) {
      options.barbershop_id = finalBarbershopId;
    }
    
    const plans = await getAllPlans(options);
    
    logger.info('Planos listados', {
      total: plans.length,
      barbershopId: finalBarbershopId || 'all',
      active: options.active
    });
    
    return res.json({
      success: true,
      plans
    });
  } catch (error) {
    logger.error('Erro ao listar planos', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar planos',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/plans
 * Cria um novo plano
 */
router.post('/plans', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { name, type, price, currency, description, active, stripe_price_id, barbershop_id } = req.body;
    
    // Se barbershop_id não fornecido no body, tentar pegar do JWT ou header
    // Por enquanto, é obrigatório no body (depois pode vir do JWT)
    const finalBarbershopId = barbershop_id || req.headers['x-barbershop-id'] || req.user?.barbershop_id;
    
    if (!finalBarbershopId) {
      return res.status(400).json({
        error: 'barbershop_id é obrigatório',
        message: 'É necessário informar o ID da barbearia para criar o plano'
      });
    }
    
    const plan = await createPlan({
      name,
      type,
      price,
      currency,
      description,
      active,
      stripe_price_id,
      barbershop_id: finalBarbershopId
    });
    
    logger.info('Plano criado', {
      planId: plan.id,
      barbershopId: finalBarbershopId,
      name: plan.name
    });
    
    return res.status(201).json({
      success: true,
      plan
    });
  } catch (error) {
    logger.error('Erro ao criar plano', {
      error: error.message
    });
    return res.status(400).json({
      error: 'Erro ao criar plano',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/plans/:id/stats
 * Obtém estatísticas de um plano
 * IMPORTANTE: Esta rota deve vir ANTES de /plans/:id para evitar conflito
 */
router.get('/plans/:id/stats', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    const result = await getPlanStats(id);
    
    logger.info('Estatísticas do plano obtidas', {
      planId: id
    });
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do plano', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(400).json({
      error: 'Erro ao obter estatísticas do plano',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/plans/:id/deactivate
 * Desativa um plano
 * IMPORTANTE: Esta rota deve vir ANTES de /plans/:id para evitar conflito
 */
router.put('/plans/:id/deactivate', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    const plan = await deactivatePlan(id);
    
    logger.info('Plano desativado', {
      planId: id
    });
    
    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    logger.error('Erro ao desativar plano', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(400).json({
      error: 'Erro ao desativar plano',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/plans/:id/activate
 * Ativa um plano
 * IMPORTANTE: Esta rota deve vir ANTES de /plans/:id para evitar conflito
 */
router.put('/plans/:id/activate', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    const plan = await activatePlan(id);
    
    logger.info('Plano ativado', {
      planId: id
    });
    
    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    logger.error('Erro ao ativar plano', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(400).json({
      error: 'Erro ao ativar plano',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/plans/:id/sync-stripe
 * Sincroniza um plano existente com o Stripe Connect
 * Cria produto/preço na conta Connect da barbearia se ainda não existir
 * IMPORTANTE: Esta rota deve vir ANTES de /plans/:id para evitar conflito
 */
router.post('/plans/:id/sync-stripe', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    
    // Buscar plano
    const plan = await getPlanById(id);
    if (!plan) {
      return res.status(404).json({
        error: 'Plano não encontrado',
        message: 'O plano especificado não existe'
      });
    }
    
    // Verificar se já tem produto/preço criados
    if (plan.stripe_product_id && plan.stripe_price_id) {
      return res.status(400).json({
        error: 'Plano já sincronizado',
        message: 'Este plano já possui produto e preço criados no Stripe Connect',
        stripe_product_id: plan.stripe_product_id,
        stripe_price_id: plan.stripe_price_id
      });
    }
    
    // Verificar se tem barbershop_id
    if (!plan.barbershop_id) {
      return res.status(400).json({
        error: 'Plano sem barbearia',
        message: 'Este plano não está associado a uma barbearia. Associe uma barbearia antes de sincronizar com o Stripe.'
      });
    }
    
    // Buscar barbearia
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('id, nome, stripe_account_id, stripe_onboarding_completed')
      .eq('id', plan.barbershop_id)
      .single();
    
    if (barbershopError || !barbershop) {
      return res.status(404).json({
        error: 'Barbearia não encontrada',
        message: 'A barbearia associada ao plano não foi encontrada'
      });
    }
    
    // Verificar Stripe Connect
    if (!barbershop.stripe_account_id) {
      return res.status(400).json({
        error: 'Stripe Connect não configurado',
        message: 'A barbearia não possui conta Stripe Connect configurada. Configure o Stripe Connect primeiro.'
      });
    }
    
    if (!barbershop.stripe_onboarding_completed) {
      return res.status(400).json({
        error: 'Onboarding incompleto',
        message: 'O onboarding do Stripe Connect não foi concluído. Complete o processo de conexão primeiro.'
      });
    }
    
    // Criar produto e preço no Stripe Connect
    const { createProductAndPriceFromPlan, isConfigured: isStripeConfigured } = require('../services/stripe-products-service');
    
    if (!isStripeConfigured()) {
      return res.status(500).json({
        error: 'Stripe não configurado',
        message: 'O Stripe não está configurado no servidor'
      });
    }
    
    const stripeResult = await createProductAndPriceFromPlan({
      ...plan,
      stripeAccount: barbershop.stripe_account_id, // Criar na conta Connect da barbearia
    });
    
    if (!stripeResult || !stripeResult.priceId) {
      return res.status(500).json({
        error: 'Erro ao criar produto no Stripe',
        message: 'Não foi possível criar o produto e preço no Stripe Connect'
      });
    }
    
    // Atualizar plano com IDs do Stripe
    const updatedPlan = await updatePlan(id, {
      stripe_product_id: stripeResult.productId,
      stripe_price_id: stripeResult.priceId,
    });
    
    logger.info('Plano sincronizado com Stripe Connect', {
      planId: id,
      barbershopId: plan.barbershop_id,
      stripeAccountId: barbershop.stripe_account_id,
      productId: stripeResult.productId,
      priceId: stripeResult.priceId,
    });
    
    return res.json({
      success: true,
      message: 'Plano sincronizado com sucesso no Stripe Connect',
      plan: updatedPlan,
      stripe: {
        product_id: stripeResult.productId,
        price_id: stripeResult.priceId,
        stripe_account: barbershop.stripe_account_id,
      }
    });
  } catch (error) {
    logger.error('Erro ao sincronizar plano com Stripe', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao sincronizar plano',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/plans/:id
 * Obtém detalhes de um plano específico
 */
router.get('/plans/:id', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);
    
    if (!plan) {
      return res.status(404).json({
        error: 'Plano não encontrado'
      });
    }
    
    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    logger.error('Erro ao buscar plano', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao buscar plano',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/plans/:id
 * Atualiza um plano existente
 */
router.put('/plans/:id', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const plan = await updatePlan(id, updates);
    
    logger.info('Plano atualizado', {
      planId: id,
      updates: Object.keys(updates)
    });
    
    return res.json({
      success: true,
      plan
    });
  } catch (error) {
    logger.error('Erro ao atualizar plano', {
      error: error.message,
      planId: req.params.id
    });
    return res.status(400).json({
      error: 'Erro ao atualizar plano',
      message: error.message
    });
  }
});


/**
 * GET /api/admin/payments
 * Lista pagamentos (com filtros opcionais)
 */
router.get('/payments', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { customer_id, subscription_id, limit = 50 } = req.query;
    
    let query = supabaseAdmin
      .from('manual_payments')
      .select('*', { count: 'exact' })
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false })
      .limit(parseInt(limit));
    
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    
    if (subscription_id) {
      // Buscar assinatura primeiro para obter customer_id e plan_id
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('customer_id, plan_id')
        .eq('id', subscription_id)
        .single();
      
      if (subscription) {
        query = query
          .eq('customer_id', subscription.customer_id)
          .eq('plan_id', subscription.plan_id);
      }
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.json({
      payments: data || [],
      count: count || 0
    });
  } catch (error) {
    logger.error('Erro ao listar pagamentos', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar pagamentos',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * Retorna estatísticas para o dashboard
 */
router.get('/stats', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    // Total de clientes
    const { count: totalClientes, error: clientesError } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (clientesError) {
      throw clientesError;
    }
    
    // Assinaturas ativas
    const { count: assinaturasAtivas, error: ativasError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (ativasError) {
      throw ativasError;
    }
    
    // Assinaturas vencidas (canceled, past_due, unpaid)
    const { count: assinaturasVencidas, error: vencidasError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['canceled', 'past_due', 'unpaid']);
    
    if (vencidasError) {
      throw vencidasError;
    }
    
    // Receita do mês atual (pagamentos confirmados + succeeded)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date();
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);
    
    // Pagamentos manuais confirmados
    const { data: pagamentosManuais, error: pagamentosManuaisError } = await supabaseAdmin
      .from('manual_payments')
      .select('amount')
      .eq('status', 'confirmed')
      .gte('payment_date', inicioMes.toISOString())
      .lte('payment_date', fimMes.toISOString());
    
    // Pagamentos da tabela payments (Stripe)
    const { data: pagamentosStripe, error: pagamentosStripeError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('payment_date', inicioMes.toISOString())
      .lte('payment_date', fimMes.toISOString());
    
    const receitaManuais = pagamentosManuais?.reduce((total, p) => {
      return total + (parseFloat(p.amount) || 0);
    }, 0) || 0;
    
    const receitaStripe = pagamentosStripe?.reduce((total, p) => {
      return total + (parseFloat(p.amount) || 0);
    }, 0) || 0;
    
    const receitaMes = receitaManuais + receitaStripe;
    
    // Receita do mês anterior (para comparação)
    const inicioMesAnterior = new Date(inicioMes);
    inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
    
    const fimMesAnterior = new Date(inicioMes);
    fimMesAnterior.setDate(0);
    fimMesAnterior.setHours(23, 59, 59, 999);
    
    let receitaMesAnterior = 0;
    try {
      // Pagamentos manuais do mês anterior
      const { data: pagamentosManuaisAnterior, error: pagamentosManuaisAnteriorError } = await supabaseAdmin
        .from('manual_payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('payment_date', inicioMesAnterior.toISOString())
        .lte('payment_date', fimMesAnterior.toISOString());
      
      // Pagamentos Stripe do mês anterior
      const { data: pagamentosStripeAnterior, error: pagamentosStripeAnteriorError } = await supabaseAdmin
        .from('payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('payment_date', inicioMesAnterior.toISOString())
        .lte('payment_date', fimMesAnterior.toISOString());
      
      const receitaManuaisAnterior = pagamentosManuaisAnterior?.reduce((total, p) => {
        return total + (parseFloat(p.amount) || 0);
      }, 0) || 0;
      
      const receitaStripeAnterior = pagamentosStripeAnterior?.reduce((total, p) => {
        return total + (parseFloat(p.amount) || 0);
      }, 0) || 0;
      
      receitaMesAnterior = receitaManuaisAnterior + receitaStripeAnterior;
    } catch (error) {
      logger.warn('Erro ao calcular receita do mês anterior', { error: error.message });
    }
    
    const crescimentoReceita = receitaMesAnterior > 0 
      ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 
      : 0;
    
    // Receita histórica (últimos 6 meses)
    const receitaHistorica = [];
    try {
      for (let i = 5; i >= 0; i--) {
        const mes = new Date();
        mes.setMonth(mes.getMonth() - i);
        const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const fim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59, 59, 999);
        
        // Pagamentos manuais
        const { data: pagamentosManuaisMes, error: errorManuaisMes } = await supabaseAdmin
          .from('manual_payments')
          .select('amount')
          .eq('status', 'confirmed')
          .gte('payment_date', inicio.toISOString())
          .lte('payment_date', fim.toISOString());
        
        // Pagamentos Stripe
        const { data: pagamentosStripeMes, error: errorStripeMes } = await supabaseAdmin
          .from('payments')
          .select('amount')
          .eq('status', 'succeeded')
          .gte('payment_date', inicio.toISOString())
          .lte('payment_date', fim.toISOString());
        
        const receitaManuais = pagamentosManuaisMes?.reduce((total, p) => {
          return total + (parseFloat(p.amount) || 0);
        }, 0) || 0;
        
        const receitaStripe = pagamentosStripeMes?.reduce((total, p) => {
          return total + (parseFloat(p.amount) || 0);
        }, 0) || 0;
        
        const receita = receitaManuais + receitaStripe;
        
        receitaHistorica.push({
          mes: inicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          receita: receita
        });
      }
    } catch (error) {
      logger.warn('Erro ao calcular receita histórica', { error: error.message });
    }
    
    // Top 5 clientes por receita (de ambas as tabelas)
    let top5Clientes = [];
    try {
      // Pagamentos manuais
      const { data: topClientesManuais, error: topClientesManuaisError } = await supabaseAdmin
        .from('manual_payments')
        .select(`
          amount,
          customer_id,
          customers(id, name, cpf)
        `)
        .eq('status', 'confirmed')
        .order('payment_date', { ascending: false })
        .limit(100);
      
      // Pagamentos Stripe
      const { data: topClientesStripe, error: topClientesStripeError } = await supabaseAdmin
        .from('payments')
        .select(`
          amount,
          customer_id,
          customers(id, name, cpf)
        `)
        .eq('status', 'succeeded')
        .order('payment_date', { ascending: false })
        .limit(100);
      
      const topClientes = [
        ...(topClientesManuais || []),
        ...(topClientesStripe || [])
      ];
      
      const clientesReceita = {};
      if (topClientes && topClientes.length > 0) {
        topClientes.forEach(p => {
          if (p.customers && p.customer_id) {
            const customerId = p.customer_id;
            if (!clientesReceita[customerId]) {
              clientesReceita[customerId] = {
                id: customerId,
                name: p.customers.name,
                cpf: p.customers.cpf,
                total: 0
              };
            }
            clientesReceita[customerId].total += parseFloat(p.amount) || 0;
          }
        });
      }
      
      top5Clientes = Object.values(clientesReceita)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    } catch (error) {
      logger.warn('Erro ao calcular top clientes', { error: error.message });
    }
    
    // Receita por plano
    let receitaPorPlano = {};
    try {
      const { data: assinaturasComPlanos, error: planosError } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          plan_id,
          plans(id, name, price)
        `)
        .eq('status', 'active');
      
      receitaPorPlano = {};
      if (assinaturasComPlanos && !planosError) {
        assinaturasComPlanos.forEach(sub => {
          if (sub.plans && sub.plan_id) {
            const planId = sub.plan_id;
            if (!receitaPorPlano[planId]) {
              receitaPorPlano[planId] = {
                name: sub.plans.name,
                receita: 0,
                assinaturas: 0
              };
            }
            receitaPorPlano[planId].receita += parseFloat(sub.plans.price) || 0;
            receitaPorPlano[planId].assinaturas += 1;
          }
        });
      }
    } catch (error) {
      logger.warn('Erro ao calcular receita por plano', { error: error.message });
    }
    
    // Assinaturas vencendo em 7 dias
    let assinaturasVencendo = 0;
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 7);
      
      const { count: countVencendo, error: vencendoError } = await supabaseAdmin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('current_period_end', dataLimite.toISOString())
        .gte('current_period_end', new Date().toISOString());
      
      if (!vencendoError) {
        assinaturasVencendo = countVencendo || 0;
      }
    } catch (error) {
      logger.warn('Erro ao calcular assinaturas vencendo', { error: error.message });
    }
    
    // Estatísticas do Flow
    let flowStats = {
      total: 0,
      completos: 0,
      abandonados: 0,
      emAndamento: 0,
      taxaConversao: 0
    };
    
    try {
      const { data: flowInteractions, error: flowError } = await supabaseAdmin
        .from('flow_interactions')
        .select('status, screen, flow_token')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (flowInteractions && !flowError) {
        const uniqueTokens = new Set();
        const completosTokens = new Set();
        const abandonadosTokens = new Set();
        
        flowInteractions.forEach(interaction => {
          if (interaction.flow_token) {
            uniqueTokens.add(interaction.flow_token);
            if (interaction.status === 'completed') {
              completosTokens.add(interaction.flow_token);
            } else if (interaction.status === 'abandoned') {
              abandonadosTokens.add(interaction.flow_token);
            }
          }
        });
        
        flowStats = {
          total: uniqueTokens.size,
          completos: completosTokens.size,
          abandonados: abandonadosTokens.size,
          emAndamento: uniqueTokens.size - completosTokens.size - abandonadosTokens.size,
          taxaConversao: uniqueTokens.size > 0 ? (completosTokens.size / uniqueTokens.size) * 100 : 0
        };
      }
    } catch (error) {
      logger.warn('Erro ao calcular estatísticas do flow', { error: error.message });
    }
    
    const stats = {
      totalClientes: totalClientes || 0,
      assinaturasAtivas: assinaturasAtivas || 0,
      assinaturasVencidas: assinaturasVencidas || 0,
      receitaMes: receitaMes,
      receitaMesAnterior: receitaMesAnterior,
      crescimentoReceita: crescimentoReceita,
      receitaHistorica: receitaHistorica,
      top5Clientes: top5Clientes,
      receitaPorPlano: Object.values(receitaPorPlano),
      assinaturasVencendo: assinaturasVencendo,
      flowStats: flowStats
    };
    
    logger.info('Estatísticas do dashboard carregadas', {
      totalClientes: stats.totalClientes,
      assinaturasAtivas: stats.assinaturasAtivas,
      receitaMes: stats.receitaMes
    });
    
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Erro ao carregar estatísticas', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao carregar estatísticas',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/subscriptions/fix-periods
 * Corrige assinaturas ativas que não têm current_period_end definido
 */
router.post('/subscriptions/fix-periods', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    // Buscar todas as assinaturas ativas sem current_period_end
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('status', 'active')
      .is('current_period_end', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhuma assinatura precisa ser corrigida',
        updated: 0
      });
    }

    let updated = 0;
    const errors = [];

    for (const subscription of subscriptions) {
      try {
        const plan = subscription.plan;
        if (!plan) {
          errors.push(`Assinatura ${subscription.id}: plano não encontrado`);
          continue;
        }

        const startDate = subscription.current_period_start 
          ? new Date(subscription.current_period_start)
          : new Date(subscription.created_at);

        let periodEnd = null;

        if (plan.type === 'monthly') {
          periodEnd = new Date(startDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else if (plan.type === 'yearly') {
          periodEnd = new Date(startDate);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else if (plan.type === 'one_time') {
          // Plano único: sem data de expiração
          periodEnd = null;
        }

        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            current_period_start: startDate,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          errors.push(`Assinatura ${subscription.id}: ${updateError.message}`);
        } else {
          updated++;
        }
      } catch (error) {
        errors.push(`Assinatura ${subscription.id}: ${error.message}`);
      }
    }

    logger.info('Correção de períodos de assinaturas concluída', {
      total: subscriptions.length,
      updated,
      errors: errors.length
    });

    return res.json({
      success: true,
      message: `${updated} assinatura(s) atualizada(s)`,
      total: subscriptions.length,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    logger.error('Erro ao corrigir períodos de assinaturas', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao corrigir períodos',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/flow/interactions
 * Lista interações do flow com filtros
 */
router.get('/flow/interactions', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const {
      status,
      client_cpf,
      screen,
      search,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (client_cpf) filters.client_cpf = client_cpf;
    if (screen) filters.screen = screen;
    if (search) filters.search = search;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    filters.limit = parseInt(limit);
    filters.offset = parseInt(offset);

    const result = await getFlowInteractions(filters);

    logger.info('Interações do flow buscadas', {
      total: result.total,
      returned: result.interactions.length
    });

    return res.json({
      interactions: result.interactions,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error) {
    logger.error('Erro ao buscar interações do flow', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao buscar interações do flow',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/flow/timeline/:flowToken
 * Busca timeline completa de um flow_token específico
 */
router.get('/flow/timeline/:flowToken', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { flowToken } = req.params;

    const timeline = await getFlowTimeline(flowToken);

    logger.info('Timeline do flow buscada', {
      flow_token: flowToken,
      events: timeline.length
    });

    return res.json({
      flow_token: flowToken,
      timeline: timeline
    });
  } catch (error) {
    logger.error('Erro ao buscar timeline do flow', {
      error: error.message,
      flow_token: req.params.flowToken
    });
    return res.status(500).json({
      error: 'Erro ao buscar timeline do flow',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/flow/stats
 * Busca estatísticas de abandono por etapa
 */
router.get('/flow/stats', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const stats = await getAbandonmentStats();

    logger.info('Estatísticas do flow buscadas');

    return res.json({
      stats: stats
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas do flow', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao buscar estatísticas do flow',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/flow/analytics
 * Busca analytics completos do Flow (funil, abandono, tempo médio, heatmap, localização)
 */
router.get('/flow/analytics', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { startDate, endDate } = req.query;
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const analytics = await getFlowAnalytics(filters);

    logger.info('Analytics do flow buscados');

    return res.json({
      analytics: analytics
    });
  } catch (error) {
    logger.error('Erro ao buscar analytics do flow', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao buscar analytics do flow',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/flow/interactions/:id
 * Exclui uma interação do flow
 */
router.delete('/flow/interactions/:id', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id } = req.params;

    const deleted = await deleteFlowInteraction(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Interação não encontrada ou não pôde ser excluída'
      });
    }

    logger.info('Interação do flow excluída', {
      interactionId: id
    });

    return res.json({
      success: true,
      message: 'Interação excluída com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir interação do flow', {
      error: error.message,
      interactionId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao excluir interação do flow',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/flow/interactions/token/:flowToken
 * Exclui todas as interações de um flow_token
 */
router.delete('/flow/interactions/token/:flowToken', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { flowToken } = req.params;

    const deleted = await deleteFlowInteractionsByToken(flowToken);

    if (!deleted) {
      return res.status(404).json({
        error: 'Interações não encontradas ou não puderam ser excluídas'
      });
    }

    logger.info('Interações do flow excluídas', {
      flowToken
    });

    return res.json({
      success: true,
      message: 'Interações excluídas com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir interações do flow', {
      error: error.message,
      flowToken: req.params.flowToken
    });
    return res.status(500).json({
      error: 'Erro ao excluir interações do flow',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/appointments
 * Lista agendamentos do Google Calendar
 */
router.get('/appointments', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const {
      startDate,
      endDate,
      barberId,
      maxResults = 250
    } = req.query;

    const appointments = await listAppointments({
      startDate: startDate || new Date().toISOString(),
      endDate,
      barberId,
      maxResults: parseInt(maxResults),
      requestId: req.requestId
    });

    logger.info('Agendamentos listados', {
      total: appointments.length,
      barberId,
      startDate,
      endDate
    });

    return res.json({
      success: true,
      appointments,
      total: appointments.length
    });
  } catch (error) {
    logger.error('Erro ao listar agendamentos', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar agendamentos',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/appointments/:eventId
 * Cancela um agendamento no Google Calendar
 */
router.delete('/appointments/:eventId', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { eventId } = req.params;
    const { barberId } = req.query;

    await cancelAppointment(eventId, barberId);

    logger.info('Agendamento cancelado', {
      eventId,
      barberId
    });

    return res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao cancelar agendamento', {
      error: error.message,
      eventId: req.params.eventId
    });
    return res.status(500).json({
      error: 'Erro ao cancelar agendamento',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/barbers
 * Lista todos os barbeiros disponíveis
 */
router.get('/barbers', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const barbers = getAllBarbers();
    
    logger.info('Barbeiros listados', {
      total: barbers.length
    });

    return res.json(barbers);
  } catch (error) {
    logger.error('Erro ao listar barbeiros', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar barbeiros',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/notifications
 * Retorna notificações e alertas para o painel administrativo
 */
router.get('/notifications', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const notifications = await getAdminNotifications();
    
    logger.info('Notificações administrativas buscadas', {
      total: notifications.total
    });
    
    return res.json(notifications);
  } catch (error) {
    logger.error('Erro ao buscar notificações administrativas', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao buscar notificações',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports/financial
 * Gera relatório financeiro (mensal ou anual)
 */
router.get('/reports/financial', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { period = 'month', month, year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        error: 'Ano é obrigatório'
      });
    }
    
    if (period === 'month' && !month) {
      return res.status(400).json({
        error: 'Mês é obrigatório para relatório mensal'
      });
    }
    
    const report = await getFinancialReport({
      period,
      month: month ? parseInt(month) : null,
      year: parseInt(year)
    });
    
    logger.info('Relatório financeiro gerado', {
      period,
      month,
      year
    });
    
    return res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório financeiro', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao gerar relatório financeiro',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports/customers/export
 * Exporta clientes (CSV/Excel)
 */
router.get('/reports/customers/export', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { startDate, endDate } = req.query;
    
    const customers = await exportCustomers({
      startDate,
      endDate
    });
    
    logger.info('Clientes exportados', {
      total: customers.length
    });
    
    return res.json({
      success: true,
      customers,
      total: customers.length
    });
  } catch (error) {
    logger.error('Erro ao exportar clientes', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao exportar clientes',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports/payments/export
 * Exporta pagamentos (CSV/Excel)
 */
router.get('/reports/payments/export', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { startDate, endDate } = req.query;
    
    const payments = await exportPayments({
      startDate,
      endDate
    });
    
    logger.info('Pagamentos exportados', {
      total: payments.length
    });
    
    return res.json({
      success: true,
      payments,
      total: payments.length
    });
  } catch (error) {
    logger.error('Erro ao exportar pagamentos', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao exportar pagamentos',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports/subscriptions
 * Gera relatório de assinaturas
 */
router.get('/reports/subscriptions', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { status, startDate, endDate } = req.query;
    
    const report = await getSubscriptionsReport({
      status,
      startDate,
      endDate
    });
    
    logger.info('Relatório de assinaturas gerado', {
      total: report.stats.total
    });
    
    return res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório de assinaturas', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao gerar relatório de assinaturas',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports/appointments
 * Gera relatório de agendamentos
 */
router.get('/reports/appointments', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { startDate, endDate, barberId } = req.query;
    
    const report = await getAppointmentsReport({
      startDate,
      endDate,
      barberId
    });
    
    logger.info('Relatório de agendamentos gerado', {
      total: report.stats.total
    });
    
    return res.json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Erro ao gerar relatório de agendamentos', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao gerar relatório de agendamentos',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/barbershops
 * Lista todas as barbearias
 */
router.get('/barbershops', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { status } = req.query;
    
    let query = supabaseAdmin
      .from('barbershops')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    logger.info('Barbearias listadas', {
      total: data?.length || 0
    });
    
    return res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    logger.error('Erro ao listar barbearias', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao listar barbearias',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/barbershops/:id/subscription
 * Busca assinatura ativa de uma barbearia
 */
router.get('/barbershops/:id/subscription', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { id: barbershopId } = req.params;
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*),
        customer:customers(*)
      `)
      .eq('barbershop_id', barbershopId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return res.json({
      success: true,
      subscription: subscription || null
    });
  } catch (error) {
    logger.error('Erro ao buscar assinatura da barbearia', {
      error: error.message,
      barbershopId: req.params.id
    });
    return res.status(500).json({
      error: 'Erro ao buscar assinatura',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/search
 * Busca global em clientes, assinaturas e pagamentos
 * Filtros: query (texto), type (customers|subscriptions|payments|all), status, startDate, endDate, minAmount, maxAmount
 */
router.get('/search', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { 
      query: searchQuery = '', 
      type = 'all', // 'all', 'customers', 'subscriptions', 'payments'
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      limit = 50,
      offset = 0
    } = req.query;

    const results = {
      customers: [],
      subscriptions: [],
      payments: [],
      total: 0
    };

    // Buscar clientes
    if (type === 'all' || type === 'customers') {
      let customerQuery = supabaseAdmin
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (searchQuery) {
        const searchTerm = searchQuery.replace(/\D/g, '');
        if (searchTerm.length === 11) {
          // Busca por CPF
          customerQuery = customerQuery.eq('cpf', searchTerm);
        } else {
          // Busca por nome ou email
          customerQuery = customerQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
      }

      if (startDate) {
        customerQuery = customerQuery.gte('created_at', startDate);
      }
      if (endDate) {
        customerQuery = customerQuery.lte('created_at', endDate);
      }

      const { data: customers, error: customersError, count: customersCount } = await customerQuery;
      
      if (customersError) {
        logger.warn('Erro ao buscar clientes', { error: customersError.message });
      } else {
        results.customers = customers || [];
        results.total += customersCount || 0;
      }
    }

    // Buscar assinaturas
    if (type === 'all' || type === 'subscriptions') {
      let subscriptionQuery = supabaseAdmin
        .from('subscriptions')
        .select(`
          *,
          customer:customers(*),
          plan:plans(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        subscriptionQuery = subscriptionQuery.eq('status', status);
      }

      if (searchQuery) {
        // Buscar por nome do cliente ou ID da assinatura
        const searchTerm = searchQuery.replace(/\D/g, '');
        if (searchTerm.length === 11) {
          // Buscar por CPF do cliente
          const { data: customerByCpf } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('cpf', searchTerm)
            .single();
          
          if (customerByCpf) {
            subscriptionQuery = subscriptionQuery.eq('customer_id', customerByCpf.id);
          } else {
            // Se não encontrar cliente, retornar vazio
            subscriptionQuery = subscriptionQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        } else {
          // Buscar por nome do cliente via join
          const { data: customersByName } = await supabaseAdmin
            .from('customers')
            .select('id')
            .ilike('name', `%${searchQuery}%`);
          
          if (customersByName && customersByName.length > 0) {
            const customerIds = customersByName.map(c => c.id);
            subscriptionQuery = subscriptionQuery.in('customer_id', customerIds);
          } else {
            subscriptionQuery = subscriptionQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }

      if (startDate) {
        subscriptionQuery = subscriptionQuery.gte('created_at', startDate);
      }
      if (endDate) {
        subscriptionQuery = subscriptionQuery.lte('created_at', endDate);
      }

      const { data: subscriptions, error: subscriptionsError, count: subscriptionsCount } = await subscriptionQuery;
      
      if (subscriptionsError) {
        logger.warn('Erro ao buscar assinaturas', { error: subscriptionsError.message });
      } else {
        results.subscriptions = subscriptions || [];
        results.total += subscriptionsCount || 0;
      }
    }

    // Buscar pagamentos
    if (type === 'all' || type === 'payments') {
      let paymentQuery = supabaseAdmin
        .from('manual_payments')
        .select(`
          *,
          customer:customers(*),
          plan:plans(*)
        `, { count: 'exact' })
        .eq('status', 'confirmed')
        .order('payment_date', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (searchQuery) {
        const searchTerm = searchQuery.replace(/\D/g, '');
        if (searchTerm.length === 11) {
          // Buscar por CPF do cliente
          const { data: customerByCpf } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('cpf', searchTerm)
            .single();
          
          if (customerByCpf) {
            paymentQuery = paymentQuery.eq('customer_id', customerByCpf.id);
          } else {
            paymentQuery = paymentQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        } else {
          // Buscar por nome do cliente
          const { data: customersByName } = await supabaseAdmin
            .from('customers')
            .select('id')
            .ilike('name', `%${searchQuery}%`);
          
          if (customersByName && customersByName.length > 0) {
            const customerIds = customersByName.map(c => c.id);
            paymentQuery = paymentQuery.in('customer_id', customerIds);
          } else {
            paymentQuery = paymentQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }

      if (minAmount) {
        paymentQuery = paymentQuery.gte('amount', parseFloat(minAmount));
      }
      if (maxAmount) {
        paymentQuery = paymentQuery.lte('amount', parseFloat(maxAmount));
      }

      if (startDate) {
        paymentQuery = paymentQuery.gte('payment_date', startDate);
      }
      if (endDate) {
        paymentQuery = paymentQuery.lte('payment_date', endDate);
      }

      const { data: payments, error: paymentsError, count: paymentsCount } = await paymentQuery;
      
      if (paymentsError) {
        logger.warn('Erro ao buscar pagamentos', { error: paymentsError.message });
      } else {
        results.payments = payments || [];
        results.total += paymentsCount || 0;
      }
    }

    logger.info('Busca global realizada', {
      query: searchQuery,
      type,
      total: results.total
    });

    return res.json({
      success: true,
      results,
      query: searchQuery,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Erro ao realizar busca global', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro ao realizar busca global',
      message: error.message
    });
  }
});

module.exports = router;

