/**
 * Middleware para gerar Request ID
 * Adiciona um UUID único a cada requisição para rastreamento
 * Usa crypto.randomUUID() nativo do Node.js 18+ (sem dependências externas)
 */

const crypto = require('crypto');

/**
 * Middleware para gerar e adicionar Request ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware
 */
function requestIdMiddleware(req, res, next) {
  // Gerar UUID único para esta requisição usando crypto nativo
  // crypto.randomUUID() está disponível no Node.js 18+
  const requestId = crypto.randomUUID();
  
  // Adicionar ao request para uso nos handlers
  req.requestId = requestId;
  
  // Adicionar ao header da resposta para rastreamento
  res.setHeader('X-Request-ID', requestId);
  
  // Continuar para o próximo middleware
  next();
}

module.exports = {
  requestIdMiddleware
};

