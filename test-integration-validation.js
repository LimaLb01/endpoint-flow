/**
 * Testes de Integração - Validação no Flow Router
 * Simula requisições reais do WhatsApp Flow
 */

const { handleFlowRequest } = require('./src/handlers/flow-router');

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
    console.error(error.stack);
    testsFailed++;
  }
}

console.log(`${colors.blue}🧪 Iniciando testes de integração...${colors.reset}\n`);

// ============================================
// Testes: Requisições Inválidas
// ============================================
console.log(`${colors.yellow}📋 Testando Requisições Inválidas${colors.reset}`);

test('Deve rejeitar requisição sem action', async () => {
  const result = await handleFlowRequest({
    version: '3.0',
    screen: 'SERVICE_SELECTION'
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar requisição com dados inválidos', async () => {
  const result = await handleFlowRequest(null);
  return result.data && result.data.error === true;
});

test('Deve rejeitar data_exchange com payload inválido para SELECT_SERVICE', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      action_type: 'SELECT_SERVICE'
      // Sem selected_service
    }
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar data_exchange com serviço inválido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      action_type: 'SELECT_SERVICE',
      selected_service: 'servico_inexistente'
    }
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar data_exchange com data inválida', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'DATE_SELECTION',
    data: {
      action_type: 'SELECT_DATE',
      selected_service: 'corte_masculino',
      selected_date: '19/12/2025' // Formato inválido
    }
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar data_exchange com horário inválido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'TIME_SELECTION',
    data: {
      action_type: 'SELECT_TIME',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao',
      selected_time: '9:00' // Formato inválido (deve ser 09:00)
    }
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar SUBMIT_DETAILS sem client_name', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'DETAILS',
    data: {
      action_type: 'SUBMIT_DETAILS',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao',
      selected_time: '09:00',
      client_phone: '54992917132'
      // Sem client_name
    }
  });
  return result.data && result.data.error === true;
});

test('Deve rejeitar SUBMIT_DETAILS com telefone inválido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'DETAILS',
    data: {
      action_type: 'SUBMIT_DETAILS',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao',
      selected_time: '09:00',
      client_name: 'João Silva',
      client_phone: '123' // Muito curto
    }
  });
  return result.data && result.data.error === true;
});

// ============================================
// Testes: Requisições Válidas
// ============================================
console.log(`\n${colors.yellow}📋 Testando Requisições Válidas${colors.reset}`);

test('Deve aceitar INIT válido', async () => {
  const result = await handleFlowRequest({
    action: 'INIT',
    version: '3.0',
    screen: 'WELCOME'
  });
  return result.screen === 'SERVICE_SELECTION' && result.data.services;
});

test('Deve aceitar SELECT_SERVICE válido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'SERVICE_SELECTION',
    data: {
      action_type: 'SELECT_SERVICE',
      selected_service: 'corte_masculino'
    }
  });
  return result.screen === 'DATE_SELECTION' && result.data.selected_service === 'corte_masculino';
});

test('Deve aceitar SELECT_DATE válido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'DATE_SELECTION',
    data: {
      action_type: 'SELECT_DATE',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19'
    }
  });
  return result.screen === 'BARBER_SELECTION' && result.data.selected_date === '2025-12-19';
});

test('Deve aceitar SELECT_BARBER válido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'BARBER_SELECTION',
    data: {
      action_type: 'SELECT_BARBER',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao'
    }
  });
  return result.screen === 'TIME_SELECTION' && result.data.selected_barber === 'joao';
});

test('Deve aceitar SELECT_TIME válido', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'TIME_SELECTION',
    data: {
      action_type: 'SELECT_TIME',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao',
      selected_time: '09:00'
    }
  });
  return result.screen === 'DETAILS' && result.data.selected_time === '09:00';
});

test('Deve aceitar SUBMIT_DETAILS válido e normalizar dados', async () => {
  const result = await handleFlowRequest({
    action: 'data_exchange',
    version: '3.0',
    screen: 'DETAILS',
    data: {
      action_type: 'SUBMIT_DETAILS',
      selected_service: 'corte_masculino',
      selected_date: '2025-12-19',
      selected_barber: 'joao',
      selected_time: '09:00',
      client_name: '  João Silva  ',
      client_phone: '(54) 99291-7132',
      client_email: 'joao@example.com',
      notes: '  Observação  '
    }
  });
  return result.screen === 'CONFIRMATION' && 
         result.data.client_name === 'João Silva' &&
         result.data.client_phone === '54992917132' &&
         result.data.notes === 'Observação';
});

// ============================================
// Resumo
// ============================================
console.log(`\n${colors.blue}📊 Resumo dos Testes de Integração${colors.reset}`);
console.log(`${colors.green}✅ Testes passados: ${testsPassed}${colors.reset}`);
console.log(`${colors.red}❌ Testes falhados: ${testsFailed}${colors.reset}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log(`\n${colors.green}🎉 Todos os testes de integração passaram!${colors.reset}`);
  console.log(`${colors.blue}✅ A validação está funcionando corretamente no flow-router!${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}⚠️ Alguns testes falharam. Verifique os erros acima.${colors.reset}`);
  process.exit(1);
}

