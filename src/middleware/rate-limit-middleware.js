/**
 * Middleware de Rate Limiting
 * Protege contra abuso e DDoS
 */

const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * Store em memória para rate limiting por número de WhatsApp
 * Em produção, considerar usar Redis para distribuição
 */
const whatsappNumberStore = new Map();

/**
 * Limpar entradas antigas do store periodicamente
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutos
  
  for (const [key, value] of whatsappNumberStore.entries()) {
    if (now - value.firstRequest > maxAge) {
      whatsappNumberStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpar a cada 5 minutos

/**
 * Rate Limiter geral por IP
 * Limita todas as requisições do mesmo IP
 * Configurado para funcionar com trust proxy de forma segura
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP a cada 15 minutos
  message: 'Muitas requisições deste IP. Tente novamente mais tarde.',
  standardHeaders: true, // Retorna informações de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  // Configurar trust proxy de forma segura
  // Railway usa X-Forwarded-For, mas precisamos validar
  trustProxy: true,
  // Usar função customizada para obter IP de forma segura
  keyGenerator: (req) => {
    // Tentar obter IP real do header X-Forwarded-For (quando confiável)
    // Em Railway, o primeiro IP é o do cliente
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',').map(ip => ip.trim());
      // Pegar o primeiro IP (cliente real)
      return ips[0] || req.ip;
    }
    // Fallback para req.ip (já considera trust proxy)
    return req.ip;
  },
  handler: (req, res) => {
    const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
    logger.warn('Rate limit excedido por IP', {
      ip: req.ip,
      path: req.path
    });
    
    const error = new RateLimitError(
      'Muitas requisições. Tente novamente mais tarde.',
      Math.ceil(req.rateLimit.resetTime / 1000)
    );
    
    res.status(429).json({
      error: true,
      error_message: error.message,
      retry_after: error.retryAfter
    });
  },
  skip: (req) => {
    // Pular rate limiting em health checks
    return req.path === '/' || req.path === '/health';
  }
});

/**
 * Rate Limiter para endpoints críticos (ex: criação de agendamento)
 * Limites mais restritivos
 */
const criticalEndpointRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requisições por IP a cada 15 minutos
  message: 'Muitas requisições para este endpoint. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
    logger.warn('Rate limit excedido em endpoint crítico', {
      ip: req.ip,
      path: req.path
    });
    
    const error = new RateLimitError(
      'Muitas requisições. Por favor, aguarde alguns minutos antes de tentar novamente.',
      Math.ceil(req.rateLimit.resetTime / 1000)
    );
    
    res.status(429).json({
      error: true,
      error_message: error.message,
      retry_after: error.retryAfter
    });
  }
});

/**
 * Rate Limiter por número de WhatsApp
 * Limita requisições do mesmo número de telefone
 */
function whatsappNumberRateLimiter(req, res, next) {
  // Extrair número de WhatsApp dos dados descriptografados ou do webhook
  let phoneNumber = null;
  
  // Tentar extrair de diferentes fontes
  if (req.decryptedData?.data?.phone_number) {
    phoneNumber = req.decryptedData.data.phone_number;
  } else if (req.decryptedData?.data?.client_phone) {
    phoneNumber = req.decryptedData.data.client_phone;
  } else if (req.body?.phone_number) {
    phoneNumber = req.body.phone_number;
  } else if (req.decryptedData?.entry) {
    // Tentar extrair do webhook do WhatsApp
    for (const entry of req.decryptedData.entry || []) {
      if (entry.changes) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) {
            for (const message of change.value.messages || []) {
              if (message.from) {
                phoneNumber = message.from;
                break;
              }
            }
          }
          if (phoneNumber) break;
        }
      }
      if (phoneNumber) break;
    }
  }
  
  // Se não houver número, pular rate limiting por número (usar apenas por IP)
  if (!phoneNumber) {
    return next();
  }
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 20; // máximo 20 requisições por número a cada 15 minutos
  
  const key = `whatsapp:${phoneNumber}`;
  const record = whatsappNumberStore.get(key);
  
  if (!record) {
    // Primeira requisição deste número
    whatsappNumberStore.set(key, {
      firstRequest: now,
      requests: [now]
    });
    return next();
  }
  
  // Remover requisições antigas (fora da janela de tempo)
  record.requests = record.requests.filter(timestamp => now - timestamp < windowMs);
  
  if (record.requests.length >= maxRequests) {
    // Rate limit excedido
    const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
    logger.warn('Rate limit excedido por número de WhatsApp', {
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mascarar número para log
      requestCount: record.requests.length
    });
    
    const oldestRequest = Math.min(...record.requests);
    const resetTime = oldestRequest + windowMs;
    const retryAfter = Math.ceil((resetTime - now) / 1000);
    
    const error = new RateLimitError(
      'Muitas requisições deste número. Tente novamente mais tarde.',
      retryAfter
    );
    
    return res.status(429).json({
      error: true,
      error_message: error.message,
      retry_after: error.retryAfter
    });
  }
  
  // Adicionar requisição atual
  record.requests.push(now);
  whatsappNumberStore.set(key, record);
  
  next();
}

/**
 * Rate Limiter para webhook do WhatsApp Flow
 * Combina proteção por IP e por número
 */
function flowWebhookRateLimiter(req, res, next) {
  // Aplicar rate limiting por número de WhatsApp primeiro
  // Se não houver número, apenas continua (rate limiting por IP já foi aplicado globalmente)
  whatsappNumberRateLimiter(req, res, next);
}

module.exports = {
  generalRateLimiter,
  criticalEndpointRateLimiter,
  whatsappNumberRateLimiter,
  flowWebhookRateLimiter
};

