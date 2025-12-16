/**
 * Middleware para descriptografar requisições do WhatsApp Flow
 */

const { decryptRequest } = require('../utils/crypto-utils');

/**
 * Middleware para processar criptografia de requisições
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware
 */
function encryptionMiddleware(req, res, next) {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = req.body;
  
  // Log detalhado do body recebido
  console.log('🔍 Encryption Middleware - Body keys:', Object.keys(req.body || {}));
  console.log('🔍 Encryption Middleware - Tem encrypted_aes_key?', !!encrypted_aes_key);
  console.log('🔍 Encryption Middleware - Tem encrypted_flow_data?', !!encrypted_flow_data);
  console.log('🔍 Encryption Middleware - Tem initial_vector?', !!initial_vector);
  console.log('🔍 Encryption Middleware - Tem PRIVATE_KEY?', !!process.env.PRIVATE_KEY);
  
  // Se não tem criptografia, continua normalmente
  if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector || !process.env.PRIVATE_KEY) {
    req.decryptedData = req.body;
    req.shouldEncrypt = false;
    req.aesKeyBuffer = null;
    req.initialVectorBuffer = null;
    console.log('⚠️ Sem criptografia - modo teste');
    console.log('🔍 Body completo (sem criptografia):', JSON.stringify(req.body, null, 2));
    return next();
  }
  
  try {
    // Descriptografar
    const decryptResult = decryptRequest(
      req.body,
      process.env.PRIVATE_KEY,
      process.env.PASSPHRASE || ''
    );
    
    req.decryptedData = decryptResult.decryptedBody;
    req.aesKeyBuffer = decryptResult.aesKeyBuffer;
    req.initialVectorBuffer = decryptResult.initialVectorBuffer;
    req.shouldEncrypt = true;
    
    console.log('🔓 Dados descriptografados');
    console.log('🔍 Dados descriptografados:', JSON.stringify(req.decryptedData, null, 2));
    next();
  } catch (error) {
    console.error('❌ Erro ao descriptografar:', error.message);
    console.error('❌ Stack:', error.stack);
    // Não bloquear - retornar erro mas logar tudo
    res.status(400).json({ 
      error: 'Erro ao descriptografar requisição',
      message: error.message 
    });
  }
}

module.exports = {
  encryptionMiddleware
};

