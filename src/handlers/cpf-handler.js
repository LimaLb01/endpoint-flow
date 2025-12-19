/**
 * Handler para coleta e verificação de CPF
 */

const { getBranchesForFlow } = require('../config/branches');
const { getActiveSubscriptionByCpf } = require('../services/subscription-service');
const { getOrCreateCustomer, getCustomerByCpf } = require('../services/customer-service');
const { globalLogger } = require('../utils/logger');

/**
 * Verifica se um CPF tem plano ativo
 * @param {string} cpf - CPF do cliente (apenas números)
 * @returns {Promise<boolean>} true se tem plano, false caso contrário
 */
async function hasPlan(cpf) {
  if (!cpf) return false;
  
  try {
    const result = await getActiveSubscriptionByCpf(cpf);
    return result.has_plan === true;
  } catch (error) {
    globalLogger.error('Erro ao verificar plano do CPF', {
      cpf: cpf.replace(/\d(?=\d{4})/g, '*'),
      error: error.message
    });
    return false;
  }
}

/**
 * Processa coleta de CPF
 * @param {object} payload - Dados da requisição
 * @returns {Promise<object>} Resposta com dados para verificação de plano
 */
async function handleCpfInput(payload) {
  const { client_cpf } = payload;
  
  if (!client_cpf) {
    return {
      version: '3.0',
      screen: 'CPF_INPUT',
      data: {
        error: true,
        error_message: 'Por favor, informe seu CPF'
      }
    };
  }
  
  // Remove formatação
  const cleanCpf = client_cpf.replace(/\D/g, '');
  
  // Validação básica de CPF (11 dígitos)
  if (cleanCpf.length !== 11) {
    return {
      version: '3.0',
      screen: 'CPF_INPUT',
      data: {
        error: true,
        error_message: 'CPF inválido. Por favor, informe um CPF válido com 11 dígitos.'
      }
    };
  }
  
  try {
    // Verifica se tem plano ativo no banco de dados
    const subscriptionInfo = await getActiveSubscriptionByCpf(cleanCpf);
    
    // Garante que o cliente existe no banco (cria se não existir)
    // Usar getCustomerByCpf primeiro para evitar criação desnecessária
    let customer = await getCustomerByCpf(cleanCpf);
    if (!customer) {
      // Só criar se realmente não existir
      customer = await getOrCreateCustomer(cleanCpf);
      if (customer) {
        globalLogger.info('Cliente criado durante flow', {
          cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*')
        });
      }
    }
    
    if (subscriptionInfo.has_plan) {
      // Cliente tem plano ativo, busca dados completos do cliente
      const customerData = await getCustomerByCpf(cleanCpf);
      const clientName = customerData?.name || '';
      
      // Montar mensagem de boas-vindas
      const welcomeMessage = clientName 
        ? `👋 Bem-vindo, ${clientName}!`
        : '📍 Selecione a Filial';
      
      // Cliente tem plano ativo, vai direto para seleção de filial
      return {
        version: '3.0',
        screen: 'BRANCH_SELECTION',
        data: {
          client_cpf: cleanCpf,
          client_name: clientName,
          has_plan: true,
          is_club_member: true,
          welcome_message: welcomeMessage,
          branches: getBranchesForFlow()
        }
      };
    } else {
      // Cliente não tem plano, oferece opção de ser do clube
      return {
        version: '3.0',
        screen: 'CLUB_OPTION',
        data: {
          client_cpf: cleanCpf,
          has_plan: false,
          is_club_member: false
        }
      };
    }
  } catch (error) {
    globalLogger.error('Erro ao processar CPF', {
      cpf: cleanCpf.replace(/\d(?=\d{4})/g, '*'),
      error: error.message
    });
    
    // Em caso de erro, oferece opção de clube (modo seguro)
    return {
      version: '3.0',
      screen: 'CLUB_OPTION',
      data: {
        client_cpf: cleanCpf,
        has_plan: false,
        is_club_member: false
      }
    };
  }
}

module.exports = {
  handleCpfInput,
  hasPlan
};

