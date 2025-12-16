/**
 * Middleware para validar assinatura de requisições
 */

const { isRequestSignatureValid } = require('../utils/crypto-utils');

/**
 * Middleware para validar assinatura da requisição
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware
 */
function signatureValidationMiddleware(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.APP_SECRET;
  
  // Log detalhado
  console.log('🔍 Signature Middleware - Headers:', Object.keys(req.headers || {}));
  console.log('🔍 Signature Middleware - Tem signature?', !!signature);
  console.log('🔍 Signature Middleware - Tem APP_SECRET?', !!appSecret);
  
  // Se não tem APP_SECRET configurado, pula validação
  if (!appSecret) {
    console.log('⚠️ Validação de assinatura desativada (APP_SECRET não configurado)');
    return next();
  }
  
  // Se não tem assinatura, pula validação (pode ser requisição não criptografada)
  if (!signature) {
    console.log('⚠️ Sem assinatura na requisição - continuando');
    return next();
  }
  
  try {
    // Validar assinatura
    const isValid = isRequestSignatureValid(req.body, signature, appSecret);
    
    if (!isValid) {
      console.warn('⚠️ Assinatura inválida (continuando mesmo assim para debug)');
      // Não bloquear por enquanto - apenas logar
      // return res.status(432).json({ error: 'Invalid signature' });
    } else {
      console.log('✅ Assinatura validada');
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro ao validar assinatura:', error.message);
    console.error('❌ Stack:', error.stack);
    // Continuar mesmo com erro (para debug)
    next();
  }
}

module.exports = {
  signatureValidationMiddleware
};

