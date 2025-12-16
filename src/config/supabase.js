/**
 * Configuração do Cliente Supabase
 * Gerencia conexão com o banco de dados Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const { globalLogger } = require('../utils/logger');

// Verificar se as variáveis estão configuradas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  globalLogger.warn('⚠️ Variáveis do Supabase não configuradas. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
}

/**
 * Cliente Supabase para operações públicas (anon key)
 * Use para operações que não requerem privilégios administrativos
 */
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

/**
 * Cliente Supabase para operações administrativas (service_role key)
 * Use apenas no backend, nunca exponha esta chave no frontend
 */
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

/**
 * Verifica se o Supabase está configurado
 * @returns {boolean}
 */
function isConfigured() {
  return supabase !== null;
}

/**
 * Verifica se o Supabase Admin está configurado
 * @returns {boolean}
 */
function isAdminConfigured() {
  return supabaseAdmin !== null;
}

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured,
  isAdminConfigured
};

