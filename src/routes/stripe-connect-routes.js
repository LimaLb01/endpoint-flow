/**
 * Rotas para Stripe Connect
 * Gerencia onboarding, checkout e portal do cliente
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth-middleware');
const { createRequestLogger, globalLogger } = require('../utils/logger');
const {
  createConnectAccount,
  createOnboardingLink,
  getAccountStatus,
  createCheckoutSessionForConnect,
  createCustomerPortalLink,
  getApplicationFeePercent,
} = require('../services/stripe-connect-service');
const { supabaseAdmin } = require('../config/supabase');

/**
 * POST /api/stripe/connect/onboard
 * Inicia processo de onboarding para uma barbearia
 */
router.post('/connect/onboard', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;

  try {
    const { barbershopId } = req.body;

    if (!barbershopId) {
      return res.status(400).json({ error: 'barbershopId é obrigatório' });
    }

    // Buscar dados da barbearia
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      logger.error('Barbearia não encontrada', { barbershopId, error: barbershopError?.message });
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Se já tem conta Stripe, verificar status
    if (barbershop.stripe_account_id) {
      const accountStatus = await getAccountStatus(barbershop.stripe_account_id);

      if (accountStatus && accountStatus.details_submitted) {
        // Conta já configurada, retornar link de refresh se necessário
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const returnUrl = `${baseUrl}/pagamentos?onboarding=success`;
        const refreshUrl = `${baseUrl}/pagamentos?onboarding=refresh`;

        const link = await createOnboardingLink(
          barbershop.stripe_account_id,
          returnUrl,
          refreshUrl
        );

        if (link) {
          return res.json({
            url: link.url,
            expires_at: link.expires_at,
            account_id: barbershop.stripe_account_id,
          });
        }
      }
    }

    // Criar nova conta Stripe Connect se não existir
    let accountId = barbershop.stripe_account_id;

    if (!accountId) {
      // Buscar email da barbearia (pode vir de outra tabela ou ser configurado)
      const email = barbershop.email || `barbershop-${barbershop.id}@example.com`;

      const accountResult = await createConnectAccount({
        nome: barbershop.nome,
        email: email,
        cidade: barbershop.cidade,
      });

      if (!accountResult) {
        return res.status(500).json({ error: 'Erro ao criar conta Stripe Connect' });
      }

      accountId = accountResult.accountId;

      // Salvar account_id no banco
      const { error: updateError } = await supabaseAdmin
        .from('barbershops')
        .update({ stripe_account_id: accountId })
        .eq('id', barbershopId);

      if (updateError) {
        logger.error('Erro ao salvar stripe_account_id', { error: updateError.message });
      }
    }

    // Criar link de onboarding
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = `${baseUrl}/pagamentos?onboarding=success`;
    const refreshUrl = `${baseUrl}/pagamentos?onboarding=refresh`;

    const link = await createOnboardingLink(accountId, returnUrl, refreshUrl);

    if (!link) {
      return res.status(500).json({ error: 'Erro ao criar link de onboarding' });
    }

    logger.info('Link de onboarding criado', {
      barbershopId,
      accountId,
    });

    return res.json({
      url: link.url,
      expires_at: link.expires_at,
      account_id: accountId,
    });
  } catch (error) {
    logger.error('Erro no endpoint de onboarding', { error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
});

/**
 * GET /api/stripe/connect/status/:barbershopId
 * Verifica status da conta Stripe Connect de uma barbearia
 */
router.get('/connect/status/:barbershopId', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;

  try {
    const { barbershopId } = req.params;

    // Buscar barbearia
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (!barbershop.stripe_account_id) {
      return res.json({
        connected: false,
        status: 'not_connected',
        message: 'Conta Stripe não conectada',
      });
    }

    // Verificar status no Stripe
    const accountStatus = await getAccountStatus(barbershop.stripe_account_id);

    if (!accountStatus) {
      return res.json({
        connected: false,
        status: 'error',
        message: 'Erro ao verificar status da conta',
      });
    }

    // Atualizar status no banco se necessário
    const onboardingCompleted = accountStatus.details_submitted && accountStatus.charges_enabled;
    if (onboardingCompleted !== barbershop.stripe_onboarding_completed) {
      await supabaseAdmin
        .from('barbershops')
        .update({ stripe_onboarding_completed: onboardingCompleted })
        .eq('id', barbershopId);
    }

    return res.json({
      connected: true,
      status: onboardingCompleted ? 'active' : 'pending',
      account_id: barbershop.stripe_account_id,
      charges_enabled: accountStatus.charges_enabled,
      payouts_enabled: accountStatus.payouts_enabled,
      details_submitted: accountStatus.details_submitted,
    });
  } catch (error) {
    logger.error('Erro ao verificar status da conta', { error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
});

/**
 * POST /api/stripe/connect/checkout
 * Cria sessão de checkout para assinatura com Stripe Connect
 */
router.post('/connect/checkout', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;

  try {
    const {
      customerEmail,
      customerCpf,
      planId,
      priceId,
      barbershopId,
      successUrl,
      cancelUrl,
    } = req.body;

    // Validações
    if (!customerEmail || !customerCpf || !planId || !priceId || !barbershopId) {
      return res.status(400).json({
        error: 'Campos obrigatórios: customerEmail, customerCpf, planId, priceId, barbershopId',
      });
    }

    // Buscar barbearia e verificar se tem conta Stripe
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('stripe_account_id, stripe_onboarding_completed')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (!barbershop.stripe_account_id || !barbershop.stripe_onboarding_completed) {
      return res.status(400).json({
        error: 'Barbearia não possui conta Stripe Connect configurada',
      });
    }

    // Obter taxa da plataforma
    const applicationFeePercent = await getApplicationFeePercent(barbershopId);

    // Criar sessão de checkout
    const checkoutResult = await createCheckoutSessionForConnect({
      customerEmail,
      customerCpf,
      planId,
      priceId,
      barbershopAccountId: barbershop.stripe_account_id,
      applicationFeePercent,
      successUrl: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagamentos?checkout=success`,
      cancelUrl: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagamentos?checkout=cancel`,
    });

    if (!checkoutResult) {
      return res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }

    logger.info('Sessão de checkout criada', {
      sessionId: checkoutResult.sessionId,
      barbershopId,
    });

    return res.json({
      sessionId: checkoutResult.sessionId,
      url: checkoutResult.url,
    });
  } catch (error) {
    logger.error('Erro ao criar checkout', { error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
});

/**
 * POST /api/stripe/connect/portal
 * Cria link para Stripe Customer Portal
 */
router.post('/connect/portal', requireAuth, async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;

  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId é obrigatório' });
    }

    const portalResult = await createCustomerPortalLink(
      customerId,
      returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pagamentos?portal=return`
    );

    if (!portalResult) {
      return res.status(500).json({ error: 'Erro ao criar link do Customer Portal' });
    }

    return res.json({
      url: portalResult.url,
    });
  } catch (error) {
    logger.error('Erro ao criar link do portal', { error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
});

module.exports = router;

