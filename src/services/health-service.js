/**
 * Serviço de Health Check Detalhado
 * Verifica status de todas as dependências e serviços
 */

const { google } = require('googleapis');
const axios = require('axios');
const { WHATSAPP_CONFIG } = require('../config/constants');

/**
 * Verifica status do Google Calendar
 * @returns {Promise<object>} Status da conexão
 */
async function checkGoogleCalendar() {
  const status = {
    available: false,
    configured: false,
    error: null,
    details: {}
  };

  try {
    // Verificar se as credenciais estão configuradas
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      status.configured = false;
      status.error = 'Credenciais do Google Calendar não configuradas';
      return status;
    }

    status.configured = true;

    // Tentar inicializar autenticação
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Tentar fazer uma requisição simples (listar calendários)
    const calendarId = process.env.CALENDAR_LUCAS || 'primary';
    
    try {
      await calendar.calendars.get({
        calendarId
      });
      
      status.available = true;
      status.details = {
        calendarId,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL
      };
    } catch (error) {
      status.available = false;
      status.error = error.message || 'Erro ao acessar Google Calendar';
      status.details = {
        calendarId,
        errorCode: error.code,
        errorMessage: error.message
      };
    }

  } catch (error) {
    status.available = false;
    status.error = error.message || 'Erro ao inicializar Google Calendar';
  }

  return status;
}

/**
 * Verifica status do WhatsApp API
 * @returns {Promise<object>} Status da API
 */
async function checkWhatsAppAPI() {
  const status = {
    available: false,
    configured: false,
    error: null,
    details: {}
  };

  try {
    // Verificar se o token está configurado
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      status.configured = false;
      status.error = 'Token do WhatsApp não configurado';
      return status;
    }

    status.configured = true;

    // Verificar se Phone Number ID está configurado
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
      status.details.phoneNumberId = 'Não configurado';
    } else {
      status.details.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    }

    // Verificar formato básico do token (deve começar com EAAM ou similar)
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (token && token.length > 20) {
      // Token parece válido (formato básico)
      status.available = true;
      status.details = {
        ...status.details,
        tokenConfigured: true,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'Não configurado',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'Não configurado'
      };
    } else {
      status.available = false;
      status.error = 'Token do WhatsApp parece inválido (muito curto)';
    }
    
    // Opcional: Fazer verificação real da API (pode ser lento, então deixamos como opcional)
    // Se quiser verificação real, descomente o código abaixo:
    /*
    try {
      const response = await axios.get(
        `${WHATSAPP_CONFIG.API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'me'}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          },
          timeout: 5000
        }
      );

      status.available = true;
      status.details = {
        ...status.details,
        verified: true,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'N/A'
      };
    } catch (error) {
      status.available = false;
      
      if (error.response) {
        status.error = `Erro ${error.response.status}: ${error.response.data?.error?.message || error.message}`;
        status.details = {
          ...status.details,
          statusCode: error.response.status,
          errorCode: error.response.data?.error?.code
        };
      } else if (error.code === 'ECONNABORTED') {
        status.error = 'Timeout ao verificar WhatsApp API';
      } else {
        status.error = error.message || 'Erro ao verificar WhatsApp API';
      }
    }
    */

  } catch (error) {
    status.available = false;
    status.error = error.message || 'Erro ao verificar WhatsApp API';
  }

  return status;
}

/**
 * Verifica status da criptografia
 * @returns {object} Status da configuração
 */
function checkEncryption() {
  const hasPrivateKey = !!process.env.PRIVATE_KEY;
  const hasPublicKey = !!process.env.PUBLIC_KEY;
  const hasPassphrase = !!process.env.PASSPHRASE;

  return {
    enabled: hasPrivateKey,
    configured: hasPrivateKey,
    hasPublicKey,
    hasPassphrase,
    details: {
      keyType: hasPrivateKey ? 'RSA' : 'N/A',
      passphraseProtected: hasPassphrase
    }
  };
}

/**
 * Verifica status da validação de assinatura
 * @returns {object} Status da configuração
 */
function checkSignatureValidation() {
  const hasAppSecret = !!process.env.APP_SECRET;

  return {
    enabled: hasAppSecret,
    configured: hasAppSecret,
    details: {
      method: hasAppSecret ? 'HMAC-SHA256' : 'N/A'
    }
  };
}

/**
 * Verifica status do armazenamento de agendamentos
 * @returns {object} Status do armazenamento
 */
function checkBookingStorage() {
  try {
    const bookingStorage = require('../storage/booking-storage');
    const stats = bookingStorage.getStats();

    return {
      available: true,
      type: 'in-memory',
      details: {
        totalBookings: stats.total,
        activeBookings: stats.entries.length
      }
    };
  } catch (error) {
    return {
      available: false,
      error: error.message || 'Erro ao verificar armazenamento'
    };
  }
}

/**
 * Verifica status geral do sistema
 * @returns {Promise<object>} Status completo
 */
async function getHealthStatus() {
  const startTime = Date.now();

  // Executar verificações em paralelo (exceto Google Calendar que pode ser mais lento)
  const [
    googleCalendar,
    whatsappAPI,
    encryption,
    signature,
    storage
  ] = await Promise.all([
    checkGoogleCalendar(),
    checkWhatsAppAPI(),
    Promise.resolve(checkEncryption()),
    Promise.resolve(checkSignatureValidation()),
    Promise.resolve(checkBookingStorage())
  ]);

  const responseTime = Date.now() - startTime;

  // Determinar status geral
  const criticalServices = [googleCalendar, whatsappAPI];
  const allCriticalHealthy = criticalServices.every(service => 
    service.configured && service.available
  );

  const overallStatus = allCriticalHealthy ? 'healthy' : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    responseTime: `${responseTime}ms`,
    services: {
      googleCalendar: {
        name: 'Google Calendar',
        ...googleCalendar
      },
      whatsappAPI: {
        name: 'WhatsApp Business API',
        ...whatsappAPI
      },
      encryption: {
        name: 'Encryption',
        ...encryption
      },
      signatureValidation: {
        name: 'Signature Validation',
        ...signature
      },
      bookingStorage: {
        name: 'Booking Storage',
        ...storage
      }
    },
    environment: {
      nodeVersion: process.version,
      timezone: process.env.TZ || 'UTC',
      port: process.env.PORT || 3000
    }
  };
}

module.exports = {
  checkGoogleCalendar,
  checkWhatsAppAPI,
  checkEncryption,
  checkSignatureValidation,
  checkBookingStorage,
  getHealthStatus
};

