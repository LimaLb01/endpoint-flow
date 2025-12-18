/**
 * Script de teste para criação de cliente
 * Testa a API de criação de cliente
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://whatsapp-flow-endpoint-production.up.railway.app/api';

// Dados de teste
const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'admin@admin',
  password: process.env.TEST_PASSWORD || 'admin@123'
};

const TEST_CLIENTE = {
  name: 'Cliente Teste ' + Date.now(),
  cpf: '12345678901',
  phone: '11999999999',
  email: `teste${Date.now()}@exemplo.com`
};

async function fazerLogin() {
  try {
    console.log('🔐 Fazendo login...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao fazer login' }));
      throw new Error(error.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login realizado com sucesso');
    return data.token;
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    throw error;
  }
}

async function criarCliente(token) {
  try {
    console.log('\n📝 Criando cliente...');
    console.log('Dados:', {
      name: TEST_CLIENTE.name,
      cpf: TEST_CLIENTE.cpf,
      phone: TEST_CLIENTE.phone,
      email: TEST_CLIENTE.email
    });

    const response = await fetch(`${API_BASE_URL}/admin/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cpf: TEST_CLIENTE.cpf.replace(/\D/g, ''),
        name: TEST_CLIENTE.name,
        email: TEST_CLIENTE.email,
        phone: TEST_CLIENTE.phone.replace(/\D/g, '')
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text();
      console.error('Resposta do servidor:', text);
      throw new Error(`Erro ${response.status}: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error('Erro na resposta:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      if (response.status === 409) {
        console.log('⚠️  Cliente já existe (esperado em testes repetidos)');
        return data.customer;
      }
      throw new Error(data.message || data.error || `Erro ${response.status}`);
    }

    console.log('✅ Cliente criado com sucesso!');
    console.log('ID:', data.customer.id);
    console.log('CPF:', data.customer.cpf);
    return data.customer;
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error.message);
    throw error;
  }
}

async function buscarCliente(token, cpf) {
  try {
    console.log('\n🔍 Buscando cliente...');
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    const response = await fetch(`${API_BASE_URL}/admin/customers/${cpfLimpo}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Cliente encontrado!');
    console.log('Nome:', data.customer.name);
    console.log('Email:', data.customer.email);
    console.log('Telefone:', data.customer.phone);
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error.message);
    throw error;
  }
}

async function testar() {
  try {
    console.log('🧪 Iniciando testes de criação de cliente\n');
    console.log('API Base URL:', API_BASE_URL);
    console.log('='.repeat(50));

    // 1. Login
    const token = await fazerLogin();

    // 2. Criar cliente
    const cliente = await criarCliente(token);

    // 3. Buscar cliente criado
    await buscarCliente(token, cliente.cpf);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Todos os testes passaram!');
    console.log('\n📋 Resumo:');
    console.log('- Login: ✅');
    console.log('- Criação de cliente: ✅');
    console.log('- Busca de cliente: ✅');
    
  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  }
}

// Executar testes
testar();

