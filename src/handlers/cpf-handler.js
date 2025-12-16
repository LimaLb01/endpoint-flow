/**
 * Handler para coleta e verificação de CPF
 */

const { getBranchesForFlow } = require('../config/branches');

// Mock temporário de CPFs com plano
// TODO: Substituir por consulta real à API quando disponível
const CPFS_WITH_PLAN = [
  '12345678900',
  '98765432100',
  '11122233344'
];

/**
 * Verifica se um CPF tem plano ativo
 * @param {string} cpf - CPF do cliente (apenas números)
 * @returns {boolean} true se tem plano, false caso contrário
 */
function hasPlan(cpf) {
  if (!cpf) return false;
  
  // Remove formatação do CPF
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Verifica no mock (substituir por consulta real)
  return CPFS_WITH_PLAN.includes(cleanCpf);
}

/**
 * Processa coleta de CPF
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para verificação de plano
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
  
  // Verifica se tem plano
  const hasActivePlan = hasPlan(cleanCpf);
  
  if (hasActivePlan) {
    // Cliente tem plano, vai direto para seleção de filial
    return {
      version: '3.0',
      screen: 'BRANCH_SELECTION',
      data: {
        client_cpf: cleanCpf,
        has_plan: true,
        is_club_member: true,
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
}

module.exports = {
  handleCpfInput,
  hasPlan
};

