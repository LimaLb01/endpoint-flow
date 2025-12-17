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

// Middleware básico de autenticação (TODO: implementar JWT)
// Por enquanto, apenas verifica se há um header de autenticação
function requireAuth(req, res, next) {
  // TODO: Implementar autenticação JWT
  // Por enquanto, apenas loga que foi chamado
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autenticação necessário'
    });
  }
  next();
}

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

module.exports = router;

