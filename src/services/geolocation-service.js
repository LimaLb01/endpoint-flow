/**
 * Serviço de Geolocalização por IP
 * Obtém informações de localização (cidade, região, país) baseado no endereço IP
 */

const axios = require('axios');
const { globalLogger } = require('../utils/logger');

/**
 * Obtém localização geográfica baseada no IP
 * @param {string} ip - Endereço IP do usuário
 * @returns {Promise<object>} Objeto com informações de localização
 */
async function getLocationByIP(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    // IP local ou privado
    return {
      city: null,
      region: null,
      country: null,
      countryCode: null,
      isLocal: true
    };
  }
  
  // Filtrar IPs conhecidos de infraestrutura (Railway, AWS, Google Cloud, etc.)
  // Esses IPs não representam a localização real do cliente
  const infrastructureIPs = [
    'railway', 'hillsboro', 'oregon', // Railway
    'aws', 'amazon', // AWS
    'google', 'gcp', // Google Cloud
    'azure', 'microsoft' // Azure
  ];
  
  const ipLower = ip.toLowerCase();
  if (infrastructureIPs.some(infra => ipLower.includes(infra))) {
    globalLogger.debug('IP de infraestrutura detectado, pulando geolocalização', { ip });
    return {
      city: null,
      region: null,
      country: null,
      countryCode: null,
      isLocal: true,
      isInfrastructure: true
    };
  }

  try {
    // Usar serviço gratuito ip-api.com (sem autenticação, limite de 45 req/min)
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        fields: 'status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query'
      },
      timeout: 5000, // 5 segundos de timeout
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (data.status === 'fail') {
      globalLogger.warn('Falha ao obter localização por IP', {
        ip,
        error: data.message
      });
      return {
        city: null,
        region: null,
        country: null,
        countryCode: null,
        error: data.message
      };
    }

    return {
      city: data.city || null,
      region: data.regionName || data.region || null,
      country: data.country || null,
      countryCode: data.countryCode || null,
      latitude: data.lat || null,
      longitude: data.lon || null,
      timezone: data.timezone || null,
      ip: data.query || ip
    };
  } catch (error) {
    globalLogger.warn('Erro ao obter localização por IP', {
      ip,
      error: error.message
    });
    return {
      city: null,
      region: null,
      country: null,
      countryCode: null,
      error: error.message
    };
  }
}

/**
 * Formata localização para exibição
 * @param {object} location - Objeto de localização
 * @returns {string} String formatada (ex: "São Paulo, SP, Brasil")
 */
function formatLocation(location) {
  if (!location || location.isLocal) {
    return 'Local';
  }

  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.region) parts.push(location.region);
  if (location.country) parts.push(location.country);

  return parts.length > 0 ? parts.join(', ') : 'Desconhecido';
}

module.exports = {
  getLocationByIP,
  formatLocation
};

