/**
 * Rotas Administrativas
 * Interface para gerenciar clientes, assinaturas e pagamentos manuais
 */

const express = require('express');
const router = express.Router();
const { getCustomerByCpf, createCustomer, updateCustomer } = require('../services/customer-service');
const { getActiveSubscriptionByCpf, createSubscription, cancelSubscription } = require('../services/subscription-service');
const { getOrCreateCustomer } = require('../services/customer-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');
const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth-middleware');
const { notifyPaymentConfirmed } = require('../services/notification-service');

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
 * Lista planos disponíveis
 */
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('price', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return res.json({
      plans: data || []
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao listar planos',
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
    
    // Receita do mês atual (pagamentos confirmados)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date();
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);
    
    const { data: pagamentos, error: pagamentosError } = await supabaseAdmin
      .from('manual_payments')
      .select('amount')
      .eq('status', 'confirmed')
      .gte('payment_date', inicioMes.toISOString())
      .lte('payment_date', fimMes.toISOString());
    
    if (pagamentosError) {
      throw pagamentosError;
    }
    
    const receitaMes = pagamentos?.reduce((total, p) => {
      return total + (parseFloat(p.amount) || 0);
    }, 0) || 0;
    
    const stats = {
      totalClientes: totalClientes || 0,
      assinaturasAtivas: assinaturasAtivas || 0,
      assinaturasVencidas: assinaturasVencidas || 0,
      receitaMes: receitaMes
    };
    
    logger.info('Estatísticas do dashboard carregadas', {
      totalClientes: stats.totalClientes,
      assinaturasAtivas: stats.assinaturasAtivas
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

module.exports = router;

