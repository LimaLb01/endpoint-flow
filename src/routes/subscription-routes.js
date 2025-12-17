/**
 * Rotas Públicas de Assinaturas
 * Para uso no WhatsApp Flow
 */

const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../services/stripe-service');
const { getOrCreateCustomer } = require('../services/customer-service');
const { getActiveSubscriptionByCpf } = require('../services/subscription-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/customers/check/:cpf
 * Verifica se CPF tem plano ativo
 */
router.get('/customers/check/:cpf', async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const cpf = req.params.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    
    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({
        error: 'CPF inválido',
        message: 'CPF deve conter 11 dígitos'
      });
    }
    
    const subscription = await getActiveSubscriptionByCpf(cpf);
    
    if (subscription) {
      // Buscar dados do plano
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();
      
      return res.json({
        hasActiveSubscription: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan: plan || null
        }
      });
    }
    
    return res.json({
      hasActiveSubscription: false
    });
  } catch (error) {
    logger.error('Erro ao verificar assinatura do cliente', {
      error: error.message,
      cpf: req.params.cpf?.replace(/\d(?=\d{4})/g, '*')
    });
    
    return res.status(500).json({
      error: 'Erro ao verificar assinatura',
      message: error.message
    });
  }
});

/**
 * POST /api/subscriptions/create-checkout
 * Cria sessão de checkout no Stripe
 */
router.post('/subscriptions/create-checkout', async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { cpf, plan_id, customer_email, success_url, cancel_url } = req.body;
    
    // Validações
    if (!cpf || !plan_id) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        required: ['cpf', 'plan_id']
      });
    }
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        error: 'CPF inválido',
        message: 'CPF deve conter 11 dígitos'
      });
    }
    
    // Buscar ou criar cliente
    const customer = await getOrCreateCustomer(cpfLimpo);
    if (!customer) {
      return res.status(500).json({
        error: 'Erro ao buscar/criar cliente'
      });
    }
    
    // Buscar plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !plan) {
      return res.status(404).json({
        error: 'Plano não encontrado',
        message: 'O plano especificado não existe'
      });
    }
    
    if (!plan.active) {
      return res.status(400).json({
        error: 'Plano inativo',
        message: 'Este plano não está disponível no momento'
      });
    }
    
    // Verificar se tem stripe_price_id
    if (!plan.stripe_price_id) {
      return res.status(400).json({
        error: 'Plano não configurado no Stripe',
        message: 'Este plano não possui integração com Stripe. Entre em contato com o suporte.'
      });
    }
    
    // Verificar se já tem assinatura ativa
    const activeSubscription = await getActiveSubscriptionByCpf(cpfLimpo);
    if (activeSubscription) {
      return res.status(400).json({
        error: 'Cliente já possui assinatura ativa',
        message: 'Você já possui uma assinatura ativa. Cancele a atual antes de criar uma nova.'
      });
    }
    
    // Criar sessão de checkout
    const checkoutSession = await createCheckoutSession({
      customerEmail: customer_email || customer.email || `${cpfLimpo}@temp.com`,
      customerCpf: cpfLimpo,
      planId: plan_id,
      priceId: plan.stripe_price_id,
      successUrl: success_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
      cancelUrl: cancel_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`
    });
    
    if (!checkoutSession) {
      return res.status(500).json({
        error: 'Erro ao criar sessão de checkout',
        message: 'Não foi possível criar a sessão de pagamento. Verifique a configuração do Stripe.'
      });
    }
    
    logger.info('Checkout session criada com sucesso', {
      sessionId: checkoutSession.sessionId,
      customerCpf: cpfLimpo.replace(/\d(?=\d{4})/g, '*'),
      planId: plan_id
    });
    
    return res.json({
      success: true,
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.sessionId
    });
  } catch (error) {
    logger.error('Erro ao criar checkout session', {
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Erro ao criar sessão de checkout',
      message: error.message
    });
  }
});

module.exports = router;

