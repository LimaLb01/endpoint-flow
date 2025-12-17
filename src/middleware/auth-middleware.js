/**
 * Middleware de Autenticação JWT
 * Verifica token JWT nas requisições
 */

const { verifyToken } = require('../services/auth-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * Middleware para verificar autenticação JWT
 */
function requireAuth(req, res, next) {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  // Obter token do header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('Tentativa de acesso sem token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autenticação necessário'
    });
  }

  // Extrair token (formato: "Bearer {token}")
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
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token inválido ou expirado'
    });
  }

  // Adicionar dados do usuário à requisição
  req.user = decoded;
  
  logger.debug('Usuário autenticado', {
    userId: decoded.id,
    email: decoded.email,
    path: req.path
  });

  next();
}

/**
 * Middleware opcional de autenticação (não bloqueia se não tiver token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const decoded = verifyToken(parts[1]);
      if (decoded) {
        req.user = decoded;
      }
    }
  }
  
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};

