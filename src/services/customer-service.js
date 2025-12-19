/**
 * Serviço de Gerenciamento de Clientes
 * Gerencia operações CRUD de clientes no Supabase
 */

const { supabaseAdmin, isAdminConfigured } = require('../config/supabase');
const { globalLogger } = require('../utils/logger');

/**
 * Busca cliente por CPF
 * @param {string} cpf - CPF do cliente (apenas números)
 * @returns {Promise<object|null>} Cliente encontrado ou null
 */
async function getCustomerByCpf(cpf) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('cpf', cleanCpf)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Cliente não encontrado (não é erro)
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    globalLogger.error('Erro ao buscar cliente por CPF', {
      cpf: cpf.replace(/\d(?=\d{4})/g, '*'), // Mascarar CPF no log
      error: error.message
    });
    return null;
  }
}

/**
 * Cria um novo cliente
 * @param {object} customerData - Dados do cliente
 * @param {string} customerData.cpf - CPF (apenas números)
 * @param {string} [customerData.name] - Nome do cliente
 * @param {string} [customerData.email] - Email do cliente
 * @param {string} [customerData.phone] - Telefone do cliente
 * @returns {Promise<object|null>} Cliente criado ou null em caso de erro
 */
async function createCustomer(customerData) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    const { cpf, name, email, phone } = customerData;

    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    // Verifica se já existe
    const existing = await getCustomerByCpf(cleanCpf);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        cpf: cleanCpf,
        name: name || null,
        email: email || null,
        phone: phone || null
      })
      .select()
      .single();

    if (error) {
      // Se for erro de duplicata (constraint única), buscar o cliente existente
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        globalLogger.warn('Tentativa de criar cliente duplicado, buscando existente', {
          cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*')
        });
        const existing = await getCustomerByCpf(cleanCpf);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }

    globalLogger.info('Cliente criado com sucesso', {
      customerId: data.id,
      cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*')
    });

    return data;
  } catch (error) {
    globalLogger.error('Erro ao criar cliente', {
      error: error.message,
      cpf: customerData.cpf?.replace(/\d(?=\d{4})/g, '*')
    });
    return null;
  }
}

/**
 * Atualiza dados de um cliente
 * @param {string} customerId - ID do cliente (UUID)
 * @param {object} updates - Dados para atualizar
 * @returns {Promise<object|null>} Cliente atualizado ou null
 */
async function updateCustomer(customerId, updates) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return null;
  }

  try {
    // Se CPF está sendo atualizado, remove formatação
    if (updates.cpf) {
      updates.cpf = updates.cpf.replace(/\D/g, '');
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    globalLogger.error('Erro ao atualizar cliente', {
      customerId,
      error: error.message
    });
    return null;
  }
}

/**
 * Busca ou cria cliente por CPF
 * @param {string} cpf - CPF do cliente
 * @param {object} [additionalData] - Dados adicionais para criar se não existir
 * @returns {Promise<object|null>} Cliente encontrado ou criado
 */
async function getOrCreateCustomer(cpf, additionalData = {}) {
  // Primeiro, tenta buscar cliente existente
  const existing = await getCustomerByCpf(cpf);
  if (existing) {
    return existing;
  }

  // Se não existe, tenta criar
  // O createCustomer já trata duplicatas (race conditions)
  const created = await createCustomer({
    cpf,
    ...additionalData
  });

  // Se a criação falhou por duplicata, busca novamente
  if (!created) {
    const retry = await getCustomerByCpf(cpf);
    if (retry) {
      return retry;
    }
  }

  return created;
}

/**
 * Exclui um cliente
 * @param {string} customerId - ID do cliente (UUID)
 * @returns {Promise<boolean>} true se excluído com sucesso
 */
async function deleteCustomer(customerId) {
  if (!isAdminConfigured()) {
    globalLogger.error('Supabase Admin não configurado');
    return false;
  }

  try {
    // Verificar se o cliente tem assinaturas ativas
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('customer_id', customerId)
      .eq('status', 'active');

    if (subError) {
      throw subError;
    }

    if (subscriptions && subscriptions.length > 0) {
      globalLogger.warn('Tentativa de excluir cliente com assinaturas ativas', {
        customerId,
        activeSubscriptions: subscriptions.length
      });
      return false;
    }

    // Excluir cliente
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      throw error;
    }

    globalLogger.info('Cliente excluído com sucesso', {
      customerId
    });

    return true;
  } catch (error) {
    globalLogger.error('Erro ao excluir cliente', {
      customerId,
      error: error.message
    });
    return false;
  }
}

module.exports = {
  getCustomerByCpf,
  createCustomer,
  updateCustomer,
  getOrCreateCustomer,
  deleteCustomer
};

