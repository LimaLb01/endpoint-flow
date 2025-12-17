/**
 * Rotas de Autenticação
 * Login e gerenciamento de sessão
 */

const express = require('express');
const router = express.Router();
const { login } = require('../services/auth-service');
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * POST /api/auth/login
 * Autentica usuário e retorna token JWT
 */
router.post('/login', async (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const { email, password } = req.body;
    
    // Validar campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Tentar fazer login
    const result = await login(email, password);
    
    if (!result) {
      logger.warn('Tentativa de login falhou', {
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }
    
    logger.info('Login realizado com sucesso', {
      userId: result.user.id
    });
    
    return res.json(result);
    
  } catch (error) {
    logger.error('Erro ao processar login', {
      error: error.message
    });
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar o login'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verifica se um token é válido
 */
router.post('/verify', async (req, res) => {
  const { verifyToken } = require('../services/auth-service');
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        valid: false,
        error: 'Token não fornecido'
      });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        valid: false,
        error: 'Formato de token inválido'
      });
    }
    
    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        valid: false,
        error: 'Token inválido ou expirado'
      });
    }
    
    return res.json({
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });
    
  } catch (error) {
    logger.error('Erro ao verificar token', {
      error: error.message
    });
    return res.status(500).json({
      valid: false,
      error: 'Erro ao verificar token'
    });
  }
});

module.exports = router;

