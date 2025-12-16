/**
 * Testes para Validadores de Dados
 * Execute com: node test-validators.js
 */

const {
  validateFlowRequest,
  validateSelectService,
  validateSelectDate,
  validateSelectBarber,
  validateSelectTime,
  validateSubmitDetails,
  validateConfirmBooking,
  validateByActionType
} = require('./src/utils/validators');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`${colors.green}✅ PASS${colors.reset}: ${name}`);
      testsPassed++;
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset}: ${name} - ${error.message}`);
    testsFailed++;
  }
}

console.log(`${colors.blue}🧪 Iniciando testes de validação...${colors.reset}\n`);

// ============================================
// Testes: validateFlowRequest
// ============================================
console.log(`${colors.yellow}📋 Testando validateFlowRequest${colors.reset}`);

test('Deve rejeitar dados null', () => {
  const result = validateFlowRequest(null);
  return !result.valid && result.error !== null;
});

test('Deve rejeitar dados undefined', () => {
  const result = validateFlowRequest(undefined);
  return !result.valid && result.error !== null;
});

test('Deve rejeitar dados que não são objeto', () => {
  const result = validateFlowRequest('string');
  return !result.valid && result.error !== null;
});

test('Deve rejeitar requisição sem action', () => {
  const result = validateFlowRequest({ version: '3.0' });
  return !result.valid && result.error !== null;
});

test('Deve aceitar requisição válida com INIT', () => {
  const result = validateFlowRequest({
    action: 'INIT',
    version: '3.0',
    screen: 'WELCOME'
  });
  return result.valid && result.data.action === 'INIT';
});

test('Deve aceitar requisição válida com data_exchange', () => {
  const result = validateFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: { action_type: 'SELECT_SERVICE' }
  });
  return result.valid && result.data.action === 'data_exchange';
});

// ============================================
// Testes: validateSelectService
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateSelectService${colors.reset}`);

test('Deve rejeitar payload null', () => {
  const result = validateSelectService(null);
  return !result.valid;
});

test('Deve rejeitar sem selected_service', () => {
  const result = validateSelectService({});
  return !result.valid;
});

test('Deve rejeitar serviço inválido', () => {
  const result = validateSelectService({ selected_service: 'servico_invalido' });
  return !result.valid;
});

test('Deve aceitar serviço válido', () => {
  const result = validateSelectService({ selected_service: 'corte_masculino' });
  return result.valid && result.data.selected_service === 'corte_masculino';
});

// ============================================
// Testes: validateSelectDate
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateSelectDate${colors.reset}`);

test('Deve rejeitar sem selected_date', () => {
  const result = validateSelectDate({ selected_service: 'corte_masculino' });
  return !result.valid;
});

test('Deve rejeitar formato de data inválido', () => {
  const result = validateSelectDate({
    selected_service: 'corte_masculino',
    selected_date: '19/12/2025'
  });
  return !result.valid;
});

test('Deve aceitar data válida', () => {
  const result = validateSelectDate({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19'
  });
  return result.valid && result.data.selected_date === '2025-12-19';
});

// ============================================
// Testes: validateSelectBarber
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateSelectBarber${colors.reset}`);

test('Deve rejeitar sem selected_barber', () => {
  const result = validateSelectBarber({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19'
  });
  return !result.valid;
});

test('Deve rejeitar barbeiro inválido', () => {
  const result = validateSelectBarber({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'barbeiro_invalido'
  });
  return !result.valid;
});

test('Deve aceitar barbeiro válido', () => {
  const result = validateSelectBarber({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao'
  });
  return result.valid && result.data.selected_barber === 'joao';
});

// ============================================
// Testes: validateSelectTime
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateSelectTime${colors.reset}`);

test('Deve rejeitar sem selected_time', () => {
  const result = validateSelectTime({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao'
  });
  return !result.valid;
});

test('Deve rejeitar formato de horário inválido', () => {
  const result = validateSelectTime({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '9:00'
  });
  return !result.valid;
});

test('Deve aceitar horário válido', () => {
  const result = validateSelectTime({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00'
  });
  return result.valid && result.data.selected_time === '09:00';
});

// ============================================
// Testes: validateSubmitDetails
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateSubmitDetails${colors.reset}`);

test('Deve rejeitar sem client_name', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_phone: '54992917132'
  });
  return !result.valid;
});

test('Deve rejeitar sem client_phone', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: 'João Silva'
  });
  return !result.valid;
});

test('Deve rejeitar telefone inválido', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: 'João Silva',
    client_phone: '123' // Muito curto
  });
  return !result.valid;
});

test('Deve rejeitar email inválido', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: 'João Silva',
    client_phone: '54992917132',
    client_email: 'email-invalido'
  });
  return !result.valid;
});

test('Deve aceitar dados válidos', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: 'João Silva',
    client_phone: '54992917132',
    client_email: 'joao@example.com'
  });
  return result.valid && result.data.client_name === 'João Silva';
});

test('Deve normalizar telefone removendo caracteres não numéricos', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: 'João Silva',
    client_phone: '(54) 99291-7132',
    client_email: 'joao@example.com'
  });
  return result.valid && result.data.client_phone === '54992917132';
});

test('Deve fazer trim nos campos de texto', () => {
  const result = validateSubmitDetails({
    selected_service: 'corte_masculino',
    selected_date: '2025-12-19',
    selected_barber: 'joao',
    selected_time: '09:00',
    client_name: '  João Silva  ',
    client_phone: '54992917132',
    notes: '  Observação  '
  });
  return result.valid && 
         result.data.client_name === 'João Silva' &&
         result.data.notes === 'Observação';
});

// ============================================
// Testes: validateConfirmBooking
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateConfirmBooking${colors.reset}`);

test('Deve rejeitar sem booking_id', () => {
  const result = validateConfirmBooking({});
  return !result.valid;
});

test('Deve rejeitar booking_id com formato inválido', () => {
  const result = validateConfirmBooking({ booking_id: 'INVALID-123' });
  return !result.valid;
});

test('Deve aceitar booking_id válido', () => {
  const result = validateConfirmBooking({ booking_id: 'AGD-123456' });
  return result.valid && result.data.booking_id === 'AGD-123456';
});

// ============================================
// Testes: validateByActionType
// ============================================
console.log(`\n${colors.yellow}📋 Testando validateByActionType${colors.reset}`);

test('Deve validar SELECT_SERVICE corretamente', () => {
  const result = validateByActionType('SELECT_SERVICE', { selected_service: 'corte_masculino' });
  return result.valid && result.data.action_type === 'SELECT_SERVICE';
});

test('Deve validar action_type desconhecido', () => {
  const result = validateByActionType('UNKNOWN_ACTION', { some_field: 'value' });
  return result.valid; // Deve aceitar mas não validar campos específicos
});

// ============================================
// Resumo
// ============================================
console.log(`\n${colors.blue}📊 Resumo dos Testes${colors.reset}`);
console.log(`${colors.green}✅ Testes passados: ${testsPassed}${colors.reset}`);
console.log(`${colors.red}❌ Testes falhados: ${testsFailed}${colors.reset}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}⚠️ Alguns testes falharam. Verifique os erros acima.${colors.reset}`);
  process.exit(1);
}

