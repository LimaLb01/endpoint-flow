/**
 * Serviço de Autenticação
 * Gerencia login e geração de tokens JWT
 */

const jwt = require('jsonwebtoken');
const { globalLogger } = require('../utils/logger');
const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');

// Secret para assinar tokens JWT (usar variável de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-mude-em-producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Usuários admin (temporário - substituir por tabela no banco depois)
 * TODO: Criar tabela `admin_users` no Supabase
 */
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@barbearia.com',
    password: 'admin123', // Em produção, usar hash bcrypt
    name: 'Administrador',
    role: 'admin'
  }
];

/**
 * Valida credenciais de login
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<object|null>} Dados do usuário ou null se inválido
 */
async function validateCredentials(email, password) {
  // Buscar usuário
  const user = ADMIN_USERS.find(u => u.email === email);
  
  if (!user) {
    globalLogger.warn('Tentativa de login com email inválido', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mascarar email
    });
    return null;
  }
  
  // Validar senha (em produção, usar bcrypt.compare)
  if (user.password !== password) {
    globalLogger.warn('Tentativa de login com senha inválida', {
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Gera token JWT para um usuário
 * @param {object} user - Dados do usuário
 * @returns {string} Token JWT
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verifica e decodifica um token JWT
 * @param {string} token - Token JWT
 * @returns {object|null} Dados decodificados ou null se inválido
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      globalLogger.warn('Token JWT expirado');
      return null;
    }
    if (error.name === 'JsonWebTokenError') {
      globalLogger.warn('Token JWT inválido');
      return null;
    }
    throw error;
  }
}

/**
 * Processa login
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<object|null>} Objeto com token e dados do usuário ou null
 */
async function login(email, password) {
  const user = await validateCredentials(email, password);
  
  if (!user) {
    return null;
  }
  
  const token = generateToken(user);
  
  globalLogger.info('Login realizado com sucesso', {
    userId: user.id,
    email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  });
  
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

module.exports = {
  login,
  verifyToken,
  generateToken,
  validateCredentials
};
