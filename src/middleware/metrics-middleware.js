/**
 * Middleware de Métricas
 * Mede tempo de resposta e registra requisições
 */

const { recordRequest } = require('../utils/metrics');

/**
 * Middleware para medir tempo de resposta e registrar métricas
 */
function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Interceptar o método res.json para medir tempo de resposta
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Determinar tipo da requisição
    let requestType = 'other';
    let actionType = null;
    let success = true;
    let errorType = null;
    
    // Tentar extrair informações do body ou decryptedData
    if (req.decryptedData) {
      requestType = req.decryptedData.action || 'other';
      actionType = req.decryptedData.data?.action_type || null;
      
      // Verificar se há erro na resposta
      if (data && typeof data === 'object') {
        if (data.error || data.data?.error) {
          success = false;
          errorType = 'validation';
        }
      }
    }
    
    // Registrar métricas
    recordRequest(requestType, actionType, responseTime, success, errorType);
    
    // Adicionar header com tempo de resposta
    res.set('X-Response-Time', `${responseTime}ms`);
    
    return originalJson(data);
  };
  
  // Interceptar res.send também
  const originalSend = res.send.bind(res);
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    let requestType = 'other';
    if (req.decryptedData) {
      requestType = req.decryptedData.action || 'other';
    }
    
    recordRequest(requestType, null, responseTime, res.statusCode < 400, null);
    res.set('X-Response-Time', `${responseTime}ms`);
    
    return originalSend(data);
  };
  
  next();
}

module.exports = {
  metricsMiddleware
};

