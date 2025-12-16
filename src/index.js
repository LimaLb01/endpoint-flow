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

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Global
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar limite para requisições grandes

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
    console.error('❌ Erro ao verificar health status:', error);
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
  console.error('❌ Erro não tratado:', err.message);
  console.error('❌ Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
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
  console.log('='.repeat(50));
  console.log('🚀 WhatsApp Flow Endpoint - Barbearia');
  console.log('='.repeat(50));
  console.log(`📍 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Endpoint: http://localhost:${PORT}/webhook/whatsapp-flow`);
  console.log(`🔐 Criptografia: ${process.env.PRIVATE_KEY ? '✅ Ativa' : '❌ Desativada'}`);
  console.log(`🔑 Validação de assinatura: ${process.env.APP_SECRET ? '✅ Ativa' : '❌ Desativada'}`);
  console.log(`📅 Google Calendar: ${process.env.GOOGLE_CLIENT_EMAIL ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`📱 WhatsApp API: ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log('='.repeat(50));
});

module.exports = app;
