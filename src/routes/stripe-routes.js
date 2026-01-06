/**
 * Rotas para Webhook do Stripe
 * Recebe eventos do Stripe e processa pagamentos/assinaturas
 */

const express = require('express');
const router = express.Router();
const { handleWebhookEvent } = require('../services/stripe-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * POST /api/webhooks/stripe
 * Webhook do Stripe para receber eventos
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  // Verificar se Stripe está configurado
  if (!stripe || !stripeWebhookSecret) {
    logger.error('Webhook do Stripe recebido mas Stripe não está configurado', {
      hasStripe: !!stripe,
      hasWebhookSecret: !!stripeWebhookSecret,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    return res.status(503).json({
      error: 'Stripe não configurado'
    });
  }

  const sig = req.headers['stripe-signature'];

  // Validação de segurança: verificar se a assinatura está presente
  if (!sig) {
    logger.error('Tentativa de webhook sem assinatura Stripe', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      headers: Object.keys(req.headers)
    });
    return res.status(400).json({
      error: 'Assinatura do webhook não fornecida'
    });
  }

  let event;

  try {
    // Verificar assinatura do webhook (validação crítica de segurança)
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    
    logger.info('Assinatura do webhook Stripe validada com sucesso', {
      eventType: event.type,
      eventId: event.id
    });
  } catch (err) {
    // Log de segurança: tentativa de webhook com assinatura inválida
    logger.error('Erro ao verificar assinatura do webhook do Stripe', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      signatureLength: sig?.length || 0
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info('Webhook do Stripe recebido', {
    type: event.type,
    id: event.id
  });

  // Processar evento
  const result = await handleWebhookEvent(event);

  if (result.success) {
    logger.info('Webhook processado com sucesso', {
      type: event.type,
      result: result.message || 'OK'
    });
    return res.status(200).json({ received: true, result });
  } else {
    logger.error('Erro ao processar webhook', {
      type: event.type,
      error: result.error
    });
    return res.status(500).json({ received: true, error: result.error });
  }
});

module.exports = router;

