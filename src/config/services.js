/**
 * Configuração de Serviços da Barbearia
 * Pode ser movido para banco de dados no futuro
 */

const SERVICES = [
  { 
    id: 'corte_masculino', 
    title: 'Corte Masculino', 
    description: 'R$ 45 • 45 min', 
    price: 45, 
    duration: 45 
  },
  { 
    id: 'barba', 
    title: 'Barba', 
    description: 'R$ 35 • 30 min', 
    price: 35, 
    duration: 30 
  },
  { 
    id: 'corte_barba', 
    title: 'Corte + Barba', 
    description: 'R$ 70 • 1h15', 
    price: 70, 
    duration: 75 
  },
  { 
    id: 'corte_infantil', 
    title: 'Corte Infantil', 
    description: 'R$ 40 • 30 min', 
    price: 40, 
    duration: 30 
  },
  { 
    id: 'pigmentacao', 
    title: 'Pigmentação', 
    description: 'R$ 50 • 45 min', 
    price: 50, 
    duration: 45 
  }
];

/**
 * Busca um serviço por ID
 * @param {string} serviceId - ID do serviço
 * @returns {object|null} Serviço encontrado ou null
 */
function getServiceById(serviceId) {
  return SERVICES.find(s => s.id === serviceId) || SERVICES[0];
}

/**
 * Retorna todos os serviços formatados para o Flow
 * @returns {Array} Lista de serviços formatados
 */
function getServicesForFlow() {
  return SERVICES.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description
  }));
}

module.exports = {
  SERVICES,
  getServiceById,
  getServicesForFlow
};

