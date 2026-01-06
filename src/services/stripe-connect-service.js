/**
 * Serviço de Integração com Stripe Connect
 * Gerencia contas Connect Express e operações de marketplace
 */

const Stripe = require('stripe');
const { globalLogger } = require('../utils/logger');
const { supabaseAdmin } = require('../config/supabase');

// Inicializar Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Verifica se o Stripe está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return stripe !== null;
}

/**
 * Cria uma conta Stripe Connect Express
 * @param {object} barbershopData - Dados da barbearia
 * @param {string} barbershopData.nome - Nome da barbearia
 * @param {string} barbershopData.email - Email da barbearia
 * @param {string} barbershopData.cidade - Cidade da barbearia
 * @returns {Promise<object|null>} Conta criada ou null
 */
async function createConnectAccount(barbershopData) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const { nome, email, cidade } = barbershopData;

    // Criar conta Express no Stripe
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'BR', // Brasil
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      metadata: {
        barbershop_name: nome,
        cidade: cidade || '',
      },
    });

    globalLogger.info('Conta Stripe Connect criada', {
      accountId: account.id,
      barbershopName: nome,
    });

    return {
      accountId: account.id,
      account: account,
    };
  } catch (error) {
    globalLogger.error('Erro ao criar conta Stripe Connect', {
      error: error.message,
      barbershopData,
    });
    return null;
  }
}

/**
 * Cria link de onboarding para conta Stripe Connect
 * @param {string} accountId - ID da conta Stripe Connect (acct_xxx)
 * @param {string} returnUrl - URL de retorno após onboarding
 * @param {string} refreshUrl - URL para refresh do link
 * @returns {Promise<object|null>} Link de onboarding ou null
 */
async function createOnboardingLink(accountId, returnUrl, refreshUrl) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado');
    return null;
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });

    globalLogger.info('Link de onboarding criado', {
      accountId,
      url: accountLink.url,
    });

    return {
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    };
  } catch (error) {
    globalLogger.error('Erro ao criar link de onboarding', {
      error: error.message,
      accountId,
    });
    return null;
  }
}

/**
 * Obtém status da conta Stripe Connect
 * @param {string} accountId - ID da conta Stripe Connect
 * @returns {Promise<object|null>} Status da conta ou null
 */
async function getAccountStatus(accountId) {
  if (!isConfigured()) {
    return null;
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);

    return {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      email: account.email,
    };
  } catch (error) {
    globalLogger.error('Erro ao obter status da conta', {
      error: error.message,
      accountId,
    });
    return null;
  }
}

/**
 * Cria sessão de checkout para assinatura com Stripe Connect
 * @param {object} options - Opções do checkout
 * @param {string} options.customerEmail - Email do cliente
 * @param {string} options.customerCpf - CPF do cliente
 * @param {string} options.planId - ID do plano no banco
 * @param {string} options.priceId - ID do preço no Stripe (price_xxx)
 * @param {string} options.barbershopAccountId - ID da conta Stripe Connect da barbearia
 * @param {number} options.applicationFeePercent - Taxa da plataforma (%)
 * @param {string} options.successUrl - URL de sucesso
 * @param {string} options.cancelUrl - URL de cancelamento
 * @returns {Promise<object|null>} Sessão de checkout ou null
 */
async function createCheckoutSessionForConnect(options) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado');
    return null;
  }

  try {
    const {
      customerEmail,
      customerCpf,
      planId,
      priceId,
      barbershopAccountId,
      applicationFeePercent = 5.0,
      successUrl,
      cancelUrl,
    } = options;

    // Buscar ou criar cliente no Stripe
    let stripeCustomer;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      stripeCustomer = customers.data[0];
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          cpf: customerCpf,
          plan_id: planId,
        },
      });
    }

    // Buscar preço na conta Connect para determinar se é recorrente
    const price = await stripe.prices.retrieve(priceId, {
      stripeAccount: barbershopAccountId,
    });
    const isRecurring = price.type === 'recurring';

    // Calcular application_fee_amount (taxa da plataforma)
    // Para assinaturas, a taxa é calculada sobre cada invoice
    // Para pagamentos únicos, a taxa é calculada sobre o valor total

    const sessionParams = {
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customer_cpf: customerCpf,
        plan_id: planId,
        barbershop_account_id: barbershopAccountId,
      },
    };

    if (isRecurring) {
      // Assinatura recorrente
      sessionParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];

      // Para assinaturas, usar application_fee_percent
      sessionParams.subscription_data = {
        application_fee_percent: applicationFeePercent,
        transfer_data: {
          destination: barbershopAccountId,
        },
      };
    } else {
      // Pagamento único
      sessionParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];

      // Para pagamentos únicos, calcular application_fee_amount
      const amount = price.unit_amount; // em centavos
      const applicationFeeAmount = Math.round((amount * applicationFeePercent) / 100);

      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: barbershopAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    globalLogger.info('Sessão de checkout criada para Connect', {
      sessionId: session.id,
      barbershopAccountId,
      applicationFeePercent,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    globalLogger.error('Erro ao criar sessão de checkout para Connect', {
      error: error.message,
      options,
    });
    return null;
  }
}

/**
 * Cria link para Stripe Customer Portal
 * @param {string} customerId - ID do cliente no Stripe
 * @param {string} returnUrl - URL de retorno
 * @returns {Promise<object|null>} Link do portal ou null
 */
async function createCustomerPortalLink(customerId, returnUrl) {
  if (!isConfigured()) {
    return null;
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    globalLogger.error('Erro ao criar link do Customer Portal', {
      error: error.message,
      customerId,
    });
    return null;
  }
}

/**
 * Calcula a taxa da plataforma baseada no plano da barbearia
 * @param {string} barbershopId - ID da barbearia
 * @returns {Promise<number>} Taxa em percentual
 */
async function getApplicationFeePercent(barbershopId) {
  try {
    const { data: barbershop, error } = await supabaseAdmin
      .from('barbershops')
      .select('application_fee_percent, plano')
      .eq('id', barbershopId)
      .single();

    if (error || !barbershop) {
      globalLogger.warn('Barbearia não encontrada, usando taxa padrão', {
        barbershopId,
        error: error?.message,
      });
      return 5.0; // Taxa padrão
    }

    // Futuro: ajustar taxa baseado no plano
    // if (barbershop.plano === 'pro') return 3.0;
    // if (barbershop.plano === 'enterprise') return 0.0;

    return parseFloat(barbershop.application_fee_percent) || 5.0;
  } catch (error) {
    globalLogger.error('Erro ao obter taxa da plataforma', {
      error: error.message,
      barbershopId,
    });
    return 5.0; // Taxa padrão em caso de erro
  }
}

module.exports = {
  isConfigured,
  createConnectAccount,
  createOnboardingLink,
  getAccountStatus,
  createCheckoutSessionForConnect,
  createCustomerPortalLink,
  getApplicationFeePercent,
};

