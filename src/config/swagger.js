/**
 * Configuração do Swagger/OpenAPI
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WhatsApp Flow Endpoint API',
      version: '2.0.0',
      description: `
        API para integração de WhatsApp Flow com Google Calendar.
        Sistema de agendamento de barbearia via WhatsApp Business API.
        
        ## Autenticação
        - Webhook utiliza verificação de assinatura (X-Hub-Signature-256)
        - Respostas podem ser criptografadas (AES-256-GCM)
        
        ## Rate Limiting
        - Endpoints públicos: 100 requisições/minuto por IP
        - Webhook WhatsApp: 50 requisições/minuto por número de WhatsApp
        - Endpoints críticos: 20 requisições/minuto por IP
      `,
      contact: {
        name: 'Sistema de Agendamento',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://whatsapp-flow-endpoint-production.up.railway.app',
        description: 'Produção'
      },
      {
        url: 'http://localhost:3000',
        description: 'Desenvolvimento Local'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de verificação de saúde do sistema'
      },
      {
        name: 'Metrics',
        description: 'Endpoints de métricas e monitoramento'
      },
      {
        name: 'Webhook',
        description: 'Endpoints do webhook do WhatsApp Flow'
      }
    ],
    components: {
      schemas: {
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Status geral do sistema'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp da verificação'
            },
            services: {
              type: 'object',
              properties: {
                googleCalendar: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                whatsappAPI: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                encryption: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                signatureValidation: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                bookingStorage: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        Metrics: {
          type: 'object',
          properties: {
            uptime: {
              type: 'number',
              description: 'Tempo de atividade em segundos'
            },
            requests: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                byType: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                },
                byStatus: {
                  type: 'object',
                  properties: {
                    success: { type: 'number' },
                    error: { type: 'number' }
                  }
                }
              }
            },
            responseTime: {
              type: 'object',
              properties: {
                average: { type: 'number' },
                min: { type: 'number' },
                max: { type: 'number' },
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            bookings: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                successful: { type: 'number' },
                failed: { type: 'number' }
              }
            },
            errors: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                byType: {
                  type: 'object',
                  additionalProperties: { type: 'number' }
                }
              }
            },
            cache: {
              type: 'object',
              properties: {
                hits: { type: 'number' },
                misses: { type: 'number' },
                hitRate: { type: 'string' }
              }
            }
          }
        },
        FlowRequest: {
          type: 'object',
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: ['INIT', 'data_exchange', 'ping'],
              description: 'Tipo de ação do Flow'
            },
            version: {
              type: 'string',
              default: '3.0',
              description: 'Versão do protocolo Flow'
            },
            screen: {
              type: 'string',
              description: 'Tela atual do Flow'
            },
            data: {
              type: 'object',
              description: 'Dados do Flow (pode ser criptografado)'
            }
          }
        },
        FlowResponse: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              description: 'Versão do protocolo Flow'
            },
            screen: {
              type: 'string',
              description: 'Próxima tela do Flow'
            },
            data: {
              type: 'object',
              description: 'Dados de resposta (pode ser criptografado)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            code: {
              type: 'string',
              description: 'Código de erro'
            },
            statusCode: {
              type: 'number',
              description: 'Código HTTP de status'
            },
            requestId: {
              type: 'string',
              description: 'ID único da requisição para rastreamento'
            }
          }
        }
      },
      securitySchemes: {
        SignatureValidation: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Hub-Signature-256',
          description: 'Assinatura HMAC SHA-256 do payload para validação'
        }
      }
    },
    security: [
      {
        SignatureValidation: []
      }
    ]
  },
  apis: [
    './src/index.js',
    './src/routes/webhook-routes.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

