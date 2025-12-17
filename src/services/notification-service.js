/**
 * Serviço de Notificações
 * Envia notificações por WhatsApp e Email para clientes
 */

const { globalLogger } = require('../utils/logger');
const { sendFlowMessage } = require('./whatsapp-service');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Envia notificação por WhatsApp
 * @param {string} phoneNumber - Número de telefone (formato: 5511999999999)
 * @param {string} message - Mensagem a ser enviada
 * @returns {Promise<boolean>} true se enviado com sucesso
 */
async function sendWhatsAppNotification(phoneNumber, message) {
  try {
    // TODO: Implementar envio de mensagem WhatsApp
    // Por enquanto, apenas log
    globalLogger.info('Notificação WhatsApp (simulada)', {
      phone: phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3'),
      message: message.substring(0, 50) + '...'
    });
    
    // Em produção, usar WhatsApp Business API para enviar mensagem
    // await sendWhatsAppMessage(phoneNumber, message);
    
    return true;
  } catch (error) {
    globalLogger.error('Erro ao enviar notificação WhatsApp', {
      error: error.message,
      phone: phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3')
    });
    return false;
  }
}

/**
 * Envia notificação por Email
 * @param {string} email - Email do destinatário
 * @param {string} subject - Assunto do email
 * @param {string} htmlBody - Corpo do email em HTML
 * @returns {Promise<boolean>} true se enviado com sucesso
 */
async function sendEmailNotification(email, subject, htmlBody) {
  try {
    // TODO: Implementar envio de email
    // Por enquanto, apenas log
    globalLogger.info('Notificação Email (simulada)', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      subject
    });
    
    // Em produção, usar serviço de email (SendGrid, AWS SES, etc.)
    // await sendEmail(email, subject, htmlBody);
    
    return true;
  } catch (error) {
    globalLogger.error('Erro ao enviar notificação Email', {
      error: error.message,
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });
    return false;
  }
}

/**
 * Notifica cliente sobre pagamento confirmado
 * @param {object} customer - Dados do cliente
 * @param {object} payment - Dados do pagamento
 * @param {object} plan - Dados do plano
 */
async function notifyPaymentConfirmed(customer, payment, plan) {
  const logger = globalLogger.child({ 
    customerId: customer.id,
    paymentId: payment.id 
  });

  try {
    const planName = plan?.name || 'Plano';
    const amount = parseFloat(payment.amount || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    // Mensagem WhatsApp
    const whatsappMessage = `✅ Pagamento Confirmado!\n\n` +
      `Olá ${customer.name || 'Cliente'}!\n\n` +
      `Seu pagamento de ${amount} foi confirmado com sucesso.\n\n` +
      `Plano: ${planName}\n` +
      `Data: ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}\n\n` +
      `Sua assinatura está ativa! 🎉\n\n` +
      `Obrigado por fazer parte do Clube CODE!`;

    // Email HTML
    const emailSubject = `Pagamento Confirmado - Clube CODE`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f9f506; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f8f5; }
          .button { display: inline-block; padding: 12px 24px; background: #f9f506; color: #181811; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customer.name || 'Cliente'}</strong>!</p>
            <p>Seu pagamento foi confirmado com sucesso.</p>
            <ul>
              <li><strong>Valor:</strong> ${amount}</li>
              <li><strong>Plano:</strong> ${planName}</li>
              <li><strong>Data:</strong> ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}</li>
            </ul>
            <p>Sua assinatura está ativa! 🎉</p>
            <p>Obrigado por fazer parte do <strong>Clube CODE</strong>!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar notificações
    const results = await Promise.allSettled([
      customer.phone ? sendWhatsAppNotification(customer.phone, whatsappMessage) : Promise.resolve(false),
      customer.email ? sendEmailNotification(customer.email, emailSubject, emailBody) : Promise.resolve(false)
    ]);

    logger.info('Notificações de pagamento enviadas', {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    });

    return {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    };
  } catch (error) {
    logger.error('Erro ao enviar notificações de pagamento', {
      error: error.message
    });
    return { whatsapp: false, email: false };
  }
}

/**
 * Notifica cliente sobre assinatura prestes a vencer
 * @param {object} customer - Dados do cliente
 * @param {object} subscription - Dados da assinatura
 * @param {object} plan - Dados do plano
 */
async function notifySubscriptionExpiring(customer, subscription, plan) {
  const logger = globalLogger.child({ 
    customerId: customer.id,
    subscriptionId: subscription.id 
  });

  try {
    const planName = plan?.name || 'Plano';
    const expiryDate = new Date(subscription.current_period_end);
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    // Mensagem WhatsApp
    const whatsappMessage = `⏰ Assinatura Vencendo em Breve!\n\n` +
      `Olá ${customer.name || 'Cliente'}!\n\n` +
      `Sua assinatura do ${planName} está prestes a vencer.\n\n` +
      `Data de vencimento: ${expiryDate.toLocaleDateString('pt-BR')}\n` +
      `Faltam ${daysUntilExpiry} dia(s)\n\n` +
      `Renove agora para continuar aproveitando os benefícios do Clube CODE! 🎉`;

    // Email HTML
    const emailSubject = `Sua Assinatura Vence em Breve - Clube CODE`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f9f506; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f8f5; }
          .button { display: inline-block; padding: 12px 24px; background: #f9f506; color: #181811; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Assinatura Vencendo em Breve!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customer.name || 'Cliente'}</strong>!</p>
            <p>Sua assinatura está prestes a vencer.</p>
            <ul>
              <li><strong>Plano:</strong> ${planName}</li>
              <li><strong>Data de vencimento:</strong> ${expiryDate.toLocaleDateString('pt-BR')}</li>
              <li><strong>Faltam:</strong> ${daysUntilExpiry} dia(s)</li>
            </ul>
            <p>Renove agora para continuar aproveitando os benefícios do <strong>Clube CODE</strong>! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar notificações
    const results = await Promise.allSettled([
      customer.phone ? sendWhatsAppNotification(customer.phone, whatsappMessage) : Promise.resolve(false),
      customer.email ? sendEmailNotification(customer.email, emailSubject, emailBody) : Promise.resolve(false)
    ]);

    logger.info('Notificações de vencimento enviadas', {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    });

    return {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    };
  } catch (error) {
    logger.error('Erro ao enviar notificações de vencimento', {
      error: error.message
    });
    return { whatsapp: false, email: false };
  }
}

/**
 * Notifica cliente sobre assinatura cancelada
 * @param {object} customer - Dados do cliente
 * @param {object} subscription - Dados da assinatura
 * @param {object} plan - Dados do plano
 */
async function notifySubscriptionCanceled(customer, subscription, plan) {
  const logger = globalLogger.child({ 
    customerId: customer.id,
    subscriptionId: subscription.id 
  });

  try {
    const planName = plan?.name || 'Plano';

    // Mensagem WhatsApp
    const whatsappMessage = `ℹ️ Assinatura Cancelada\n\n` +
      `Olá ${customer.name || 'Cliente'}!\n\n` +
      `Sua assinatura do ${planName} foi cancelada.\n\n` +
      `Você ainda pode aproveitar os benefícios até o final do período pago.\n\n` +
      `Para reativar, entre em contato conosco!`;

    // Email HTML
    const emailSubject = `Assinatura Cancelada - Clube CODE`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f8f5; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f8f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ℹ️ Assinatura Cancelada</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customer.name || 'Cliente'}</strong>!</p>
            <p>Sua assinatura do <strong>${planName}</strong> foi cancelada.</p>
            <p>Você ainda pode aproveitar os benefícios até o final do período pago.</p>
            <p>Para reativar, entre em contato conosco!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar notificações
    const results = await Promise.allSettled([
      customer.phone ? sendWhatsAppNotification(customer.phone, whatsappMessage) : Promise.resolve(false),
      customer.email ? sendEmailNotification(customer.email, emailSubject, emailBody) : Promise.resolve(false)
    ]);

    logger.info('Notificações de cancelamento enviadas', {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    });

    return {
      whatsapp: results[0].status === 'fulfilled' && results[0].value,
      email: results[1].status === 'fulfilled' && results[1].value
    };
  } catch (error) {
    logger.error('Erro ao enviar notificações de cancelamento', {
      error: error.message
    });
    return { whatsapp: false, email: false };
  }
}

module.exports = {
  sendWhatsAppNotification,
  sendEmailNotification,
  notifyPaymentConfirmed,
  notifySubscriptionExpiring,
  notifySubscriptionCanceled
};

