/**
 * Serviço de Integração com Stripe
 * Gerencia pagamentos e assinaturas via Stripe
 */

const Stripe = require('stripe');
const { globalLogger } = require('../utils/logger');
const { createSubscription, updateSubscription, getSubscriptionByStripeId } = require('./subscription-service');
const { getOrCreateCustomer } = require('./customer-service');
const { notifyPaymentConfirmed, notifySubscriptionCanceled } = require('./notification-service');
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
 * Cria uma sessão de checkout no Stripe
 * @param {object} options - Opções do checkout
 * @param {string} options.customerEmail - Email do cliente
 * @param {string} options.customerCpf - CPF do cliente
 * @param {string} options.planId - ID do plano no banco de dados
 * @param {string} options.priceId - ID do preço no Stripe (price_xxx)
 * @param {string} options.successUrl - URL de sucesso
 * @param {string} options.cancelUrl - URL de cancelamento
 * @returns {Promise<object|null>} Sessão de checkout ou null
 */
async function createCheckoutSession(options) {
  if (!isConfigured()) {
    globalLogger.error('Stripe não configurado. Configure STRIPE_SECRET_KEY');
    return null;
  }

  try {
    const {
      customerEmail,
      customerCpf,
      planId,
      priceId,
      successUrl,
      cancelUrl
    } = options;

    // Buscar ou criar cliente no Stripe
    let stripeCustomer;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (customers.data.length > 0) {
      stripeCustomer = customers.data[0];
    } else {
      // Criar novo cliente no Stripe
      stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          cpf: customerCpf,
          plan_id: planId
        }
      });
    }

    // Determinar se é assinatura recorrente ou pagamento único
    const price = await stripe.prices.retrieve(priceId);
    const isRecurring = price.type === 'recurring';

    const sessionParams = {
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      mode: isRecurring ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        customer_cpf: customerCpf,
        plan_id: planId
      }
    };

    if (isRecurring) {
      // Assinatura recorrente
      sessionParams.line_items = [{
        price: priceId,
        quantity: 1
      }];
    } else {
      // Pagamento único
      sessionParams.line_items = [{
        price: priceId,
        quantity: 1
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    globalLogger.info('Checkout session criada', {
      sessionId: session.id,
      customerCpf: customerCpf.replace(/\d(?=\d{4})/g, '*'),
      planId
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    globalLogger.error('Erro ao criar checkout session', {
      error: error.message,
      customerCpf: options.customerCpf?.replace(/\d(?=\d{4})/g, '*')
    });
    return null;
  }
}

/**
 * Processa webhook do Stripe
 * @param {object} event - Evento do Stripe
 * @returns {Promise<object>} Resultado do processamento
 */
async function handleWebhookEvent(event) {
  if (!isConfigured()) {
    globalLogger.error('Tentativa de processar webhook sem Stripe configurado', {
      eventType: event?.type,
      eventId: event?.id
    });
    return { success: false, error: 'Stripe não configurado' };
  }

  // Log de segurança: registrar recebimento de evento crítico
  const criticalEvents = [
    'checkout.session.completed',
    'customer.subscription.deleted',
    'invoice.payment_failed',
    'account.updated'
  ];
  
  if (criticalEvents.includes(event.type)) {
    globalLogger.warn('Evento crítico do Stripe recebido', {
      type: event.type,
      id: event.id,
      timestamp: new Date().toISOString()
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        globalLogger.info('Processando checkout.session.completed', { eventId: event.id });
        return await handleCheckoutCompleted(event.data.object);
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        globalLogger.info('Processando subscription created/updated', { 
          eventId: event.id,
          type: event.type 
        });
        return await handleSubscriptionUpdated(event.data.object);
      
      case 'customer.subscription.deleted':
        globalLogger.warn('Processando subscription deleted', { eventId: event.id });
        return await handleSubscriptionDeleted(event.data.object);
      
      case 'invoice.payment_succeeded':
        globalLogger.info('Processando payment succeeded', { eventId: event.id });
        return await handlePaymentSucceeded(event.data.object);
      
      case 'invoice.payment_failed':
        globalLogger.warn('Processando payment failed', { eventId: event.id });
        return await handlePaymentFailed(event.data.object);
      
      // Eventos do Stripe Connect
      case 'account.updated':
        globalLogger.info('Processando account.updated (Connect)', { eventId: event.id });
        return await handleAccountUpdated(event.data.object);
      
      default:
        globalLogger.debug('Evento do Stripe não processado', { 
          type: event.type,
          eventId: event.id 
        });
        return { success: true, message: 'Evento não requer processamento' };
    }
  } catch (error) {
    globalLogger.error('Erro ao processar webhook do Stripe', {
      type: event.type,
      eventId: event.id,
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processa checkout.session.completed
 */
async function handleCheckoutCompleted(session) {
  try {
    const customerCpf = session.metadata?.customer_cpf;
    const planId = session.metadata?.plan_id;
    const barbershopAccountId = session.metadata?.barbershop_account_id; // Stripe Connect

    if (!customerCpf || !planId) {
      globalLogger.warn('Checkout session sem metadata necessária', {
        sessionId: session.id
      });
      return { success: false, error: 'Metadata ausente' };
    }

    // Buscar cliente no banco
    const customer = await getOrCreateCustomer(customerCpf);
    if (!customer) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Se for Stripe Connect, buscar barbershop_id
    let barbershopId = null;
    if (barbershopAccountId) {
      const { data: barbershop } = await supabaseAdmin
        .from('barbershops')
        .select('id')
        .eq('stripe_account_id', barbershopAccountId)
        .single();
      
      if (barbershop) {
        barbershopId = barbershop.id;
      }
    }

    // Se foi uma assinatura, buscar dados da assinatura
    if (session.mode === 'subscription' && session.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Buscar dados do plano
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      // Criar assinatura (com barbershop_id se Connect)
      const subscriptionData = {
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer,
        status: mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
      };
      
      if (barbershopId) {
        subscriptionData.barbershop_id = barbershopId;
      }
      
      const subscription = await createSubscription(customer.id, planId, subscriptionData);
      
      // Buscar invoice inicial da assinatura para registrar pagamento
      if (stripeSubscription.latest_invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice);
          
          if (invoice.paid && invoice.amount_paid > 0) {
            // Criar registro de pagamento inicial
            const { data: payment } = await supabaseAdmin
              .from('manual_payments')
              .insert({
                customer_id: customer.id,
                plan_id: planId,
                amount: invoice.amount_paid / 100,
                payment_date: new Date(invoice.created * 1000),
                confirmed_by: 'Stripe',
                status: 'confirmed',
                stripe_invoice_id: invoice.id
              })
              .select()
              .single();
            
            // Enviar notificações
            if (payment && plan) {
              await notifyPaymentConfirmed(customer, payment, plan);
            }
          }
        } catch (invoiceError) {
          globalLogger.warn('Erro ao buscar invoice inicial', {
            error: invoiceError.message,
            subscriptionId: stripeSubscription.id
          });
        }
      }
      
      return { success: true, subscriptionId: subscription?.id };
    }

    // Se foi pagamento único, criar assinatura manual
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      // Buscar dados do plano
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      // Criar pagamento manual
      const { data: payment } = await supabaseAdmin
        .from('manual_payments')
        .insert({
          customer_id: customer.id,
          plan_id: planId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          payment_date: new Date(),
          confirmed_by: 'Stripe',
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent
        })
        .select()
        .single();
      
      // Criar assinatura para plano único (com barbershop_id se Connect)
      const subscriptionData = {
        stripe_customer_id: session.customer,
        status: 'active'
      };
      
      if (barbershopId) {
        subscriptionData.barbershop_id = barbershopId;
      }
      
      const subscription = await createSubscription(customer.id, planId, subscriptionData);

      // Enviar notificações
      if (payment && plan) {
        await notifyPaymentConfirmed(customer, payment, plan);
      }

      return {
        success: true,
        subscriptionId: subscription?.id
      };
    }

    return { success: true };
  } catch (error) {
    globalLogger.error('Erro ao processar checkout completed', {
      error: error.message,
      sessionId: session.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processa customer.subscription.created/updated
 */
async function handleSubscriptionUpdated(stripeSubscription, customerId = null, planId = null) {
  try {
    // Buscar assinatura existente
    let subscription = await getSubscriptionByStripeId(stripeSubscription.id);

    // Se for Stripe Connect, tentar identificar barbershop_id pela subscription
    let barbershopId = null;
    if (stripeSubscription.application_fee_percent || stripeSubscription.transfer_data?.destination) {
      const connectAccountId = stripeSubscription.transfer_data?.destination;
      if (connectAccountId) {
        const { data: barbershop } = await supabaseAdmin
          .from('barbershops')
          .select('id')
          .eq('stripe_account_id', connectAccountId)
          .single();
        
        if (barbershop) {
          barbershopId = barbershop.id;
        }
      }
    }

    if (!subscription && customerId && planId) {
      // Criar nova assinatura
      const subscriptionData = {
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer,
        status: mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
      };
      
      if (barbershopId) {
        subscriptionData.barbershop_id = barbershopId;
      }
      
      subscription = await createSubscription(customerId, planId, subscriptionData);
    } else if (subscription) {
      // Atualizar assinatura existente
      const updateData = {
        status: mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
      };
      
      // Atualizar barbershop_id se não estiver definido e foi identificado
      if (barbershopId && !subscription.barbershop_id) {
        updateData.barbershop_id = barbershopId;
      }
      
      await updateSubscription(subscription.id, updateData);
      
      // Verificar e atualizar status da barbearia baseado no status da assinatura
      if (barbershopId) {
        await checkAndUpdateBarbershopStatus(barbershopId, updateData.status);
      }
    }

    return { success: true, subscriptionId: subscription?.id };
  } catch (error) {
    globalLogger.error('Erro ao processar subscription updated', {
      error: error.message,
      subscriptionId: stripeSubscription.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processa customer.subscription.deleted
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    const subscription = await getSubscriptionByStripeId(stripeSubscription.id);
    
    if (subscription) {
      await updateSubscription(subscription.id, {
        status: 'canceled'
      });
      
      // Se for Stripe Connect, verificar se deve suspender barbearia
      if (subscription.barbershop_id) {
        await checkAndUpdateBarbershopStatus(subscription.barbershop_id, 'canceled');
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
    }

    return { success: true };
  } catch (error) {
    globalLogger.error('Erro ao processar subscription deleted', {
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processa invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice) {
  try {
    globalLogger.info('Pagamento bem-sucedido', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    });

    // Se tem assinatura, buscar dados para notificação
    if (invoice.subscription) {
      const subscription = await getSubscriptionByStripeId(invoice.subscription);
      
      if (subscription) {
        // Atualizar status da assinatura para 'active' se estava 'past_due'
        if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          await updateSubscription(subscription.id, {
            status: 'active'
          });
        }
        
        // Se for Stripe Connect, verificar se deve reativar barbearia
        if (subscription.barbershop_id) {
          await checkAndUpdateBarbershopStatus(subscription.barbershop_id, 'active');
        }
        
        // Buscar dados do cliente e plano
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
        
        // Criar registro de pagamento
        const { data: payment } = await supabaseAdmin
          .from('manual_payments')
          .insert({
            customer_id: customer?.id,
            plan_id: subscription.plan_id,
            amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
            payment_date: new Date(invoice.created * 1000),
            confirmed_by: 'Stripe',
            status: 'confirmed',
            stripe_invoice_id: invoice.id
          })
          .select()
          .single();
        
        // Enviar notificações
        if (customer && plan && payment) {
          await notifyPaymentConfirmed(customer, payment, plan);
        }
      }
    }

    return { success: true };
  } catch (error) {
    globalLogger.error('Erro ao processar payment succeeded', {
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * Verifica e aplica suspensão/reativação de barbearia baseado no status da assinatura
 * @param {string} barbershopId - ID da barbearia
 * @param {string} subscriptionStatus - Status da assinatura
 * @returns {Promise<void>}
 */
async function checkAndUpdateBarbershopStatus(barbershopId, subscriptionStatus) {
  if (!barbershopId) return;

  try {
    // Buscar barbearia
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      globalLogger.warn('Barbearia não encontrada para atualização de status', {
        barbershopId
      });
      return;
    }

    // Buscar assinatura ativa ou past_due da barbearia
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .in('status', ['active', 'past_due', 'unpaid'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      // Sem assinatura, verificar se deve suspender
      if (barbershop.status === 'active') {
        await supabaseAdmin
          .from('barbershops')
          .update({ status: 'suspended' })
          .eq('id', barbershopId);
        
        globalLogger.info('Barbearia suspensa por falta de assinatura', {
          barbershopId
        });
      }
      return;
    }

    // Verificar se deve suspender (past_due há mais de 7 dias)
    const DAYS_TO_SUSPEND = parseInt(process.env.DAYS_TO_SUSPEND_BARBERSHOP || '7', 10);
    const now = new Date();
    
    // Calcular dias desde que a assinatura entrou em past_due
    // Usar current_period_end como referência (quando o período expirou)
    let daysSincePastDue = 0;
    if (subscription.status === 'past_due' && subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      daysSincePastDue = Math.floor((now - periodEnd) / (1000 * 60 * 60 * 24));
    } else if (subscription.status === 'unpaid') {
      // Se está unpaid, considerar como past_due há muito tempo
      daysSincePastDue = DAYS_TO_SUSPEND + 1;
    }

    if ((subscription.status === 'past_due' || subscription.status === 'unpaid') && daysSincePastDue >= DAYS_TO_SUSPEND) {
      // Suspender barbearia após X dias sem pagamento
      if (barbershop.status !== 'suspended') {
        await supabaseAdmin
          .from('barbershops')
          .update({ status: 'suspended' })
          .eq('id', barbershopId);
        
        globalLogger.warn('Barbearia suspensa por falta de pagamento', {
          barbershopId,
          daysSincePastDue,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        });
      }
    } else if (subscription.status === 'active' && barbershop.status === 'suspended') {
      // Reativar barbearia quando pagamento normalizar
      await supabaseAdmin
        .from('barbershops')
        .update({ status: 'active' })
        .eq('id', barbershopId);
      
      globalLogger.info('Barbearia reativada após pagamento normalizar', {
        barbershopId,
        subscriptionId: subscription.id
      });
    } else if (subscription.status === 'canceled' && barbershop.status === 'active') {
      // Suspender se assinatura foi cancelada
      await supabaseAdmin
        .from('barbershops')
        .update({ status: 'suspended' })
        .eq('id', barbershopId);
      
      globalLogger.info('Barbearia suspensa por cancelamento de assinatura', {
        barbershopId,
        subscriptionId: subscription.id
      });
    }
  } catch (error) {
    globalLogger.error('Erro ao verificar status da barbearia', {
      error: error.message,
      barbershopId
    });
  }
}

/**
 * Processa invoice.payment_failed
 */
async function handlePaymentFailed(invoice) {
  try {
    // Atualizar status da assinatura
    if (invoice.subscription) {
      const subscription = await getSubscriptionByStripeId(invoice.subscription);
      if (subscription) {
        await updateSubscription(subscription.id, {
          status: 'past_due'
        });
        
        // Se for Stripe Connect, verificar se deve suspender barbearia
        if (subscription.barbershop_id) {
          await checkAndUpdateBarbershopStatus(subscription.barbershop_id, 'past_due');
          
          globalLogger.warn('Pagamento falhou para assinatura Connect', {
            subscriptionId: subscription.id,
            barbershopId: subscription.barbershop_id,
            invoiceId: invoice.id
          });
        }
      }
    }

    globalLogger.warn('Pagamento falhou', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    });

    return { success: true };
  } catch (error) {
    globalLogger.error('Erro ao processar payment failed', {
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processa account.updated (Stripe Connect)
 * Atualiza status de onboarding da barbearia
 */
async function handleAccountUpdated(account) {
  try {
    // Buscar barbearia pela conta Stripe
    const { data: barbershop, error: barbershopError } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .eq('stripe_account_id', account.id)
      .single();

    if (barbershopError || !barbershop) {
      globalLogger.warn('Conta Stripe Connect não encontrada no banco', {
        accountId: account.id
      });
      return { success: true, message: 'Conta não encontrada no banco' };
    }

    // Verificar status de onboarding
    const onboardingCompleted = account.details_submitted && account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // Atualizar status no banco
    const updateData = {
      stripe_onboarding_completed: onboardingCompleted,
    };

    // Atualizar status da barbearia baseado no onboarding
    if (onboardingCompleted && payoutsEnabled) {
      if (barbershop.status === 'pending') {
        updateData.status = 'active';
      }
    } else if (!onboardingCompleted && barbershop.status === 'active') {
      // Se onboarding foi revertido, marcar como pending
      updateData.status = 'pending';
    }

    const { error: updateError } = await supabaseAdmin
      .from('barbershops')
      .update(updateData)
      .eq('id', barbershop.id);

    if (updateError) {
      globalLogger.error('Erro ao atualizar status da barbearia', {
        error: updateError.message,
        barbershopId: barbershop.id
      });
      return { success: false, error: updateError.message };
    }

    globalLogger.info('Status da conta Stripe Connect atualizado', {
      accountId: account.id,
      barbershopId: barbershop.id,
      onboardingCompleted,
      payoutsEnabled,
      status: updateData.status
    });

    return { success: true, barbershopId: barbershop.id };
  } catch (error) {
    globalLogger.error('Erro ao processar account updated', {
      error: error.message,
      accountId: account.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Mapeia status do Stripe para status do banco
 */
function mapStripeStatus(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'unpaid': 'unpaid',
    'trialing': 'trialing',
    'incomplete': 'unpaid',
    'incomplete_expired': 'canceled'
  };

  return statusMap[stripeStatus] || 'unpaid';
}

/**
 * Busca assinatura no Stripe
 */
async function getStripeSubscription(stripeSubscriptionId) {
  if (!isConfigured()) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (error) {
    globalLogger.error('Erro ao buscar assinatura no Stripe', {
      error: error.message,
      subscriptionId: stripeSubscriptionId
    });
    return null;
  }
}

module.exports = {
  isConfigured,
  createCheckoutSession,
  handleWebhookEvent,
  getStripeSubscription,
  mapStripeStatus
};

