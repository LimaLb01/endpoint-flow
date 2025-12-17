/**
 * Serviço de Autenticação
 * Gerencia login, geração de tokens JWT e validação
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { globalLogger } = require('../utils/logger');
const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-em-producao';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Hash de senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Senha hasheada
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compara senha com hash
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash da senha
 * @returns {Promise<boolean>} true se senha corresponde
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Gera token JWT
 * @param {object} payload - Dados para incluir no token
 * @returns {string} Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verifica e decodifica token JWT
 * @param {string} token - Token JWT
 * @returns {object|null} Payload decodificado ou null se inválido
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Autentica usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<object|null>} Dados do usuário e token ou null
 */
async function authenticateUser(email, password) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    // Buscar usuário no banco (tabela de admins)
    // Por enquanto, usar usuário mock. Depois criar tabela de admins
    const { data: users, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !users) {
      // Se tabela não existir, usar autenticação mock temporária
      return authenticateMockUser(email, password);
    }

    // Verificar senha
    const passwordMatch = await comparePassword(password, users.password_hash);
    if (!passwordMatch) {
      return null;
    }

    // Gerar token
    const token = generateToken({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role || 'admin'
    });

    return {
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role || 'admin'
      },
      token
    };
  } catch (error) {
    globalLogger.error('Erro ao autenticar usuário', {
      error: error.message,
      email
    });
    return null;
  }
}

/**
 * Autenticação mock temporária (para desenvolvimento)
 * Remove quando tiver tabela de admins configurada
 */
async function authenticateMockUser(email, password) {
  // Credenciais mock (REMOVER EM PRODUÇÃO!)
  const mockUsers = [
    {
      email: 'admin@barbearia.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin'
    }
  ];

  const user = mockUsers.find(u => u.email === email);
  if (!user || user.password !== password) {
    return null;
  }

  const token = generateToken({
    id: 'mock-admin-id',
    email: user.email,
    name: user.name,
    role: user.role
  });

  return {
    user: {
      id: 'mock-admin-id',
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  };
}

/**
 * Cria usuário admin (para setup inicial)
 * @param {object} userData - Dados do usuário
 * @returns {Promise<object|null>} Usuário criado ou null
 */
async function createAdminUser(userData) {
  if (!isAdminConfigured()) {
    return null;
  }

  try {
    const { email, password, name, role = 'admin' } = userData;

    // Verificar se já existe
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return { error: 'Usuário já existe' };
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar usuário
    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    globalLogger.info('Usuário admin criado', {
      email,
      userId: data.id
    });

    return data;
  } catch (error) {
    globalLogger.error('Erro ao criar usuário admin', {
      error: error.message
    });
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateUser,
  createAdminUser
};

