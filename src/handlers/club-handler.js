/**
 * Handler para opção de clube
 */

const { getBranchesForFlow } = require('../config/branches');

/**
 * Processa escolha do cliente sobre ser do clube
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com dados para seleção de filial
 */
async function handleClubOption(payload) {
  const { client_cpf, wants_club } = payload;
  
  if (!client_cpf) {
    return {
      version: '3.0',
      screen: 'CLUB_OPTION',
      data: {
        error: true,
        error_message: 'CPF não encontrado. Por favor, tente novamente.'
      }
    };
  }
  
  // Se o cliente quer ser do clube, marca como membro
  // Caso contrário, continua sem plano
  const isClubMember = wants_club === true || wants_club === 'true';
  
  return {
    version: '3.0',
    screen: 'BRANCH_SELECTION',
    data: {
      client_cpf: client_cpf,
      has_plan: false,
      is_club_member: isClubMember,
      wants_club: isClubMember,
      branches: getBranchesForFlow()
    }
  };
}

module.exports = {
  handleClubOption
};

