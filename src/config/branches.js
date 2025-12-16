/**
 * Configuração de Filiais da Code Identidade Masculina
 */

const BRANCHES = [
  {
    id: 'desvio_rizzo',
    title: 'Desvio Rizzo',
    address: 'Rua Nilceu de Melo Catarina, 2791',
    barbers: [
      { id: 'emanoel_pires', name: 'Emanoel Pires' },
      { id: 'mairon_oliveira', name: 'Mairon de Oliveira' },
      { id: 'eduardo_salas', name: 'Eduardo Salas Soares' },
      { id: 'sem_preferencia_dr', name: 'Sem preferência' }
    ]
  },
  {
    id: 'exposicao',
    title: 'Exposição',
    address: 'Rua Tronca, 1968',
    barbers: [
      { id: 'william_huff', name: 'William Huff' },
      { id: 'vinicius_branchieri', name: 'Vinícius Branchieri' },
      { id: 'elivelton_pedroso', name: 'Elivelton Pedroso' },
      { id: 'claire_borges', name: 'Claire Borges' },
      { id: 'rosane_maciel', name: 'Rosane Maciel' },
      { id: 'sem_preferencia_exp', name: 'Sem preferência' }
    ]
  },
  {
    id: 'santa_catarina',
    title: 'Santa Catarina',
    address: 'Rua Matteo Gianella, 1068',
    barbers: [
      { id: 'laura_gasparini', name: 'Laura Gasparini' },
      { id: 'guilherme_machado', name: 'Guilherme Machado' },
      { id: 'robson_rangel', name: 'Robson Rangel' },
      { id: 'lourenco_silva', name: 'Lourenço da Silva' },
      { id: 'henrique_santos', name: 'Henrique Santos' },
      { id: 'sem_preferencia_sc', name: 'Sem preferência' }
    ]
  }
];

/**
 * Busca uma filial por ID
 * @param {string} branchId - ID da filial
 * @returns {object|null} Filial encontrada ou null
 */
function getBranchById(branchId) {
  return BRANCHES.find(b => b.id === branchId) || null;
}

/**
 * Retorna todas as filiais formatadas para o Flow
 * @returns {Array} Lista de filiais formatadas
 */
function getBranchesForFlow() {
  return BRANCHES.map(b => ({
    id: b.id,
    title: b.title,
    description: b.address
  }));
}

/**
 * Retorna barbeiros de uma filial específica
 * @param {string} branchId - ID da filial
 * @returns {Array} Lista de barbeiros da filial
 */
function getBarbersByBranch(branchId) {
  const branch = getBranchById(branchId);
  if (!branch) return [];
  
  return branch.barbers.map(barber => ({
    id: barber.id,
    title: barber.name,
    description: 'Disponível',
    branch_id: branchId
  }));
}

/**
 * Retorna todos os barbeiros formatados (para compatibilidade)
 * @param {string} branchId - ID da filial (opcional)
 * @returns {Array} Lista de barbeiros
 */
function getAllBarbers(branchId = null) {
  if (branchId) {
    return getBarbersByBranch(branchId);
  }
  
  // Retorna todos os barbeiros de todas as filiais
  const allBarbers = [];
  BRANCHES.forEach(branch => {
    branch.barbers.forEach(barber => {
      allBarbers.push({
        id: barber.id,
        title: barber.name,
        description: 'Disponível',
        branch_id: branch.id
      });
    });
  });
  
  return allBarbers;
}

module.exports = {
  BRANCHES,
  getBranchById,
  getBranchesForFlow,
  getBarbersByBranch,
  getAllBarbers
};

