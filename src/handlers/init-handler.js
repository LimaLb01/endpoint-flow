/**
 * Handler para inicialização do Flow (INIT)
 */

const { getServicesForFlow } = require('../config/services');

/**
 * Processa requisição de inicialização do Flow
 * @returns {object} Resposta com lista de serviços
 */
async function handleInit() {
  console.log('🚀 Inicializando Flow...');
  
  return {
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      services: getServicesForFlow()
    }
  };
}

module.exports = {
  handleInit
};

