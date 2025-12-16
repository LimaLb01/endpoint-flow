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
const { createRequestLogger, globalLogger } = require('../utils/logger');

/**
 * GET /webhook/whatsapp-flow
 * Verificação do webhook pelo Meta Developers
 */
router.get('/whatsapp-flow', (req, res) => {
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificação do webhook
  if (mode && token) {
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || WHATSAPP_CONFIG.DEFAULT_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Webhook verificado com sucesso', { mode, challenge: challenge ? 'presente' : 'ausente' });
      return res.status(200).send(challenge);
    } else {
      logger.warn('Falha na verificação do webhook', { mode, tokenMatch: token === VERIFY_TOKEN });
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
  const logger = req.requestId ? createRequestLogger(req.requestId) : globalLogger;
  
  logger.request(req.method, req.url, {
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {}),
    hasDecryptedData: !!req.decryptedData,
    shouldEncrypt: req.shouldEncrypt || false
  });
  
  try {
    const { decryptedData, shouldEncrypt, aesKeyBuffer, initialVectorBuffer } = req;
    
    // Health Check do WhatsApp Flow (ping)
    // Deve ser tratado ANTES de qualquer outra verificação
    if (decryptedData && decryptedData.action === 'ping') {
      logger.info('Health Check (ping) recebido', { version: decryptedData.version });
      const response = {
        version: decryptedData.version || '3.0',
        data: {
          status: 'active'
        }
      };
      
      // Se precisa criptografar, criptografar a resposta e enviar como texto plano
      if (shouldEncrypt && aesKeyBuffer && initialVectorBuffer) {
        logger.debug('Criptografando resposta do health check');
        const encrypted = encryptResponse(response, aesKeyBuffer, initialVectorBuffer);
        logger.debug('Resposta criptografada', { encryptedLength: encrypted.length });
        // Resposta criptografada deve ser enviada como texto plano, não JSON
        res.set('Content-Type', 'text/plain; charset=UTF-8');
        return res.status(200).send(encrypted);
      }
      
      logger.info('Health check respondido', { response, encrypted: false });
      return res.status(200).json(response);
    }
    
    logger.debug('Dados recebidos', {
      action: decryptedData?.action,
      screen: decryptedData?.screen,
      version: decryptedData?.version,
      object: decryptedData?.object,
      hasData: !!decryptedData?.data
    });

    // Verificar se é um webhook de mensagem (quando Flow é concluído)
    if (decryptedData.object === 'whatsapp_business_account' && decryptedData.entry) {
      logger.info('Detectado webhook do WhatsApp Business Account', {
        entriesCount: decryptedData.entry.length
      });
      
      for (const entry of decryptedData.entry) {
        if (entry.changes) {
          logger.debug('Processando mudanças no entry', {
            changesCount: entry.changes.length
          });
          
          for (const change of entry.changes) {
            logger.debug('Campo da mudança', { field: change.field });
            
            // Webhook de flows - ignorar
            if (change.field === 'flows') {
              logger.debug('Webhook de flows - ignorando');
              return res.status(200).json({ version: '3.0', data: {} });
            }
            
            // Webhook de status de mensagem - ignorar
            if (change.field === 'messages' && change.value?.statuses) {
              logger.debug('Webhook de status de mensagem - ignorando');
              return res.status(200).json({});
            }
            
            // Webhook de mensagem recebida
            if (change.field === 'messages' && change.value?.messages) {
              logger.info('Processando mensagens recebidas', {
                messagesCount: change.value.messages.length
              });
              
              let messageProcessed = false;
              
              for (const message of change.value.messages) {
                const fromNumber = message.from;
                logger.debug('Analisando mensagem', {
                  type: message.type,
                  from: fromNumber
                });
                
                // Verificar se é uma resposta de Flow (nfm_reply quando Flow é concluído)
                if (message.type === 'interactive' && 
                    message.interactive?.type === 'nfm_reply' &&
                    message.interactive?.nfm_reply?.response_json) {
                  
                  logger.info('WEBHOOK NFM_REPLY RECEBIDO - FLOW CONCLUÍDO', {
                    from: fromNumber,
                    hasResponseJson: !!message.interactive.nfm_reply.response_json
                  });
                  
                  try {
                    const bookingData = JSON.parse(message.interactive.nfm_reply.response_json);
                    logger.info('Dados do agendamento parseados', {
                      status: bookingData.status,
                      bookingId: bookingData.booking_id
                    });
                    
                    if (bookingData.status === 'confirmed' && bookingData.booking_id) {
                      logger.info('Processando confirmação de agendamento', {
                        bookingId: bookingData.booking_id
                      });
                      
                      // Recuperar dados completos do armazenamento
                      const storedData = bookingStorage.get(bookingData.booking_id);
                      
                      if (storedData) {
                        logger.info('Dados completos recuperados do armazenamento', {
                          bookingId: bookingData.booking_id,
                          hasStoredData: true
                        });
                        
                        const completeBookingData = {
                          ...storedData,
                          ...bookingData,
                          timestamp: undefined
                        };
                        
                        logger.debug('Chamando handleConfirmBooking', {
                          bookingId: bookingData.booking_id
                        });
                        
                        const result = await handleConfirmBooking(completeBookingData);
                        
                        logger.info('handleConfirmBooking concluído', {
                          bookingId: bookingData.booking_id,
                          hasResult: !!result
                        });
                        
                        bookingStorage.delete(bookingData.booking_id);
                        logger.info('Agendamento criado no Google Calendar', {
                          bookingId: bookingData.booking_id
                        });
                      } else {
                        logger.warn('Dados não encontrados para booking_id', {
                          bookingId: bookingData.booking_id,
                          storageStats: bookingStorage.getStats()
                        });
                        
                        logger.warn('Tentando criar agendamento com dados limitados do webhook');
                        
                        const result = await handleConfirmBooking(bookingData);
                        logger.info('handleConfirmBooking concluído (dados limitados)', {
                          bookingId: bookingData.booking_id,
                          hasResult: !!result
                        });
                      }
                    } else {
                      logger.warn('Webhook recebido sem booking_id ou status confirmed', {
                        bookingData
                      });
                    }
                  } catch (error) {
                    logger.error('ERRO AO PROCESSAR WEBHOOK NFM_REPLY', error);
                  }
                  
                  messageProcessed = true;
                  return res.status(200).json({});
                }
                
                // Verificar se é uma mensagem de texto normal (para enviar flow automaticamente)
                if (message.type === 'text' && message.text) {
                  logger.info('Mensagem de texto recebida', {
                    from: fromNumber,
                    textLength: message.text.body?.length || 0
                  });
                  
                  const AUTO_SEND_FLOW_NUMBER = process.env.AUTO_SEND_FLOW_NUMBER;
                  const formattedFromNumber = fromNumber.replace(/\D/g, '');
                  const formattedAutoSendNumber = AUTO_SEND_FLOW_NUMBER ? AUTO_SEND_FLOW_NUMBER.replace(/\D/g, '') : '';
                  
                  if (!AUTO_SEND_FLOW_NUMBER || formattedFromNumber === formattedAutoSendNumber) {
                    logger.info('Enviando flow automaticamente', { to: fromNumber });
                    
                    try {
                      await sendFlowAutomatically(fromNumber);
                      logger.info('Flow enviado automaticamente', { to: fromNumber });
                    } catch (error) {
                      logger.error('Erro ao enviar flow automaticamente', error);
                    }
                  } else {
                    logger.debug('Número não está na lista de envio automático', {
                      from: fromNumber,
                      configured: AUTO_SEND_FLOW_NUMBER
                    });
                  }
                  
                  messageProcessed = true;
                  return res.status(200).json({});
                }
                
                logger.debug('Tipo de mensagem não tratado', { type: message.type });
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
      logger.warn('Webhook de mensagem detectado mas nenhuma mensagem foi processada');
      return res.status(200).json({});
    }

    // Processar requisição do Flow (INIT, data_exchange, etc)
    logger.flow(decryptedData?.action || 'unknown', decryptedData?.screen, {
      version: decryptedData?.version,
      actionType: decryptedData?.data?.action_type
    });
    
    let response;
    try {
      response = await handleFlowRequest(decryptedData, req.requestId);
      logger.info('handleFlowRequest executado com sucesso', {
        screen: response?.screen,
        hasData: !!response?.data
      });
    } catch (error) {
      logger.error('Erro em handleFlowRequest', error);
      throw error;
    }

    logger.response(200, {
      screen: response?.screen,
      dataFieldsCount: response?.data ? Object.keys(response.data).length : 0
    });
    
    // Log específico para CONFIRMATION screen
    if (response.screen === 'CONFIRMATION') {
      logger.info('Retornando para tela CONFIRMATION', {
        dataFields: Object.keys(response.data || {}),
        dataFieldsCount: Object.keys(response.data || {}).length
      });
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
    const { createFlowErrorResponse } = require('../middleware/error-handler');
    logger.error('ERRO NO WEBHOOK ROUTE', error);
    
    // Retornar resposta válida para o WhatsApp mesmo em caso de erro
    // O WhatsApp espera uma resposta válida, não um erro HTTP
    const errorResponse = createFlowErrorResponse(error, req.requestId);
    res.status(200).json(errorResponse);
  }
});

module.exports = router;

