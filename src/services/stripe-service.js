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
    return { success: false, error: 'Stripe não configurado' };
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object);
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object);
      
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object);
      
      case 'invoice.payment_succeeded':
        return await handlePaymentSucceeded(event.data.object);
      
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event.data.object);
      
      default:
        globalLogger.debug('Evento do Stripe não processado', { type: event.type });
        return { success: true, message: 'Evento não requer processamento' };
    }
  } catch (error) {
    globalLogger.error('Erro ao processar webhook do Stripe', {
      type: event.type,
      error: error.message
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

    // Se foi uma assinatura, buscar dados da assinatura
    if (session.mode === 'subscription' && session.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Buscar dados do plano
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      // Criar assinatura
      const subscriptionResult = await handleSubscriptionUpdated(stripeSubscription, customer.id, planId);
      
<<<<<<< Current (Your changes)
=======
      // Buscar assinatura criada/atualizada
      let subscription = await getSubscriptionByStripeId(stripeSubscription.id);
      
>>>>>>> Incoming (Background Agent changes)
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
      
      return subscriptionResult;
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
      
      // Criar assinatura para plano único
      const subscription = await createSubscription(customer.id, planId, {
        stripe_customer_id: session.customer,
        status: 'active'
      });

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

    if (!subscription && customerId && planId) {
      // Criar nova assinatura
      subscription = await createSubscription(customerId, planId, {
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: stripeSubscription.customer,
        status: mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
      });
    } else if (subscription) {
      // Atualizar assinatura existente
      await updateSubscription(subscription.id, {
        status: mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false
      });
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

