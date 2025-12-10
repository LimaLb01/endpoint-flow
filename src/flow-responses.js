/**
 * Helpers para construir respostas do WhatsApp Flow
 */

/**
 * Constrói uma resposta padrão do Flow
 * @param {string} screen - Nome da próxima tela
 * @param {object} data - Dados para a tela
 * @param {string} version - Versão do Flow
 */
function buildFlowResponse(screen, data = {}, version = '3.0') {
  return {
    version,
    screen,
    data
  };
}

/**
 * Constrói uma resposta de erro
 */
function buildErrorResponse(message, version = '3.0') {
  return {
    version,
    data: {
      error: true,
      error_message: message
    }
  };
}

/**
 * Constrói uma resposta para fechar o Flow
 */
function buildCloseResponse(params = {}, version = '3.0') {
  return {
    version,
    screen: 'SUCCESS',
    data: {
      extension_message_response: {
        params
      }
    }
  };
}

/**
 * Formata data para exibição
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} Data formatada
 */
function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formata preço para exibição
 * @param {number} value - Valor em centavos ou reais
 * @returns {string} Preço formatado
 */
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

module.exports = {
  buildFlowResponse,
  buildErrorResponse,
  buildCloseResponse,
  formatDate,
  formatPrice
};

