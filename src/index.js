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
const stripeRoutes = require('./routes/stripe-routes');
const stripeConnectRoutes = require('./routes/stripe-connect-routes');
const adminRoutes = require('./routes/admin-routes');
const authRoutes = require('./routes/auth-routes');
const subscriptionRoutes = require('./routes/subscription-routes');
const { encryptionMiddleware } = require('./middleware/encryption-middleware');
const { signatureValidationMiddleware } = require('./middleware/signature-middleware');
const { requestIdMiddleware } = require('./middleware/request-id-middleware');
const { globalLogger } = require('./utils/logger');
const { errorHandlerMiddleware } = require('./middleware/error-handler');
const { generalRateLimiter } = require('./middleware/rate-limit-middleware');
const { metricsMiddleware } = require('./middleware/metrics-middleware');
const { getMetrics } = require('./utils/metrics');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Configuração do Express
// ============================================
// Confiar no proxy reverso (Railway, etc.) para obter IP real do cliente
app.set('trust proxy', true);

// ============================================
// Middleware Global
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar limite para requisições grandes

// Request ID middleware (deve ser aplicado antes de outros middlewares)
app.use(requestIdMiddleware);

// Metrics middleware (deve ser aplicado após request ID)
app.use(metricsMiddleware);

// Rate Limiting geral por IP (aplicado após request ID para ter logs)
app.use(generalRateLimiter);

// ============================================
// Swagger UI - Documentação da API
// ============================================

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Documentação interativa da API
 *     description: Interface Swagger UI para explorar e testar a API
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WhatsApp Flow API - Documentação',
  customfavIcon: '/favicon.ico'
}));

// ============================================
// Rotas de Health Check
// ============================================

const { getHealthStatus } = require('./services/health-service');

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check básico
 *     description: Retorna status básico da API (mantido para compatibilidade)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: WhatsApp Flow Endpoint - Barbearia
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
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
 * @swagger
 * /health:
 *   get:
 *     summary: Health check detalhado
 *     description: Retorna status detalhado de todos os serviços integrados (Google Calendar, WhatsApp API, etc.)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Sistema está saudável
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               status: healthy
 *               timestamp: "2025-12-16T18:00:00.000Z"
 *               services:
 *                 googleCalendar:
 *                   status: healthy
 *                   message: "Google Calendar API acessível"
 *                 whatsappAPI:
 *                   status: healthy
 *                   message: "WhatsApp API acessível"
 *                 encryption:
 *                   status: healthy
 *                   message: "Criptografia configurada"
 *                 signatureValidation:
 *                   status: healthy
 *                   message: "Validação de assinatura configurada"
 *                 bookingStorage:
 *                   status: healthy
 *                   message: "Storage de agendamentos funcionando"
 *       503:
 *         description: Sistema com problemas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
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

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Métricas e monitoramento
 *     description: Retorna métricas detalhadas do sistema (requisições, agendamentos, erros, cache, etc.)
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Métricas do sistema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 *             example:
 *               uptime: 3600
 *               requests:
 *                 total: 1000
 *                 byType:
 *                   INIT: 200
 *                   data_exchange: 800
 *                 byStatus:
 *                   success: 950
 *                   error: 50
 *               responseTime:
 *                 average: 150
 *                 min: 50
 *                 max: 500
 *                 p50: 120
 *                 p95: 300
 *                 p99: 450
 *               bookings:
 *                 total: 100
 *                 successful: 95
 *                 failed: 5
 *               errors:
 *                 total: 50
 *                 byType:
 *                   ValidationError: 30
 *                   CalendarError: 20
 *               cache:
 *                 hits: 800
 *                 misses: 200
 *                 hitRate: "80.00%"
 *       500:
 *         description: Erro ao obter métricas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/metrics', (req, res) => {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (error) {
    const requestLogger = req.requestId ? require('./utils/logger').createRequestLogger(req.requestId) : globalLogger;
    requestLogger.error('Erro ao obter métricas', error);
    res.status(500).json({
      error: 'Erro ao obter métricas',
      message: error.message
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
// Rotas do Stripe (Webhook)
// ============================================
// Webhook do Stripe precisa receber raw body para verificar assinatura
app.use('/api/webhooks', stripeRoutes);

// ============================================
// Rotas do Stripe Connect (Marketplace)
// ============================================
app.use('/api/stripe', stripeConnectRoutes);

// ============================================
// Rotas Públicas de Assinaturas (WhatsApp Flow)
// ============================================
app.use('/api', subscriptionRoutes);

// ============================================
// Rotas de Autenticação
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// Rotas Administrativas
// ============================================
app.use('/api/admin', adminRoutes);

// ============================================
// Tratamento de Erros
// ============================================

/**
 * Middleware de tratamento de erros centralizado
 */
app.use(errorHandlerMiddleware);

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

// Inicializar servidor
app.listen(PORT, () => {
  // Log simples primeiro para garantir que o servidor iniciou
  console.log(`✅ Servidor iniciado na porta ${PORT}`);
  
  // Depois usar o logger estruturado
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
