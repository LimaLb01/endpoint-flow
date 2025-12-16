/**
 * Rotas do Webhook do WhatsApp Flow
 */

const express = require('express');
const router = express.Router();
const { handleFlowRequest } = require('../handlers/flow-router');
const { encryptResponse } = require('../utils/crypto-utils');
const { WHATSAPP_CONFIG } = require('../config/constants');
const bookingStorage = require('../storage/booking-storage');
const { handleConfirmBooking } = require('../handlers/booking-handler');
const { sendFlowAutomatically } = require('../services/whatsapp-service');

/**
 * GET /webhook/whatsapp-flow
 * Verificação do webhook pelo Meta Developers
 */
router.get('/whatsapp-flow', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificação do webhook
  if (mode && token) {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || WHATSAPP_CONFIG.DEFAULT_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Falha na verificação do webhook');
      return res.sendStatus(403);
    }
  }

  // Health check normal
  res.json({ status: 'healthy' });
});

/**
 * POST /webhook/whatsapp-flow
 * Endpoint principal do WhatsApp Flow
 */
router.post('/whatsapp-flow', async (req, res) => {
  console.log('='.repeat(60));
  console.log('📥 REQUISIÇÃO RECEBIDA - INÍCIO');
  console.log('='.repeat(60));
  console.log('📋 Method:', req.method);
  console.log('📋 URL:', req.url);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📋 Body type:', typeof req.body);
  console.log('📋 Body keys:', Object.keys(req.body || {}));
  
  try {
    const { decryptedData, shouldEncrypt, aesKeyBuffer, initialVectorBuffer } = req;
    
    // Health Check do WhatsApp Flow (ping)
    // Deve ser tratado ANTES de qualquer outra verificação
    if (decryptedData && decryptedData.action === 'ping') {
      console.log('🏥 Health Check (ping) recebido');
      const response = {
        version: decryptedData.version || '3.0',
        data: {
          status: 'active'
        }
      };
      
      // Se precisa criptografar, criptografar a resposta e enviar como texto plano
      if (shouldEncrypt && aesKeyBuffer && initialVectorBuffer) {
        console.log('🔐 Criptografando resposta do health check');
        const encrypted = encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
        console.log('✅ Resposta criptografada (Base64):', encrypted.substring(0, 50) + '...');
        // Resposta criptografada deve ser enviada como texto plano, não JSON
        res.set('Content-Type', 'text/plain; charset=UTF-8');
        return res.status(200).send(encrypted);
      }
      
      console.log('✅ Health check respondido (sem criptografia):', JSON.stringify(response, null, 2));
      return res.status(200).json(response);
    }
    
    console.log('📋 Dados recebidos (decryptedData):', JSON.stringify(decryptedData, null, 2));
    console.log('📋 Tipo de dados:', typeof decryptedData);
    console.log('📋 É null?', decryptedData === null);
    console.log('📋 É undefined?', decryptedData === undefined);
    console.log('📋 Tem action?', !!decryptedData?.action);
    console.log('📋 Action:', decryptedData?.action);
    console.log('📋 Tem object?', !!decryptedData?.object);
    console.log('📋 Object:', decryptedData?.object);
    console.log('📋 Tem version?', !!decryptedData?.version);
    console.log('📋 Version:', decryptedData?.version);
    console.log('📋 Tem screen?', !!decryptedData?.screen);
    console.log('📋 Screen:', decryptedData?.screen);

    // Verificar se é um webhook de mensagem (quando Flow é concluído)
    if (decryptedData.object === 'whatsapp_business_account' && decryptedData.entry) {
      console.log('🔍 Detectado webhook do WhatsApp Business Account');
      
      for (const entry of decryptedData.entry) {
        if (entry.changes) {
          console.log(`🔍 Processando ${entry.changes.length} mudança(s) no entry`);
          
          for (const change of entry.changes) {
            console.log(`🔍 Campo da mudança: ${change.field}`);
            
            // Webhook de flows - ignorar
            if (change.field === 'flows') {
              console.log('📨 Webhook de flows - ignorando');
              return res.status(200).json({ version: '3.0', data: {} });
            }
            
            // Webhook de status de mensagem - ignorar
            if (change.field === 'messages' && change.value?.statuses) {
              console.log('📨 Webhook de status de mensagem - ignorando');
              return res.status(200).json({});
            }
            
            // Webhook de mensagem recebida
            if (change.field === 'messages' && change.value?.messages) {
              console.log(`🔍 Processando ${change.value.messages.length} mensagem(ns) recebida(s)`);
              
              let messageProcessed = false;
              
              for (const message of change.value.messages) {
                const fromNumber = message.from;
                console.log(`🔍 Analisando mensagem - Tipo: ${message.type}, De: ${fromNumber}`);
                
                // Verificar se é uma resposta de Flow (nfm_reply quando Flow é concluído)
                if (message.type === 'interactive' && 
                    message.interactive?.type === 'nfm_reply' &&
                    message.interactive?.nfm_reply?.response_json) {
                  
                  console.log('='.repeat(60));
                  console.log('📨 WEBHOOK NFM_REPLY RECEBIDO - FLOW CONCLUÍDO');
                  console.log('='.repeat(60));
                  console.log('📋 Mensagem completa:', JSON.stringify(message, null, 2));
                  
                  try {
                    const bookingData = JSON.parse(message.interactive.nfm_reply.response_json);
                    console.log('📋 Dados do agendamento parseados:', JSON.stringify(bookingData, null, 2));
                    console.log(`🔍 Status: ${bookingData.status}, Booking ID: ${bookingData.booking_id}`);
                    
                    if (bookingData.status === 'confirmed' && bookingData.booking_id) {
                      console.log('✅ Processando confirmação de agendamento...');
                      
                      // Recuperar dados completos do armazenamento
                      console.log(`🔍 Buscando dados no armazenamento para booking_id: ${bookingData.booking_id}`);
                      const storedData = bookingStorage.get(bookingData.booking_id);
                      
                      if (storedData) {
                        console.log('📦 Dados completos recuperados do armazenamento:');
                        console.log(JSON.stringify(storedData, null, 2));
                        
                        const completeBookingData = {
                          ...storedData,
                          ...bookingData,
                          timestamp: undefined
                        };
                        
                        console.log('📤 Dados completos que serão enviados para handleConfirmBooking:');
                        console.log(JSON.stringify(completeBookingData, null, 2));
                        
                        console.log('🔄 Chamando handleConfirmBooking...');
                        const result = await handleConfirmBooking(completeBookingData);
                        console.log('✅ handleConfirmBooking concluído');
                        console.log('📋 Resultado:', result ? JSON.stringify(result, null, 2) : 'null (webhook)');
                        
                        bookingStorage.delete(bookingData.booking_id);
                        console.log('✅ Agendamento criado no Google Calendar!');
                        console.log('🗑️ Dados removidos do armazenamento');
                      } else {
                        console.warn(`⚠️ Dados não encontrados para booking_id: ${bookingData.booking_id}`);
                        console.warn('📊 Estatísticas do armazenamento:', JSON.stringify(bookingStorage.getStats(), null, 2));
                        console.warn('⚠️ Tentando criar agendamento com dados limitados do webhook...');
                        console.log('📤 Dados do webhook que serão enviados:', JSON.stringify(bookingData, null, 2));
                        
                        const result = await handleConfirmBooking(bookingData);
                        console.log('✅ handleConfirmBooking concluído (dados limitados)');
                        console.log('📋 Resultado:', result ? JSON.stringify(result, null, 2) : 'null (webhook)');
                      }
                    } else {
                      console.warn('⚠️ Webhook recebido sem booking_id ou status confirmed');
                      console.warn('📋 Dados recebidos:', JSON.stringify(bookingData, null, 2));
                    }
                  } catch (error) {
                    console.error('='.repeat(60));
                    console.error('❌ ERRO AO PROCESSAR WEBHOOK NFM_REPLY');
                    console.error('='.repeat(60));
                    console.error('❌ Erro:', error.message);
                    console.error('❌ Stack:', error.stack);
                    console.error('❌ Error name:', error.name);
                    console.error('❌ Error code:', error.code);
                    console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                    console.error('='.repeat(60));
                  }
                  
                  messageProcessed = true;
                  return res.status(200).json({});
                }
                
                // Verificar se é uma mensagem de texto normal (para enviar flow automaticamente)
                if (message.type === 'text' && message.text) {
                  console.log(`📨 Mensagem de texto recebida de ${fromNumber}: ${message.text.body}`);
                  
                  const AUTO_SEND_FLOW_NUMBER = process.env.AUTO_SEND_FLOW_NUMBER;
                  
                  console.log(`🔍 AUTO_SEND_FLOW_NUMBER configurado: ${AUTO_SEND_FLOW_NUMBER || '(vazio - enviar para qualquer número)'}`);
                  
                  const formattedFromNumber = fromNumber.replace(/\D/g, '');
                  const formattedAutoSendNumber = AUTO_SEND_FLOW_NUMBER ? AUTO_SEND_FLOW_NUMBER.replace(/\D/g, '') : '';
                  
                  console.log(`🔍 Comparando números - De: ${formattedFromNumber}, Configurado: ${formattedAutoSendNumber || '(qualquer número)'}`);
                  
                  if (!AUTO_SEND_FLOW_NUMBER || formattedFromNumber === formattedAutoSendNumber) {
                    console.log('🚀 Enviando flow automaticamente...');
                    
                    try {
                      await sendFlowAutomatically(fromNumber);
                      console.log('✅ Flow enviado automaticamente!');
                    } catch (error) {
                      console.error('❌ Erro ao enviar flow automaticamente:', error.message);
                      console.error('❌ Stack:', error.stack);
                    }
                  } else {
                    console.log(`⏭️ Número ${fromNumber} não está na lista de envio automático`);
                  }
                  
                  messageProcessed = true;
                  return res.status(200).json({});
                }
                
                console.log(`⚠️ Tipo de mensagem não tratado: ${message.type}`);
              }
              
              // Se processou mensagens, não continuar
              if (messageProcessed) {
                return;
              }
            }
          }
        }
      }
      
      // Se chegou aqui e é webhook de mensagem mas não processou nada, retornar vazio
      console.log('⚠️ Webhook de mensagem detectado mas nenhuma mensagem foi processada');
      return res.status(200).json({});
    }

    // Processar requisição do Flow (INIT, data_exchange, etc)
    console.log('🔄 Processando requisição do Flow...');
    console.log('🔍 Dados que serão passados para handleFlowRequest:', JSON.stringify(decryptedData, null, 2));
    
    let response;
    try {
      response = await handleFlowRequest(decryptedData);
      console.log('✅ handleFlowRequest executado com sucesso');
    } catch (error) {
      console.error('❌ Erro em handleFlowRequest:', error.message);
      console.error('❌ Stack:', error.stack);
      throw error;
    }

    console.log('📤 Resposta:', JSON.stringify(response, null, 2));
    
    // Log específico para CONFIRMATION screen
    if (response.screen === 'CONFIRMATION') {
      console.log('✅ Retornando para tela CONFIRMATION');
      console.log(`📊 Número de campos no data: ${Object.keys(response.data || {}).length}`);
      console.log(`📋 Campos: ${Object.keys(response.data || {}).join(', ')}`);
    }

    // Criptografar resposta se necessário
    if (shouldEncrypt && aesKeyBuffer && initialVectorBuffer) {
      const encryptedResponse = encryptResponse(
        response,
        aesKeyBuffer,
        initialVectorBuffer
      );
      res.set('Content-Type', 'text/plain');
      return res.send(encryptedResponse);
    }

    return res.json(response);

  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ ERRO NO WEBHOOK ROUTE');
    console.error('='.repeat(60));
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('='.repeat(60));
    
    // Retornar resposta válida para o WhatsApp mesmo em caso de erro
    // O WhatsApp espera uma resposta válida, não um erro HTTP
    res.status(200).json({ 
      version: '3.0',
      data: {
        error: true,
        error_message: 'Erro ao processar requisição'
      }
    });
  }
});

module.exports = router;

