/**
 * Handler para seleção de filial
 */

const { getBranchById, getBarbersByBranch } = require('../config/branches');

/**
 * Processa seleção de filial
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com lista de barbeiros da filial
 */
async function handleSelectBranch(payload) {
  const { selected_branch, client_cpf, has_plan, is_club_member } = payload;
  
  if (!selected_branch) {
    return {
      version: '3.0',
      screen: 'BRANCH_SELECTION',
      data: {
        error: true,
        error_message: 'Por favor, selecione uma filial'
      }
    };
  }
  
  const branch = getBranchById(selected_branch);
  
  if (!branch) {
    return {
      version: '3.0',
      screen: 'BRANCH_SELECTION',
      data: {
        error: true,
        error_message: 'Filial não encontrada'
      }
    };
  }
  
  // Busca barbeiros da filial selecionada
  const barbers = getBarbersByBranch(selected_branch);
  
  return {
    version: '3.0',
    screen: 'BARBER_SELECTION',
    data: {
      selected_branch: selected_branch,
      branch_name: branch.title,
      branch_address: branch.address,
      client_cpf: client_cpf,
      has_plan: has_plan || false,
      is_club_member: is_club_member || false,
      barbers: barbers
    }
  };
}

module.exports = {
  handleSelectBranch
};

