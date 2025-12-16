/**
 * Configuração de Serviços da Code Identidade Masculina
 * Suporta valores diferentes para clientes com plano/clube
 */

const SERVICES = [
  { 
    id: 'corte_masculino', 
    title: 'Corte Masculino', 
    description: 'A partir de R$ 0,00',
    price: 70.00, // Valor sem plano
    priceWithPlan: 0.00, // Valor com plano
    duration: 45,
    showForClub: false // Não é serviço exclusivo do clube
  },
  { 
    id: 'barba', 
    title: 'Barba', 
    description: 'A partir de R$ 65,00',
    price: 65.00,
    priceWithPlan: 65.00, // Mesmo valor
    duration: 30,
    showForClub: false
  },
  { 
    id: 'corte_clube', 
    title: 'Corte Clube', 
    description: 'R$ 0,00',
    price: 0.00,
    priceWithPlan: 0.00,
    duration: 45,
    showForClub: true // Apenas para membros do clube
  },
  { 
    id: 'barba_clube', 
    title: 'Barba Clube', 
    description: 'R$ 0,00',
    price: 0.00,
    priceWithPlan: 0.00,
    duration: 30,
    showForClub: true
  },
  { 
    id: 'pezinho_clube', 
    title: 'Pézinho Clube', 
    description: 'R$ 0,00',
    price: 0.00,
    priceWithPlan: 0.00,
    duration: 15,
    showForClub: true
  },
  { 
    id: 'corte_infantil', 
    title: 'Corte Infantil', 
    description: 'A partir de R$ 70,00',
    price: 70.00,
    priceWithPlan: 70.00,
    duration: 30,
    showForClub: false
  },
  { 
    id: 'terapia_capilar', 
    title: 'Terapia Capilar', 
    description: 'A partir de R$ 63,00',
    price: 70.00,
    priceWithPlan: 63.00,
    duration: 45,
    showForClub: false
  },
  { 
    id: 'sobrancelha', 
    title: 'Sobrancelha', 
    description: 'A partir de R$ 27,00',
    price: 30.00,
    priceWithPlan: 27.00,
    duration: 15,
    showForClub: false
  },
  { 
    id: 'hidratacao_capilar', 
    title: 'Hidratação Capilar', 
    description: 'A partir de R$ 27,00',
    price: 30.00,
    priceWithPlan: 27.00,
    duration: 30,
    showForClub: false
  },
  { 
    id: 'depilacao_orelha', 
    title: 'Depilação de Orelha', 
    description: 'A partir de R$ 27,00',
    price: 30.00,
    priceWithPlan: 27.00,
    duration: 15,
    showForClub: false
  },
  { 
    id: 'depilacao_nariz', 
    title: 'Depilação de Nariz', 
    description: 'A partir de R$ 27,00',
    price: 30.00,
    priceWithPlan: 27.00,
    duration: 15,
    showForClub: false
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
 * @param {boolean} hasPlan - Cliente tem plano?
 * @param {boolean} isClubMember - Cliente é membro do clube?
 * @returns {Array} Lista de serviços formatados
 */
function getServicesForFlow(hasPlan = false, isClubMember = false) {
  return SERVICES
    .filter(service => {
      // Se o serviço é exclusivo do clube, só mostra para membros
      if (service.showForClub && !isClubMember) {
        return false;
      }
      return true;
    })
    .map(service => {
      const price = hasPlan || isClubMember ? service.priceWithPlan : service.price;
      const priceText = price === 0 ? 'R$ 0,00' : `A partir de R$ ${price.toFixed(2).replace('.', ',')}`;
      
      return {
        id: service.id,
        title: service.title,
        description: priceText
      };
    });
}

/**
 * Retorna o preço de um serviço baseado no plano
 * @param {string} serviceId - ID do serviço
 * @param {boolean} hasPlan - Cliente tem plano?
 * @param {boolean} isClubMember - Cliente é membro do clube?
 * @returns {number} Preço do serviço
 */
function getServicePrice(serviceId, hasPlan = false, isClubMember = false) {
  const service = getServiceById(serviceId);
  if (!service) return 0;
  
  return hasPlan || isClubMember ? service.priceWithPlan : service.price;
}

module.exports = {
  SERVICES,
  getServiceById,
  getServicesForFlow,
  getServicePrice
};
