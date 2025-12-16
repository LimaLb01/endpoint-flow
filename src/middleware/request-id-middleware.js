/**
 * Middleware para gerar Request ID
 * Adiciona um UUID único a cada requisição para rastreamento
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware para gerar e adicionar Request ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware
 */
function requestIdMiddleware(req, res, next) {
  // Gerar UUID único para esta requisição
  const requestId = uuidv4();
  
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

