/**
 * Roteador principal do Flow
 * Gerencia o roteamento entre diferentes handlers baseado no action_type
 */

const { handleInit } = require('./init-handler');
const { handleCpfInput } = require('./cpf-handler');
const { handleClubOption } = require('./club-handler');
const { handleSelectBranch } = require('./branch-handler');
const { handleSelectBarber } = require('./barber-handler');
const { handleSelectService } = require('./service-handler');
const { handleSelectDate, setPreviousData: setDatePreviousData } = require('./date-handler');
const { handleSelectTime, setPreviousData: setTimePreviousData } = require('./time-handler');
const { handleSubmitDetails, setPreviousData: setDetailsPreviousData } = require('./details-handler');
const { handleConfirmBooking } = require('./booking-handler');
const { cleanPlaceholders } = require('../utils/placeholder-cleaner');
const { validateFlowRequest, validateByActionType } = require('../utils/validators');
const { globalLogger } = require('../utils/logger');
const { trackFlowInteraction } = require('../services/flow-tracking-service');
const { getLocationByIP } = require('../services/geolocation-service');

// Armazenamento de dados anteriores para resolução de placeholders
let previousFlowData = {};

/**
 * Processa requisições do Flow
 * @param {object} data - Dados da requisição
 * @param {object} requestInfo - Informações da requisição HTTP (req object)
 * @returns {Promise<object>} Resposta do Flow
 */
async function handleFlowRequest(data, requestId = null, requestInfo = null) {
  const logger = requestId ? require('../utils/logger').createRequestLogger(requestId) : globalLogger;
  
  // Validar estrutura básica da requisição
  const requestValidation = validateFlowRequest(data);
  if (!requestValidation.valid) {
    logger.error('Validação de requisição falhou', {
      error: requestValidation.error
    });
    return {
      version: '3.0',
      data: {
        error: true,
        error_message: requestValidation.error
      }
    };
  }
  
  const { action, screen, data: flowData, version, flow_token } = requestValidation.data;
  let payload = flowData || {};
  
  logger.flow(action, screen, {
    version,
    actionType: payload.action_type
  });
  
  // Adicionar flow_token ao payload
  if (flow_token) {
    payload.flow_token = flow_token;
  }
  
  // Limpar placeholders não resolvidos
  payload = cleanPlaceholders(payload, previousFlowData);
  
  // Atualizar dados anteriores
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && !(typeof value === 'string' && value.startsWith('${'))) {
      previousFlowData[key] = value;
    }
  }
  
  // Sincronizar dados anteriores com handlers (apenas os que ainda usam)
  setDatePreviousData(previousFlowData);
  setTimePreviousData(previousFlowData);
  setDetailsPreviousData(previousFlowData);
  
  const actionType = payload.action_type;

  // Health check do WhatsApp
  if (action === 'ping') {
    return { data: { status: 'active' } };
  }

  // INIT - Primeira chamada quando Flow é aberto
  if (action === 'INIT') {
    logger.info('Processando INIT - Inicializando Flow');
    const response = handleInit();
    
    // Obter localização geográfica e timestamp de acesso
    const accessTimestamp = new Date().toISOString();
    // Tentar obter IP real do cliente (Railway pode estar fazendo proxy)
    // x-forwarded-for pode conter múltiplos IPs: cliente,proxy1,proxy2
    const forwardedFor = requestInfo?.headers?.['x-forwarded-for'];
    let clientIP = null;
    
    if (forwardedFor) {
      // Pegar o primeiro IP da cadeia (cliente real)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      clientIP = ips[0];
      logger.debug('IPs em x-forwarded-for', { ips, selected: clientIP });
    } else {
      clientIP = requestInfo?.ip || 
                  requestInfo?.headers?.['x-real-ip'] ||
                  requestInfo?.connection?.remoteAddress ||
                  null;
    }
    
    logger.info('INIT - Capturando localização', {
      flow_token: flow_token,
      clientIP: clientIP,
      hasRequestInfo: !!requestInfo,
      headers: requestInfo?.headers ? Object.keys(requestInfo.headers) : []
    });
    
    // Registrar interação INIT primeiro
    trackFlowInteraction({
      flow_token: flow_token,
      action_type: 'INIT',
      screen: 'WELCOME',
      previous_screen: null,
      payload: {},
      metadata: {
        access_timestamp: accessTimestamp,
        client_ip: clientIP
      }
    }).then(async (initInteractionId) => {
      if (!initInteractionId) {
        logger.warn('Não foi possível obter ID da interação INIT');
        return;
      }
      
      // Obter localização de forma assíncrona e atualizar
      if (clientIP && !clientIP.startsWith('192.168.') && !clientIP.startsWith('10.') && 
          clientIP !== '::1' && clientIP !== '127.0.0.1') {
              try {
                logger.info('🌍 Buscando localização para IP', { ip: clientIP });
                const location = await getLocationByIP(clientIP);
                
                if (location && !location.isLocal) {
                  const { supabaseAdmin } = require('../config/supabase');
                  if (supabaseAdmin) {
                    // Atualizar a interação INIT específica
                    const { error: updateError } = await supabaseAdmin
                      .from('flow_interactions')
                      .update({
                        metadata: {
                          access_timestamp: accessTimestamp,
                          client_ip: clientIP,
                          location: location
                        }
                      })
                      .eq('id', initInteractionId);
                    
                    if (updateError) {
                      logger.error('❌ Erro ao atualizar localização na interação INIT', { 
                        error: updateError.message,
                        interactionId: initInteractionId,
                        code: updateError.code
                      });
                    } else {
                      logger.info('✅ Localização atualizada com sucesso!', { 
                        interactionId: initInteractionId,
                        location: `${location.city || ''}, ${location.region || ''}, ${location.country || ''}`,
                        ip: clientIP,
                        fullLocation: location
                      });
                      
                      // Também atualizar outras interações do mesmo flow_token (se houver CPF)
                      // Isso garante que todas as interações do mesmo flow tenham a localização
                      if (flow_token) {
                        // Buscar todas as interações do mesmo flow_token
                        const { data: otherInteractions } = await supabaseAdmin
                          .from('flow_interactions')
                          .select('id, metadata')
                          .eq('flow_token', flow_token)
                          .neq('id', initInteractionId);
                        
                        if (otherInteractions && otherInteractions.length > 0) {
                          // Atualizar cada uma com a localização
                          for (const otherInteraction of otherInteractions) {
                            const currentMetadata = otherInteraction.metadata || {};
                            const { error: mergeError } = await supabaseAdmin
                              .from('flow_interactions')
                              .update({
                                metadata: {
                                  ...currentMetadata,
                                  location: location,
                                  access_timestamp: currentMetadata.access_timestamp || accessTimestamp,
                                  client_ip: currentMetadata.client_ip || clientIP
                                }
                              })
                              .eq('id', otherInteraction.id);
                            
                            if (mergeError) {
                              logger.debug('Erro ao propagar localização para outra interação', {
                                interactionId: otherInteraction.id,
                                error: mergeError.message
                              });
                            }
                          }
                          logger.debug('Localização propagada para outras interações', {
                            count: otherInteractions.length,
                            flow_token
                          });
                        }
                      }
                    }
                  }
                } else {
                  logger.warn('⚠️ Localização é local ou inválida', { 
                    isLocal: location?.isLocal,
                    location,
                    ip: clientIP
                  });
                }
              } catch (err) {
                logger.error('❌ Erro ao obter localização', {
                  error: err.message,
                  ip: clientIP,
                  stack: err.stack?.substring(0, 200)
                });
              }
      } else {
        logger.debug('IP local ou inválido, pulando geolocalização', { ip: clientIP });
      }
    }).catch(trackError => {
      logger.warn('Erro ao rastrear INIT', {
        error: trackError.message
      });
    });
    
    return response;
  }

  // data_exchange - Navegação entre telas
  if (action === 'data_exchange') {
    logger.debug('Processando data_exchange', { actionType, screen, payloadKeys: Object.keys(payload) });
    
    // Validar dados do payload baseado no action_type
    // INIT não precisa de validação de payload
    if (actionType && actionType !== 'INIT') {
      const payloadValidation = validateByActionType(actionType, payload);
      if (!payloadValidation.valid) {
        logger.error('Validação de payload falhou', {
          actionType,
          error: payloadValidation.error
        });
        return {
          version: '3.0',
          screen: screen || 'CPF_INPUT',
          data: {
            error: true,
            error_message: payloadValidation.error
          }
        };
      }
      // Usar dados validados e normalizados
      payload = { ...payload, ...payloadValidation.data };
    }
    
    try {
      let response;
      switch (actionType) {
        case 'INIT':
          logger.info('Processando INIT via data_exchange');
          response = handleInit();
          
          // Capturar localização geográfica para INIT via data_exchange
          const accessTimestamp = new Date().toISOString();
          // Tentar obter IP real do cliente (Railway pode estar fazendo proxy)
          const forwardedFor = requestInfo?.headers?.['x-forwarded-for'];
          let clientIP = null;
          
          if (forwardedFor) {
            // Pegar o primeiro IP da cadeia (cliente real)
            const ips = forwardedFor.split(',').map(ip => ip.trim());
            clientIP = ips[0];
            logger.debug('IPs em x-forwarded-for (data_exchange INIT)', { ips, selected: clientIP });
          } else {
            clientIP = requestInfo?.ip || 
                        requestInfo?.headers?.['x-real-ip'] ||
                        requestInfo?.connection?.remoteAddress ||
                        null;
          }
          
          logger.info('INIT via data_exchange - Capturando localização', {
            flow_token: flow_token,
            clientIP: clientIP,
            hasRequestInfo: !!requestInfo
          });
          
          // Registrar interação INIT primeiro
          trackFlowInteraction({
            flow_token: flow_token,
            action_type: 'INIT',
            screen: 'WELCOME',
            previous_screen: null,
            payload: {},
            metadata: {
              access_timestamp: accessTimestamp,
              client_ip: clientIP
            }
          }).then(async (initInteractionId) => {
            if (!initInteractionId) {
              logger.warn('Não foi possível obter ID da interação INIT');
              return;
            }
            
            // Obter localização de forma assíncrona e atualizar
            // Filtrar IPs conhecidos do Railway/WhatsApp (não são IPs reais do cliente)
            const isRailwayIP = clientIP && (
              clientIP.includes('railway') || 
              clientIP.includes('hillsboro') ||
              clientIP.startsWith('35.') || // Google Cloud (Railway usa)
              clientIP.startsWith('34.')
            );
            
            if (clientIP && !clientIP.startsWith('192.168.') && !clientIP.startsWith('10.') && 
                clientIP !== '::1' && clientIP !== '127.0.0.1' && !isRailwayIP) {
              try {
                logger.info('Buscando localização para IP', { ip: clientIP });
                const location = await getLocationByIP(clientIP);
                
                if (location && !location.isLocal) {
                  const { supabaseAdmin } = require('../config/supabase');
                  if (supabaseAdmin) {
                    // Atualizar a interação INIT específica
                    const { error: updateError } = await supabaseAdmin
                      .from('flow_interactions')
                      .update({
                        metadata: {
                          access_timestamp: accessTimestamp,
                          client_ip: clientIP,
                          location: location
                        }
                      })
                      .eq('id', initInteractionId);
                    
                    if (updateError) {
                      logger.warn('Erro ao atualizar localização na interação INIT', { 
                        error: updateError.message,
                        interactionId: initInteractionId
                      });
                    } else {
                      logger.info('✅ Localização atualizada com sucesso na interação INIT', { 
                        interactionId: initInteractionId,
                        location: `${location.city || ''}, ${location.region || ''}, ${location.country || ''}`,
                        ip: clientIP
                      });
                    }
                    
                    // Também atualizar TODAS as outras interações do mesmo flow_token com a localização
                    // Isso garante que qualquer interação do mesmo flow tenha acesso à localização
                    if (flow_token) {
                      const { error: bulkUpdateError } = await supabaseAdmin
                        .from('flow_interactions')
                        .update({
                          metadata: supabaseAdmin.rpc('jsonb_set', {
                            metadata: supabaseAdmin.raw('metadata'),
                            path: '{location}',
                            new_value: JSON.stringify(location)
                          })
                        })
                        .eq('flow_token', flow_token)
                        .neq('id', initInteractionId)
                        .is('metadata->location', null);
                      
                      // Alternativa mais simples: usar merge do JSONB
                      const { error: mergeError } = await supabaseAdmin
                        .from('flow_interactions')
                        .update({
                          metadata: supabaseAdmin.raw(`metadata || '{"location": ${JSON.stringify(location)}}'::jsonb`)
                        })
                        .eq('flow_token', flow_token)
                        .neq('id', initInteractionId);
                      
                      if (mergeError) {
                        logger.debug('Não foi possível propagar localização para outras interações', {
                          error: mergeError.message
                        });
                      } else {
                        logger.debug('Localização propagada para outras interações do flow_token', {
                          flow_token
                        });
                      }
                    }
                  }
                } else {
                  logger.warn('Localização é local ou inválida', { 
                    isLocal: location?.isLocal,
                    location,
                    ip: clientIP
                  });
                }
              } catch (err) {
                logger.error('Erro ao obter localização', {
                  error: err.message,
                  ip: clientIP,
                  stack: err.stack
                });
              }
            } else {
              logger.warn('IP local ou inválido, pulando geolocalização', { 
                ip: clientIP,
                isLocal: clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.') || clientIP === '::1' || clientIP === '127.0.0.1'
              });
            }
          }).catch(trackError => {
            logger.warn('Erro ao rastrear INIT', {
              error: trackError.message
            });
          });
          
          break;
      case 'CPF_INPUT':
        response = await handleCpfInput(payload);
        break;
      case 'CLUB_OPTION':
        response = await handleClubOption(payload);
        break;
      case 'SELECT_BRANCH':
        response = await handleSelectBranch(payload);
        break;
      case 'SELECT_BARBER':
        response = await handleSelectBarber(payload);
        break;
      case 'SELECT_SERVICE':
        response = await handleSelectService(payload);
        break;
      case 'SELECT_DATE':
        response = await handleSelectDate(payload);
        break;
      case 'SELECT_TIME':
        response = await handleSelectTime(payload);
        break;
      case 'SUBMIT_DETAILS':
        response = await handleSubmitDetails(payload);
        break;
      case 'CONFIRM_BOOKING':
        response = await handleConfirmBooking(payload);
        break;
      default:
        // Fallback baseado na tela atual
        response = handleByScreen(screen, payload);
      }

      // Registrar interação do flow (não bloquear se falhar)
      try {
        const accessTimestamp = new Date().toISOString();
        await trackFlowInteraction({
          flow_token: flow_token || payload.flow_token,
          client_cpf: payload.client_cpf,
          client_phone: payload.client_phone,
          action_type: actionType,
          screen: response?.screen || screen,
          previous_screen: screen,
          payload: payload,
          metadata: {
            access_timestamp: accessTimestamp,
            client_ip: requestInfo?.ip || requestInfo?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || null
          }
        });
      } catch (trackError) {
        logger.warn('Erro ao rastrear interação (não crítico)', {
          error: trackError.message
        });
      }

      return response;
    } catch (error) {
      logger.error('Erro ao processar action_type', {
        actionType,
        error: error.message,
        stack: error.stack
      });
      return {
        version: '3.0',
        screen: screen || 'CPF_INPUT',
        data: {
          error: true,
          error_message: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.'
        }
      };
    }
  }

  // Se não tem action definida, pode ser uma requisição inválida
  logger.warn('Action não reconhecida', { action });
  return { version: version || '3.0', data: {} };
}

/**
 * Fallback baseado na tela atual
 * @param {string} screen - Nome da tela
 * @param {object} payload - Dados da requisição
 * @returns {Promise<object>} Resposta do Flow
 */
async function handleByScreen(screen, payload) {
  switch (screen) {
    case 'WELCOME':
      return handleInit();
    case 'CPF_INPUT':
      return handleCpfInput(payload);
    case 'CLUB_OPTION':
      return handleClubOption(payload);
    case 'BRANCH_SELECTION':
      return handleSelectBranch(payload);
    case 'BARBER_SELECTION':
      return handleSelectBarber(payload);
    case 'SERVICE_SELECTION':
      return handleSelectService(payload);
    case 'DATE_SELECTION':
      return handleSelectDate(payload);
    case 'TIME_SELECTION':
      return handleSelectTime(payload);
    case 'DETAILS':
      return handleSubmitDetails(payload);
    case 'CONFIRMATION':
      return handleConfirmBooking(payload);
    default:
      return { version: '3.0', data: {} };
  }
}

module.exports = {
  handleFlowRequest
};

