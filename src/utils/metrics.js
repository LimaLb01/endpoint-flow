/**
 * Sistema de Métricas e Monitoramento
 * Rastreia uso, performance e estatísticas da aplicação
 */

/**
 * Store de métricas em memória
 */
const metrics = {
  // Contadores de requisições
  requests: {
    total: 0,
    byType: {
      INIT: 0,
      data_exchange: 0,
      nfm_reply: 0,
      ping: 0,
      other: 0
    },
    byActionType: {
      SELECT_SERVICE: 0,
      SELECT_DATE: 0,
      SELECT_BARBER: 0,
      SELECT_TIME: 0,
      SUBMIT_DETAILS: 0,
      CONFIRM_BOOKING: 0,
      other: 0
    },
    byStatus: {
      success: 0,
      error: 0,
      timeout: 0
    }
  },
  
  // Métricas de tempo de resposta
  responseTime: {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
    average: 0,
    p50: [],
    p95: [],
    p99: []
  },
  
  // Contadores de agendamentos
  bookings: {
    total: 0,
    successful: 0,
    failed: 0,
    byService: {},
    byBarber: {}
  },
  
  // Métricas de erros
  errors: {
    total: 0,
    byType: {},
    byCode: {}
  },
  
  // Métricas de cache
  cache: {
    hits: 0,
    misses: 0
  },
  
  // Timestamp de início
  startTime: Date.now()
};

/**
 * Registra uma requisição
 * @param {string} type - Tipo da requisição (INIT, data_exchange, etc)
 * @param {string} actionType - Tipo de ação (SELECT_SERVICE, etc)
 * @param {number} responseTime - Tempo de resposta em ms
 * @param {boolean} success - Se a requisição foi bem-sucedida
 * @param {string} errorType - Tipo de erro (se houver)
 */
function recordRequest(type, actionType = null, responseTime = 0, success = true, errorType = null) {
  // Contador total
  metrics.requests.total++;
  
  // Contador por tipo
  if (metrics.requests.byType[type] !== undefined) {
    metrics.requests.byType[type]++;
  } else {
    metrics.requests.byType.other++;
  }
  
  // Contador por action_type
  if (actionType) {
    if (metrics.requests.byActionType[actionType] !== undefined) {
      metrics.requests.byActionType[actionType]++;
    } else {
      metrics.requests.byActionType.other++;
    }
  }
  
  // Contador por status
  if (success) {
    metrics.requests.byStatus.success++;
  } else if (errorType === 'timeout') {
    metrics.requests.byStatus.timeout++;
  } else {
    metrics.requests.byStatus.error++;
  }
  
  // Métricas de tempo de resposta
  if (responseTime > 0) {
    metrics.responseTime.total += responseTime;
    metrics.responseTime.count++;
    metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
    metrics.responseTime.average = metrics.responseTime.total / metrics.responseTime.count;
    
    // Manter últimas 1000 respostas para percentis
    metrics.responseTime.p50.push(responseTime);
    if (metrics.responseTime.p50.length > 1000) {
      metrics.responseTime.p50.shift();
    }
    
    metrics.responseTime.p95.push(responseTime);
    if (metrics.responseTime.p95.length > 1000) {
      metrics.responseTime.p95.shift();
    }
    
    metrics.responseTime.p99.push(responseTime);
    if (metrics.responseTime.p99.length > 1000) {
      metrics.responseTime.p99.shift();
    }
  }
}

/**
 * Registra um agendamento
 * @param {boolean} success - Se o agendamento foi criado com sucesso
 * @param {string} serviceId - ID do serviço
 * @param {string} barberId - ID do barbeiro
 */
function recordBooking(success, serviceId = null, barberId = null) {
  metrics.bookings.total++;
  
  if (success) {
    metrics.bookings.successful++;
  } else {
    metrics.bookings.failed++;
  }
  
  if (serviceId) {
    metrics.bookings.byService[serviceId] = (metrics.bookings.byService[serviceId] || 0) + 1;
  }
  
  if (barberId) {
    metrics.bookings.byBarber[barberId] = (metrics.bookings.byBarber[barberId] || 0) + 1;
  }
}

/**
 * Registra um erro
 * @param {string} errorType - Tipo do erro
 * @param {string} errorCode - Código do erro
 */
function recordError(errorType, errorCode = null) {
  metrics.errors.total++;
  
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
  
  if (errorCode) {
    metrics.errors.byCode[errorCode] = (metrics.errors.byCode[errorCode] || 0) + 1;
  }
}

/**
 * Registra hit/miss do cache
 * @param {boolean} hit - Se foi cache hit
 */
function recordCache(hit) {
  if (hit) {
    metrics.cache.hits++;
  } else {
    metrics.cache.misses++;
  }
}

/**
 * Calcula percentil de um array ordenado
 * @param {Array<number>} values - Array de valores
 * @param {number} percentile - Percentil (0-100)
 * @returns {number} Valor do percentil
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

/**
 * Obtém todas as métricas
 * @returns {object} Objeto com todas as métricas
 */
function getMetrics() {
  const uptime = Date.now() - metrics.startTime;
  
  return {
    uptime: {
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000),
      days: Math.floor(uptime / 86400000),
      formatted: formatUptime(uptime)
    },
    requests: {
      total: metrics.requests.total,
      byType: { ...metrics.requests.byType },
      byActionType: { ...metrics.requests.byActionType },
      byStatus: { ...metrics.requests.byStatus },
      successRate: metrics.requests.total > 0
        ? ((metrics.requests.byStatus.success / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    responseTime: {
      average: Math.round(metrics.responseTime.average),
      min: metrics.responseTime.min === Infinity ? 0 : metrics.responseTime.min,
      max: metrics.responseTime.max,
      p50: calculatePercentile(metrics.responseTime.p50, 50),
      p95: calculatePercentile(metrics.responseTime.p95, 95),
      p99: calculatePercentile(metrics.responseTime.p99, 99),
      count: metrics.responseTime.count
    },
    bookings: {
      total: metrics.bookings.total,
      successful: metrics.bookings.successful,
      failed: metrics.bookings.failed,
      successRate: metrics.bookings.total > 0
        ? ((metrics.bookings.successful / metrics.bookings.total) * 100).toFixed(2) + '%'
        : '0%',
      byService: { ...metrics.bookings.byService },
      byBarber: { ...metrics.bookings.byBarber }
    },
    errors: {
      total: metrics.errors.total,
      byType: { ...metrics.errors.byType },
      byCode: { ...metrics.errors.byCode }
    },
    cache: {
      hits: metrics.cache.hits,
      misses: metrics.cache.misses,
      hitRate: (metrics.cache.hits + metrics.cache.misses) > 0
        ? ((metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses)) * 100).toFixed(2) + '%'
        : '0%'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Formata uptime em string legível
 * @param {number} ms - Milissegundos
 * @returns {string} Uptime formatado
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Reseta todas as métricas
 */
function resetMetrics() {
  Object.keys(metrics).forEach(key => {
    if (key === 'startTime') {
      metrics.startTime = Date.now();
    } else if (typeof metrics[key] === 'object' && !Array.isArray(metrics[key])) {
      Object.keys(metrics[key]).forEach(subKey => {
        if (typeof metrics[key][subKey] === 'object' && !Array.isArray(metrics[key][subKey])) {
          Object.keys(metrics[key][subKey]).forEach(subSubKey => {
            if (Array.isArray(metrics[key][subKey][subSubKey])) {
              metrics[key][subKey][subSubKey] = [];
            } else if (typeof metrics[key][subKey][subSubKey] === 'number') {
              metrics[key][subKey][subSubKey] = 0;
            } else {
              metrics[key][subKey][subSubKey] = {};
            }
          });
        } else if (Array.isArray(metrics[key][subKey])) {
          metrics[key][subKey] = [];
        } else if (typeof metrics[key][subKey] === 'number') {
          metrics[key][subKey] = 0;
        } else {
          metrics[key][subKey] = {};
        }
      });
    } else if (Array.isArray(metrics[key])) {
      metrics[key] = [];
    } else if (typeof metrics[key] === 'number') {
      metrics[key] = 0;
    }
  });
  
  metrics.responseTime.min = Infinity;
  metrics.responseTime.max = 0;
}

module.exports = {
  recordRequest,
  recordBooking,
  recordError,
  recordCache,
  getMetrics,
  resetMetrics
};

