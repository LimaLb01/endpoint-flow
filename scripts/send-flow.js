/**
 * Script para enviar WhatsApp Flow
 * Uso: node scripts/send-flow.js <numero_telefone> [flow_id]
 * Exemplo: node scripts/send-flow.js 888145740552051
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configurações
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;

// Flow ID padrão (pode ser sobrescrito)
const DEFAULT_FLOW_ID = process.env.WHATSAPP_FLOW_ID || '1402764508143842';

// Nota: As variáveis de ambiente são opcionais se passadas como parâmetros

// Obter parâmetros da linha de comando
const phoneNumber = process.argv[2];
const flowId = process.argv[3] || DEFAULT_FLOW_ID;
const accessToken = process.argv[4] || ACCESS_TOKEN;
const phoneNumberId = process.argv[5] || PHONE_NUMBER_ID;

if (!phoneNumber) {
  console.error('❌ Erro: Número de telefone não fornecido!');
  console.error('');
  console.error('Uso: node scripts/send-flow.js <numero_telefone> [flow_id] [access_token] [phone_number_id]');
  console.error('');
  console.error('Exemplos:');
  console.error('  node scripts/send-flow.js 888145740552051');
  console.error('  node scripts/send-flow.js 888145740552051 1402764508143842');
  console.error('  node scripts/send-flow.js 888145740552051 1402764508143842 SEU_TOKEN SEU_PHONE_ID');
  process.exit(1);
}

if (!accessToken) {
  console.error('❌ Erro: Token de acesso não configurado!');
  console.error('   Configure WHATSAPP_ACCESS_TOKEN no .env ou passe como parâmetro');
  process.exit(1);
}

if (!phoneNumberId) {
  console.error('❌ Erro: Phone Number ID não configurado!');
  console.error('   Configure WHATSAPP_PHONE_NUMBER_ID no .env ou passe como parâmetro');
  process.exit(1);
}

// Formatar número de telefone (remover caracteres especiais)
const formattedPhone = phoneNumber.replace(/\D/g, '');

// Gerar flow_token único
const flowToken = `agendamento-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        flow_message_version: '3',
        flow_token: flowToken,
        flow_id: flowId,
        flow_cta: 'Agendar Horário',
        flow_action: 'navigate',
        flow_action_payload: {
          screen: 'WELCOME'
        }
      }
    }
  }
};

// Função para enviar mensagem
async function sendFlow() {
  try {
    console.log('📤 Enviando WhatsApp Flow...');
    console.log(`   📱 Para: ${formattedPhone}`);
    console.log(`   🆔 Flow ID: ${flowId}`);
    console.log(`   🎫 Flow Token: ${flowToken}`);
    console.log('');

    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
    
    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Flow enviado com sucesso!');
    console.log('');
    console.log('📋 Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log(`💬 Verifique o WhatsApp do número ${formattedPhone}`);

    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar Flow:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Erro: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   Erro de rede - nenhuma resposta recebida');
      console.error(error.message);
    } else {
      console.error('   Erro:', error.message);
    }
    
    process.exit(1);
  }
}

// Executar
sendFlow();

