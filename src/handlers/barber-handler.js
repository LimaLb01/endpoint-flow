/**
 * Handler para seleção de barbeiro
 * Nova ordem: CPF → Filial → Barbeiro → Serviço → Data → Hora
 */

const { getServicesForFlow } = require('../config/services');
const { getBarbersByBranch } = require('../config/branches');

/**
 * Processa seleção de barbeiro
 * @param {object} payload - Dados da requisição
 * @returns {object} Resposta com lista de serviços
 */
async function handleSelectBarber(payload) {
  const { selected_branch, selected_barber, client_cpf, has_plan, is_club_member } = payload;
  
  if (!selected_branch || !selected_barber) {
    return {
      version: '3.0',
      screen: 'BARBER_SELECTION',
      data: {
        error: true,
        error_message: 'Por favor, selecione um barbeiro'
      }
    };
  }
  
  // Busca barbeiros da filial para validar
  const barbers = getBarbersByBranch(selected_branch);
  const barber = barbers.find(b => b.id === selected_barber);
  
  if (!barber) {
    return {
      version: '3.0',
      screen: 'BARBER_SELECTION',
      data: {
        error: true,
        error_message: 'Barbeiro não encontrado'
      }
    };
  }
  
  // Busca serviços considerando plano/clube
  const services = getServicesForFlow(has_plan || false, is_club_member || false);
  
  return {
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      selected_branch: selected_branch,
      selected_barber: selected_barber,
      barber_name: barber.title,
      client_cpf: client_cpf,
      has_plan: has_plan || false,
      is_club_member: is_club_member || false,
      services: services
    }
  };
}

module.exports = {
  handleSelectBarber
};
