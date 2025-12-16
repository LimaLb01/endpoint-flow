/**
 * Schemas de Validação usando Zod
 * Define estruturas de dados esperadas para cada ação do Flow
 */

const { z } = require('zod');

/**
 * Schema para estrutura básica de requisição do Flow
 */
const flowRequestSchema = z.object({
  action: z.string().min(1, 'Campo "action" é obrigatório'),
  version: z.string().optional().default('3.0'),
  screen: z.string().nullable().optional(),
  data: z.object({}).passthrough().optional().default({})
});

/**
 * Schema para SELECT_SERVICE
 */
const selectServiceSchema = z.object({
  selected_service: z.enum([
    'corte_masculino',
    'barba',
    'corte_barba',
    'corte_infantil',
    'pigmentacao'
  ], {
    errorMap: () => ({ message: 'Serviço selecionado não é válido' })
  }),
  action_type: z.literal('SELECT_SERVICE').optional()
});

/**
 * Schema para SELECT_DATE
 */
const selectDateSchema = z.object({
  selected_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Data deve estar no formato YYYY-MM-DD'
  ),
  action_type: z.literal('SELECT_DATE').optional()
});

/**
 * Schema para SELECT_BARBER
 */
const selectBarberSchema = z.object({
  selected_barber: z.enum(['joao', 'pedro', 'carlos'], {
    errorMap: () => ({ message: 'Barbeiro selecionado não é válido' })
  }),
  action_type: z.literal('SELECT_BARBER').optional()
});

/**
 * Schema para SELECT_TIME
 */
const selectTimeSchema = z.object({
  selected_time: z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'Horário deve estar no formato HH:MM (24 horas)'
  ),
  action_type: z.literal('SELECT_TIME').optional()
});

/**
 * Schema para SUBMIT_DETAILS
 */
const submitDetailsSchema = z.object({
  client_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  client_phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone contém caracteres inválidos')
    .transform((val) => val.replace(/\D/g, '')), // Remove caracteres não numéricos
  client_email: z.string()
    .email('Email inválido')
    .optional()
    .nullable()
    .transform((val) => val || null),
  contact_preference: z.enum(['whatsapp', 'email', 'telefone']).optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional().nullable(),
  action_type: z.literal('SUBMIT_DETAILS').optional()
});

/**
 * Schema para CONFIRM_BOOKING
 */
const confirmBookingSchema = z.object({
  booking_id: z.string()
    .regex(/^AGD-\d{6}$/, 'booking_id deve estar no formato AGD-XXXXXX'),
  status: z.enum(['confirmed', 'pending', 'cancelled']).optional(),
  action_type: z.literal('CONFIRM_BOOKING').optional()
});

/**
 * Mapeamento de action_type para schema
 */
const schemaMap = {
  'SELECT_SERVICE': selectServiceSchema,
  'SELECT_DATE': selectDateSchema,
  'SELECT_BARBER': selectBarberSchema,
  'SELECT_TIME': selectTimeSchema,
  'SUBMIT_DETAILS': submitDetailsSchema,
  'CONFIRM_BOOKING': confirmBookingSchema
};

/**
 * Valida dados usando schema Zod
 * @param {z.ZodSchema} schema - Schema Zod para validação
 * @param {object} data - Dados para validar
 * @returns {{valid: boolean, error: string|null, data: object|null}}
 */
function validateWithSchema(schema, data) {
  try {
    const validated = schema.parse(data);
    return {
      valid: true,
      error: null,
      data: validated
    };
  } catch (error) {
    if (error instanceof z.ZodError && error.errors && error.errors.length > 0) {
      // Pegar primeira mensagem de erro ou combinar todas
      const firstError = error.errors[0];
      const errorMessage = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`
        : 'Erro de validação';
      
      return {
        valid: false,
        error: errorMessage,
        data: null
      };
    }
    
    return {
      valid: false,
      error: error.message || 'Erro de validação desconhecido',
      data: null
    };
  }
}

/**
 * Valida estrutura básica da requisição do Flow
 * @param {object} data - Dados da requisição
 * @returns {{valid: boolean, error: string|null, data: object|null}}
 */
function validateFlowRequestSchema(data) {
  return validateWithSchema(flowRequestSchema, data);
}

/**
 * Valida dados baseado no action_type usando schema
 * @param {string} actionType - Tipo de ação
 * @param {object} payload - Dados do payload
 * @returns {{valid: boolean, error: string|null, data: object|null}}
 */
function validateByActionTypeSchema(actionType, payload) {
  const schema = schemaMap[actionType];
  
  if (!schema) {
    // Para ações desconhecidas, apenas validar que payload é um objeto
    if (!payload || typeof payload !== 'object') {
      return {
        valid: false,
        error: `Payload inválido para action_type: ${actionType}`,
        data: null
      };
    }
    return {
      valid: true,
      error: null,
      data: payload
    };
  }
  
  return validateWithSchema(schema, payload);
}

module.exports = {
  flowRequestSchema,
  selectServiceSchema,
  selectDateSchema,
  selectBarberSchema,
  selectTimeSchema,
  submitDetailsSchema,
  confirmBookingSchema,
  schemaMap,
  validateWithSchema,
  validateFlowRequestSchema,
  validateByActionTypeSchema
};

