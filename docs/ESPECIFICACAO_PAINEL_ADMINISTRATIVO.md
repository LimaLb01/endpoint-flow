# 📋 Especificação do Painel Administrativo - Clube CODE

## 🎯 Objetivo

Painel web para gerenciar clientes, assinaturas e pagamentos do Clube CODE. Permite que funcionários da barbearia registrem pagamentos manuais e validem CPFs.

---

## 🏗️ Arquitetura

- **Front-end:** StichIA (você vai construir)
- **Back-end:** API REST já implementada
- **Autenticação:** JWT (a implementar)
- **Base URL:** `https://seu-dominio.com/api/admin`

---

## 📱 Telas e Funcionalidades

### 1. Tela de Login
**Rota:** `/login`

**Funcionalidades:**
- Campo de email/usuário
- Campo de senha
- Botão "Entrar"
- Link "Esqueci minha senha" (opcional)

**Fluxo:**
1. Usuário digita credenciais
2. Envia POST para `/api/auth/login` (a implementar)
3. Recebe token JWT
4. Salva token no localStorage/sessionStorage
5. Redireciona para Dashboard

---

### 2. Dashboard (Tela Principal)
**Rota:** `/dashboard`

**Métricas a exibir:**
- Total de clientes cadastrados
- Assinaturas ativas
- Assinaturas vencidas
- Receita do mês
- Gráfico de assinaturas por plano (opcional)

**Cards/Widgets:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Clientes      │  │ Assinaturas     │  │   Receita       │
│   Total: 150    │  │ Ativas: 45      │  │   Mês: R$ 4.500 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Ações rápidas:**
- Botão "Buscar Cliente" (leva para busca)
- Botão "Registrar Pagamento" (leva para registro)
- Botão "Ver Assinaturas" (leva para lista)

---

### 3. Buscar Cliente
**Rota:** `/clientes/buscar`

**Funcionalidades:**
- Campo de busca por CPF
- Botão "Buscar"
- Resultado da busca:
  - Dados do cliente (nome, email, telefone, CPF)
  - Assinaturas ativas/inativas
  - Histórico de pagamentos
  - Botão "Registrar Pagamento" (se não tiver plano ativo)

**Layout sugerido:**
```
┌─────────────────────────────────────────┐
│ Buscar Cliente                          │
├─────────────────────────────────────────┤
│ CPF: [____________] [Buscar]            │
├─────────────────────────────────────────┤
│                                         │
│ Cliente: João Silva                     │
│ Email: joao@email.com                   │
│ Telefone: (54) 99999-9999              │
│ CPF: 123.456.789-00                     │
│                                         │
│ Assinaturas:                            │
│ ┌─────────────────────────────────────┐ │
│ │ Plano Mensal - Ativo                │ │
│ │ Válido até: 15/01/2026             │ │
│ │ [Cancelar]                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Registrar Novo Pagamento]              │
└─────────────────────────────────────────┘
```

**API Endpoint:**
```
GET /api/admin/customers/:cpf
Headers: Authorization: Bearer {token}
```

**Resposta:**
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

### 4. Registrar Pagamento Manual
**Rota:** `/pagamentos/registrar`

**Funcionalidades:**
- Campo CPF do cliente (com busca/autocomplete)
- Dropdown de planos disponíveis
- Campo valor (preenchido automaticamente pelo plano, mas editável)
- Campo data do pagamento (date picker, padrão: hoje)
- Campo "Confirmado por" (nome do funcionário)
- Campo observações (opcional, textarea)
- Botão "Registrar Pagamento"
- Botão "Cancelar"

**Layout sugerido:**
```
┌─────────────────────────────────────────┐
│ Registrar Pagamento Manual              │
├─────────────────────────────────────────┤
│                                         │
│ CPF do Cliente:                         │
│ [________________] [Buscar Cliente]     │
│                                         │
│ Cliente: João Silva (se encontrado)     │
│                                         │
│ Plano:                                  │
│ [▼ Plano Mensal        ]               │
│   - Plano Mensal (R$ 99,90)            │
│   - Plano Anual (R$ 999,90)            │
│   - Plano Único (R$ 199,90)            │
│                                         │
│ Valor: R$ [99,90]                       │
│                                         │
│ Data do Pagamento:                      │
│ [📅 16/12/2025]                         │
│                                         │
│ Confirmado por:                         │
│ [Nome do Funcionário]                   │
│                                         │
│ Observações:                            │
│ [___________________________]          │
│                                         │
│ [Cancelar]  [Registrar Pagamento]       │
└─────────────────────────────────────────┘
```

**Validações:**
- CPF obrigatório e válido (11 dígitos)
- Plano obrigatório
- Valor obrigatório e maior que 0
- Data obrigatória
- "Confirmado por" obrigatório

**Fluxo:**
1. Usuário preenche formulário
2. Ao selecionar plano, valor é preenchido automaticamente
3. Ao clicar "Registrar":
   - Valida campos
   - Envia POST para `/api/admin/payments/manual`
   - Mostra loading
   - Se sucesso: mensagem de sucesso e redireciona
   - Se erro: mostra mensagem de erro

**API Endpoint:**
```
POST /api/admin/payments/manual
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json

Body:
{
  "cpf": "12345678900",
  "plan_id": "uuid-do-plano",
  "amount": 99.90,
  "payment_date": "2025-12-16T10:00:00Z",
  "confirmed_by": "Maria Silva",
  "notes": "Pagamento em dinheiro"
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

**Resposta de Erro:**
```json
{
  "error": "Campos obrigatórios faltando",
  "required": ["cpf", "plan_id", "amount", "payment_date", "confirmed_by"]
}
```

---

### 5. Listar Assinaturas
**Rota:** `/assinaturas`

**Funcionalidades:**
- Filtro por status (Ativas, Canceladas, Vencidas)
- Tabela com assinaturas:
  - Cliente (nome/CPF)
  - Plano
  - Status
  - Data de início
  - Data de vencimento
  - Ações (Ver detalhes, Cancelar)

**Layout sugerido:**
```
┌─────────────────────────────────────────────────────────────┐
│ Assinaturas                          [Filtro: Ativas ▼]    │
├─────────────────────────────────────────────────────────────┤
│ Cliente        │ Plano        │ Status │ Vencimento │ Ações │
├────────────────┼──────────────┼────────┼────────────┼───────┤
│ João Silva     │ Mensal       │ Ativa  │ 15/01/2026 │ [Ver] │
│ 123.456.789-00│              │        │            │       │
├────────────────┼──────────────┼────────┼────────────┼───────┤
│ Maria Santos   │ Anual        │ Ativa  │ 15/12/2026 │ [Ver] │
│ 987.654.321-00│              │        │            │       │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoint:**
```
GET /api/admin/subscriptions?status=active&limit=50
Headers: Authorization: Bearer {token}
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

### 6. Detalhes da Assinatura
**Rota:** `/assinaturas/:id`

**Funcionalidades:**
- Dados completos da assinatura
- Dados do cliente
- Histórico de pagamentos
- Botão "Cancelar Assinatura"
- Botão "Voltar"

**API Endpoint:**
```
GET /api/admin/subscriptions/:id
PUT /api/admin/subscriptions/:id/cancel
```

---

### 7. Listar Planos
**Rota:** `/planos`

**Funcionalidades:**
- Lista de planos disponíveis
- Editar preços (opcional, futura)
- Ativar/desativar planos (opcional, futura)

**API Endpoint:**
```
GET /api/admin/plans
Headers: Authorization: Bearer {token}
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

## 🔐 Autenticação

### Endpoints de Autenticação (A IMPLEMENTAR)

**Login:**
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

**Todas as rotas admin requerem:**
```
Headers: {
  "Authorization": "Bearer {token}"
}
```

**Se token inválido/expirado:**
```
Status: 401
{
  "error": "Não autorizado",
  "message": "Token de autenticação necessário"
}
```

---

## 🎨 Design Sugerido

### Cores
- **Primária:** Azul escuro (#1a365d) ou cor da marca
- **Secundária:** Verde (#48bb78) para sucesso
- **Erro:** Vermelho (#f56565)
- **Aviso:** Amarelo (#ed8936)
- **Fundo:** Cinza claro (#f7fafc)

### Componentes
- **Input:** Bordas arredondadas, sombra sutil
- **Botões:** 
  - Primário: Cor primária, texto branco
  - Secundário: Borda, fundo transparente
- **Cards:** Sombra sutil, bordas arredondadas
- **Tabelas:** Linhas alternadas, hover effect

### Responsividade
- Mobile-first
- Breakpoints: 768px (tablet), 1024px (desktop)
- Menu lateral colapsável no mobile

---

## 📊 Fluxos Principais

### Fluxo 1: Registrar Pagamento Manual
```
1. Funcionário acessa painel
2. Clica em "Registrar Pagamento"
3. Digita CPF do cliente
4. Sistema busca cliente (se não existir, cria)
5. Seleciona plano
6. Valor é preenchido automaticamente
7. Preenche data e "Confirmado por"
8. Clica "Registrar"
9. Sistema cria pagamento e assinatura
10. Mostra mensagem de sucesso
11. Cliente recebe notificação (futuro)
```

### Fluxo 2: Validar CPF
```
1. Funcionário acessa "Buscar Cliente"
2. Digita CPF
3. Sistema busca no banco
4. Mostra dados do cliente
5. Mostra assinaturas ativas/inativas
6. Se não tem plano: mostra botão "Registrar Pagamento"
7. Se tem plano: mostra detalhes e data de vencimento
```

---

## 🔧 Integração com API

### Base URL
```
https://seu-dominio.com/api/admin
```

### Headers Obrigatórios
```javascript
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

### Tratamento de Erros
- **401:** Token inválido → Redirecionar para login
- **403:** Sem permissão → Mostrar mensagem
- **404:** Recurso não encontrado → Mostrar mensagem
- **500:** Erro do servidor → Mostrar mensagem genérica

### Loading States
- Mostrar spinner/loading durante requisições
- Desabilitar botões durante submit
- Feedback visual imediato

---

## 📝 Checklist de Implementação

### Backend (Já implementado)
- ✅ Endpoints de clientes
- ✅ Endpoints de assinaturas
- ✅ Endpoint de pagamentos manuais
- ✅ Endpoint de planos
- ⏳ Autenticação JWT (a implementar)

### Frontend (Você vai fazer no StichIA)
- [ ] Tela de Login
- [ ] Dashboard
- [ ] Buscar Cliente
- [ ] Registrar Pagamento
- [ ] Listar Assinaturas
- [ ] Detalhes da Assinatura
- [ ] Listar Planos
- [ ] Sistema de autenticação (guardar token)
- [ ] Interceptor de requisições (adicionar token)
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Validações de formulário

---

## 🚀 Próximos Passos

1. **Implementar autenticação JWT no backend** (quando você estiver pronto)
2. **Criar front-end no StichIA** seguindo esta especificação
3. **Testar integração** entre front-end e back-end
4. **Adicionar notificações** (WhatsApp/Email)

---

## 📞 Dúvidas?

Se precisar de mais detalhes sobre algum endpoint ou funcionalidade, me avise!


