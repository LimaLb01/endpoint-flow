/**
 * Middleware de Autenticação JWT
 * Verifica token JWT nas requisições administrativas
 */

const { verifyToken } = require('../services/auth-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * Middleware para verificar autenticação JWT
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware
 */
function requireAuth(req, res, next) {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  // Extrair token do header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Tentativa de acesso sem token de autenticação', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autenticação necessário'
    });
  }
  
  // Formato esperado: "Bearer {token}"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('Formato de token inválido', {
      path: req.path
    });
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Formato de token inválido. Use: Bearer {token}'
    });
  }
  
  const token = parts[1];
  
  // Verificar token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    logger.warn('Token inválido ou expirado', {
      path: req.path
    });
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token inválido ou expirado'
    });
  }
  
  // Adicionar dados do usuário ao request
  req.user = decoded;
  
  logger.debug('Autenticação válida', {
    userId: decoded.id,
    email: decoded.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  });
  
  next();
}

module.exports = {
  requireAuth
};
