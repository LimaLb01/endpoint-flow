/**
 * Serviço de integração com WhatsApp Business API
 */

const axios = require('axios');
const { WHATSAPP_CONFIG } = require('../config/constants');

/**
 * Envia Flow automaticamente quando recebe mensagem de texto
 * @param {string} toNumber - Número de destino
 * @returns {Promise<object>} Resposta da API
 */
async function sendFlowAutomatically(toNumber) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  const FLOW_ID = process.env.WHATSAPP_FLOW_ID || WHATSAPP_CONFIG.DEFAULT_FLOW_ID;
  
  console.log('🔑 Verificando credenciais...');
  console.log(`🔑 PHONE_NUMBER_ID: ${PHONE_NUMBER_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`🔑 ACCESS_TOKEN: ${ACCESS_TOKEN ? `✅ Configurado (${ACCESS_TOKEN.substring(0, 20)}...)` : '❌ Não configurado'}`);
  console.log(`🔑 FLOW_ID: ${FLOW_ID}`);
  
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID devem estar configurados');
  }
  
  // Formatar número de telefone
  const formattedPhone = toNumber.replace(/\D/g, '');
  console.log(`📱 Número formatado: ${formattedPhone}`);
  
  // Gerar flow_token único
  const flowToken = `agendamento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🎫 Flow token gerado: ${flowToken}`);
  
  // Payload da mensagem
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: {
        text: 'Olá! Agende seu horário na barbearia de forma rápida e prática. 🎯'
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: WHATSAPP_CONFIG.FLOW_MESSAGE_VERSION,
          flow_token: flowToken,
          flow_id: FLOW_ID,
          flow_cta: 'Agendar Horário',
          flow_action: 'navigate',
          flow_action_payload: {
            screen: 'WELCOME'
          }
        }
      }
    }
  };
  
  const url = `${WHATSAPP_CONFIG.API_URL}/${PHONE_NUMBER_ID}/messages`;
  console.log(`📤 URL da requisição: ${url}`);
  console.log(`📦 Payload: ${JSON.stringify(messagePayload, null, 2)}`);
  
  try {
    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  
    console.log(`✅ Flow enviado automaticamente para ${formattedPhone}`);
    console.log(`   🆔 Flow ID: ${FLOW_ID}`);
    console.log(`   🎫 Flow Token: ${flowToken}`);
    console.log(`   📋 Resposta: ${JSON.stringify(response.data, null, 2)}`);
  
    return response.data;
  } catch (error) {
    console.error('❌ Erro detalhado ao enviar flow:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Status Text: ${error.response?.statusText}`);
    console.error(`   Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    if (error.response?.status === 401) {
      throw new Error('Token de acesso inválido ou expirado. Gere um novo token em: https://developers.facebook.com/apps/[SEU_APP_ID]/whatsapp-business/wa-settings/');
    }
    
    throw error;
  }
}

module.exports = {
  sendFlowAutomatically
};

