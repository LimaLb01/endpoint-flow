/**
 * Utilitário para limpar placeholders não resolvidos
 * 
 * Quando o WhatsApp Flow envia placeholders literais (${data.field}),
 * este utilitário tenta resolvê-los usando dados anteriores
 */

/**
 * Limpa placeholders não resolvidos do payload
 * @param {object} payload - Payload com possíveis placeholders
 * @param {object} previousData - Dados anteriores para resolução
 * @returns {object} Payload limpo
 */
function cleanPlaceholders(payload, previousData = {}) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      // É um placeholder não resolvido
      // Tenta extrair o nome da variável e buscar no previousData
      const varName = value.replace(/\$\{([^}]+)\}/, '$1').split('.').pop();
      
      // Tenta buscar pelo nome completo primeiro, depois pelo nome da variável
      cleaned[key] = previousData[key] || previousData[varName] || null;
      
      if (cleaned[key]) {
        console.log(`✅ Placeholder ${value} resolvido para: ${cleaned[key]}`);
      } else {
        console.warn(`⚠️ Placeholder ${value} não pôde ser resolvido`);
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Verifica se um valor é um placeholder não resolvido
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se for placeholder
 */
function isPlaceholder(value) {
  return typeof value === 'string' && value.startsWith('${') && value.endsWith('}');
}

/**
 * Limpa múltiplos campos de placeholders
 * @param {object} data - Objeto com dados
 * @param {object} previousData - Dados anteriores
 * @returns {object} Dados limpos
 */
function cleanMultipleFields(data, previousData = {}) {
  const cleaned = { ...data };
  
  for (const [key, value] of Object.entries(cleaned)) {
    if (isPlaceholder(value)) {
      const varName = value.replace(/\$\{([^}]+)\}/, '$1').split('.').pop();
      cleaned[key] = previousData[key] || previousData[varName] || cleaned[key];
    }
  }
  
  return cleaned;
}

module.exports = {
  cleanPlaceholders,
  isPlaceholder,
  cleanMultipleFields
};

