/**
 * Handler para inicialização do Flow (INIT)
 */

/**
 * Processa requisição de inicialização do Flow
 * @returns {object} Resposta com tela de CPF
 */
async function handleInit() {
  console.log('🚀 Inicializando Flow...');
  
  return {
    version: '3.0',
    screen: 'CPF_INPUT',
    data: {}
  };
}

module.exports = {
  handleInit
};

