/**
 * WhatsApp Flow Endpoint - Barbearia
 * 
 * Servidor Express para integrar WhatsApp Flow com Google Calendar
 * Sistema de agendamento de barbearia via WhatsApp
 * 
 * @author Sistema de Agendamento
 * @version 2.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhook-routes');
const { encryptionMiddleware } = require('./middleware/encryption-middleware');
const { signatureValidationMiddleware } = require('./middleware/signature-middleware');
const { requestIdMiddleware } = require('./middleware/request-id-middleware');
const { globalLogger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Global
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar limite para requisições grandes

// Request ID middleware (deve ser aplicado antes de outros middlewares)
app.use(requestIdMiddleware);

// ============================================
// Rotas de Health Check
// ============================================

const { getHealthStatus } = require('./services/health-service');

/**
 * GET /
 * Health check básico (mantido para compatibilidade)
 */
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'WhatsApp Flow Endpoint - Barbearia',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health
 * Health check detalhado com status de todos os serviços
 */
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await getHealthStatus();
    
    // Retornar status HTTP apropriado
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    const requestLogger = req.requestId ? require('./utils/logger').createRequestLogger(req.requestId) : globalLogger;
    requestLogger.error('Erro ao verificar health status', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro ao verificar status do sistema'
    });
  }
});

// ============================================
// Rotas do Webhook
// ============================================

// Aplicar middlewares de segurança antes das rotas do webhook
app.use('/webhook', signatureValidationMiddleware);
app.use('/webhook', encryptionMiddleware);
app.use('/webhook', webhookRoutes);

// ============================================
// Tratamento de Erros
// ============================================

/**
 * Middleware de tratamento de erros
 */
app.use((err, req, res, next) => {
  const requestLogger = req.requestId ? require('./utils/logger').createRequestLogger(req.requestId) : globalLogger;
  requestLogger.error('Erro não tratado', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/**
 * Middleware para rotas não encontradas
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// ============================================
// Inicialização do Servidor
// ============================================

app.listen(PORT, () => {
  globalLogger.info('🚀 WhatsApp Flow Endpoint - Barbearia', {
    port: PORT,
    endpoint: `http://localhost:${PORT}/webhook/whatsapp-flow`,
    encryption: process.env.PRIVATE_KEY ? 'Ativa' : 'Desativada',
    signatureValidation: process.env.APP_SECRET ? 'Ativa' : 'Desativada',
    googleCalendar: process.env.GOOGLE_CLIENT_EMAIL ? 'Configurado' : 'Não configurado',
    whatsappAPI: process.env.WHATSAPP_ACCESS_TOKEN ? 'Configurado' : 'Não configurado',
    nodeVersion: process.version,
    timezone: process.env.TZ || 'UTC'
  });
});

module.exports = app;
