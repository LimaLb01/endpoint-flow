# 🔌 Guia de Integração Front-end com API

## 📍 Base URL da API

```
https://seu-dominio.com/api/admin
```

**Nota:** Substitua `seu-dominio.com` pelo domínio real do seu endpoint no Railway.

---

## 🔐 Autenticação

Todas as requisições (exceto login) precisam do header:

```javascript
Authorization: Bearer {token}
```

O token deve ser salvo no `localStorage` após o login e adicionado automaticamente em todas as requisições.

---

## 📋 Endpoints Disponíveis

### 1. Login (A IMPLEMENTAR)
```
POST /api/auth/login
Body: {
  "email": "admin@barbearia.com",
  "password": "senha123"
}

Resposta:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@barbearia.com",
    "name": "Admin"
  }
}
```

**Status:** ⏳ Este endpoint ainda precisa ser implementado no backend.

---

### 2. Buscar Cliente por CPF
```
GET /api/admin/customers/:cpf
Headers: {
  "Authorization": "Bearer {token}"
}
```

**Exemplo JavaScript:**
```javascript
async function buscarCliente(cpf) {
  // Remove formatação do CPF
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `https://seu-dominio.com/api/admin/customers/${cpfLimpo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 401) {
      // Token inválido, redirecionar para login
      window.location.href = '/login';
      return;
    }
    
    if (response.status === 404) {
      return { error: 'Cliente não encontrado' };
    }
    
    if (!response.ok) {
      throw new Error('Erro ao buscar cliente');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    return { error: error.message };
  }
}
```

**Resposta de Sucesso:**
```json
{
  "customer": {
    "id": "uuid",
    "cpf": "12345678900",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "54999999999",
    "created_at": "2025-12-01T10:00:00Z"
  },
  "subscriptions": [
    {
      "id": "uuid",
      "status": "active",
      "current_period_end": "2026-01-15T23:59:59Z",
      "plan": {
        "id": "uuid",
        "name": "Plano Mensal",
        "type": "monthly",
        "price": "99.90"
      }
    }
  ]
}
```

---

### 3. Registrar Pagamento Manual
```
POST /api/admin/payments/manual
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
Body: {
  "cpf": "12345678900",
  "plan_id": "uuid-do-plano",
  "amount": 99.90,
  "payment_date": "2025-12-16T10:00:00Z",
  "confirmed_by": "Maria Silva",
  "notes": "Pagamento em dinheiro"
}
```

**Exemplo JavaScript:**
```javascript
async function registrarPagamento(dados) {
  const token = localStorage.getItem('token');
  
  // Converter data para ISO
  const paymentDate = new Date(dados.payment_date).toISOString();
  
  const body = {
    cpf: dados.cpf.replace(/\D/g, ''), // Remove formatação
    plan_id: dados.plan_id,
    amount: parseFloat(dados.amount),
    payment_date: paymentDate,
    confirmed_by: dados.confirmed_by,
    notes: dados.notes || null
  };
  
  try {
    const response = await fetch(
      'https://seu-dominio.com/api/admin/payments/manual',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao registrar pagamento');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "customer_id": "uuid",
    "plan_id": "uuid",
    "amount": "99.90",
    "payment_date": "2025-12-16T10:00:00Z",
    "confirmed_by": "Maria Silva",
    "status": "confirmed"
  },
  "subscription": {
    "id": "uuid",
    "status": "active",
    "current_period_end": "2026-01-16T23:59:59Z"
  }
}
```

---

### 4. Listar Assinaturas
```
GET /api/admin/subscriptions?status=active&limit=50
Headers: {
  "Authorization": "Bearer {token}"
}
```

**Exemplo JavaScript:**
```javascript
async function listarAssinaturas(status = 'active', limit = 50) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `https://seu-dominio.com/api/admin/subscriptions?status=${status}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      throw new Error('Erro ao listar assinaturas');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    return { subscriptions: [], count: 0 };
  }
}
```

**Resposta:**
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "status": "active",
      "current_period_start": "2025-12-16T00:00:00Z",
      "current_period_end": "2026-01-16T23:59:59Z",
      "customer": {
        "cpf": "12345678900",
        "name": "João Silva",
        "email": "joao@email.com"
      },
      "plan": {
        "name": "Plano Mensal",
        "type": "monthly",
        "price": "99.90"
      }
    }
  ],
  "count": 45
}
```

---

### 5. Cancelar Assinatura
```
PUT /api/admin/subscriptions/:id/cancel
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
Body: {
  "cancel_at_period_end": false
}
```

**Exemplo JavaScript:**
```javascript
async function cancelarAssinatura(subscriptionId, cancelAtPeriodEnd = false) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `https://seu-dominio.com/api/admin/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancel_at_period_end: cancelAtPeriodEnd
        })
      }
    );
    
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      throw new Error('Erro ao cancelar assinatura');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}
```

---

### 6. Listar Planos
```
GET /api/admin/plans
Headers: {
  "Authorization": "Bearer {token}"
}
```

**Exemplo JavaScript:**
```javascript
async function listarPlanos() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      'https://seu-dominio.com/api/admin/plans',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    
    if (!response.ok) {
      throw new Error('Erro ao listar planos');
    }
    
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('Erro:', error);
    return [];
  }
}
```

**Resposta:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Plano Mensal",
      "type": "monthly",
      "price": "99.90",
      "currency": "BRL",
      "description": "Assinatura mensal do Clube CODE",
      "active": true
    },
    {
      "id": "uuid",
      "name": "Plano Anual",
      "type": "yearly",
      "price": "999.90",
      "currency": "BRL",
      "description": "Assinatura anual do Clube CODE",
      "active": true
    },
    {
      "id": "uuid",
      "name": "Plano Único",
      "type": "one_time",
      "price": "199.90",
      "currency": "BRL",
      "description": "Plano único sem renovação",
      "active": true
    }
  ]
}
```

---

## 🛠️ Utilitários JavaScript

### Interceptor de Requisições (Axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://seu-dominio.com/api/admin',
});

// Adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratar erros 401 (não autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Máscara de CPF
```javascript
function aplicarMascaraCPF(cpf) {
  // Remove tudo que não é dígito
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Aplica máscara
  return cpfLimpo
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Uso em input
document.getElementById('cpf').addEventListener('input', (e) => {
  e.target.value = aplicarMascaraCPF(e.target.value);
});
```

### Formatação de Data
```javascript
function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatarDataHora(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

### Formatação de Moeda
```javascript
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}
```

---

## 🎯 Exemplos de Integração por Tela

### Tela: Buscar Cliente

```javascript
// Quando o usuário clicar em "Buscar"
document.getElementById('btnBuscar').addEventListener('click', async () => {
  const cpfInput = document.getElementById('cpf');
  const cpf = cpfInput.value;
  
  // Mostrar loading
  mostrarLoading();
  
  try {
    const resultado = await buscarCliente(cpf);
    
    if (resultado.error) {
      mostrarErro(resultado.error);
      return;
    }
    
    // Preencher dados do cliente
    preencherDadosCliente(resultado.customer);
    
    // Preencher assinaturas
    preencherAssinaturas(resultado.subscriptions);
    
    // Mostrar seção de resultados
    document.getElementById('resultados').classList.remove('hidden');
    
  } catch (error) {
    mostrarErro('Erro ao buscar cliente. Tente novamente.');
  } finally {
    esconderLoading();
  }
});
```

### Tela: Registrar Pagamento

```javascript
// Quando o formulário for submetido
document.getElementById('formPagamento').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const dados = {
    cpf: document.getElementById('cpf').value,
    plan_id: document.getElementById('plan_id').value,
    amount: document.getElementById('amount').value,
    payment_date: document.getElementById('payment_date').value,
    confirmed_by: document.getElementById('confirmed_by').value,
    notes: document.getElementById('notes').value
  };
  
  // Validar campos
  if (!validarFormulario(dados)) {
    return;
  }
  
  // Mostrar loading
  mostrarLoading();
  
  try {
    const resultado = await registrarPagamento(dados);
    
    // Mostrar mensagem de sucesso
    mostrarSucesso('Pagamento registrado com sucesso!');
    
    // Redirecionar ou limpar formulário
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    
  } catch (error) {
    mostrarErro(error.message || 'Erro ao registrar pagamento');
  } finally {
    esconderLoading();
  }
});

// Carregar planos ao abrir a tela
window.addEventListener('DOMContentLoaded', async () => {
  const planos = await listarPlanos();
  preencherDropdownPlanos(planos);
});
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

- **200:** Sucesso
- **201:** Criado com sucesso
- **400:** Dados inválidos
- **401:** Não autorizado (token inválido/expirado)
- **403:** Sem permissão
- **404:** Recurso não encontrado
- **500:** Erro do servidor

### Exemplo de Tratamento

```javascript
async function fazerRequisicao(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, config);
    
    // Se não autorizado, redirecionar para login
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    }
    
    // Se erro, lançar exceção
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erro ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}
```

---

## 📝 Checklist de Implementação

- [ ] Configurar base URL da API
- [ ] Implementar interceptor para adicionar token
- [ ] Implementar tratamento de erro 401 (redirecionar login)
- [ ] Adicionar máscara de CPF nos inputs
- [ ] Implementar função de buscar cliente
- [ ] Implementar função de registrar pagamento
- [ ] Implementar função de listar assinaturas
- [ ] Implementar função de cancelar assinatura
- [ ] Implementar função de listar planos
- [ ] Adicionar loading states
- [ ] Adicionar mensagens de sucesso/erro
- [ ] Implementar validações de formulário
- [ ] Formatação de datas e moedas

---

## 🚀 Próximos Passos

1. **Implementar autenticação JWT no backend** (quando você estiver pronto)
2. **Adicionar JavaScript às telas HTML** para fazer as chamadas à API
3. **Testar integração** entre front-end e back-end
4. **Adicionar tratamento de erros** em todas as telas

---

## 📞 Dúvidas?

Se precisar de mais detalhes sobre algum endpoint ou funcionalidade, me avise!

