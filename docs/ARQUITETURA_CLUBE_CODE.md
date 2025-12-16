# Arquitetura do Sistema de Clube CODE

## Visão Geral

Sistema completo para gerenciamento de planos e assinaturas do Clube CODE, integrado com WhatsApp Flow, Stripe e Supabase.

## Componentes Principais

### 1. Banco de Dados (Supabase)

**Tabelas:**

#### `customers`
```sql
- id (uuid, primary key)
- cpf (text, unique, not null)
- name (text)
- email (text)
- phone (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `plans`
```sql
- id (uuid, primary key)
- name (text, not null) -- "Mensal", "Anual", "Único"
- type (text, not null) -- "monthly", "yearly", "one_time"
- price (decimal, not null)
- currency (text, default 'BRL')
- description (text)
- active (boolean, default true)
- created_at (timestamp)
```

#### `subscriptions`
```sql
- id (uuid, primary key)
- customer_id (uuid, foreign key -> customers.id)
- plan_id (uuid, foreign key -> plans.id)
- stripe_subscription_id (text, unique) -- ID da assinatura no Stripe
- stripe_customer_id (text) -- ID do cliente no Stripe
- status (text) -- "active", "canceled", "past_due", "unpaid"
- current_period_start (timestamp)
- current_period_end (timestamp)
- cancel_at_period_end (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `payments`
```sql
- id (uuid, primary key)
- subscription_id (uuid, foreign key -> subscriptions.id)
- customer_id (uuid, foreign key -> customers.id)
- stripe_payment_intent_id (text, unique)
- amount (decimal, not null)
- currency (text, default 'BRL')
- status (text) -- "succeeded", "pending", "failed", "refunded"
- payment_method (text) -- "card", "manual" (para pagamentos no local)
- payment_date (timestamp)
- created_at (timestamp)
```

#### `manual_payments`
```sql
- id (uuid, primary key)
- customer_id (uuid, foreign key -> customers.id)
- plan_id (uuid, foreign key -> plans.id)
- amount (decimal, not null)
- payment_date (timestamp, not null)
- confirmed_by (text) -- Nome do funcionário que confirmou
- notes (text)
- status (text) -- "pending", "confirmed", "cancelled"
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. Integração com Stripe

**Fluxo de Pagamento Online:**
1. Cliente escolhe plano no Flow
2. Sistema cria Checkout Session no Stripe
3. Cliente é redirecionado para pagamento
4. Stripe envia webhook quando pagamento é confirmado
5. Sistema atualiza status da assinatura

**Fluxo de Pagamento Manual (no local):**
1. Funcionário acessa interface administrativa
2. Busca cliente por CPF
3. Registra pagamento manual
4. Sistema cria assinatura automaticamente
5. Cliente recebe notificação por WhatsApp/Email

### 3. API Endpoints

#### Públicos (WhatsApp Flow)
- `GET /api/customers/check/:cpf` - Verifica se CPF tem plano ativo
- `POST /api/subscriptions/create-checkout` - Cria sessão de checkout Stripe

#### Webhooks
- `POST /api/webhooks/stripe` - Recebe eventos do Stripe

#### Administrativos (com autenticação)
- `GET /api/admin/customers` - Lista clientes
- `GET /api/admin/customers/:cpf` - Busca cliente por CPF
- `POST /api/admin/payments/manual` - Registra pagamento manual
- `GET /api/admin/subscriptions` - Lista assinaturas
- `PUT /api/admin/subscriptions/:id/cancel` - Cancela assinatura

### 4. Serviços

#### `customer-service.js`
- `getCustomerByCpf(cpf)` - Busca cliente no Supabase
- `createCustomer(data)` - Cria novo cliente
- `updateCustomer(id, data)` - Atualiza dados do cliente

#### `subscription-service.js`
- `getActiveSubscriptionByCpf(cpf)` - Verifica se tem plano ativo
- `createSubscription(customerId, planId)` - Cria assinatura
- `cancelSubscription(subscriptionId)` - Cancela assinatura
- `updateSubscriptionStatus(stripeSubscriptionId, status)` - Atualiza status

#### `stripe-service.js`
- `createCheckoutSession(customerId, planId)` - Cria sessão de checkout
- `handleWebhook(event)` - Processa eventos do Stripe
- `getSubscription(stripeSubscriptionId)` - Busca assinatura no Stripe

#### `payment-service.js`
- `createManualPayment(data)` - Registra pagamento manual
- `confirmManualPayment(paymentId)` - Confirma pagamento manual
- `sendPaymentNotification(customerId, paymentData)` - Envia notificação

### 5. Validação de CPF no Flow

**Fluxo:**
1. Cliente informa CPF no Flow
2. Sistema consulta Supabase: `getActiveSubscriptionByCpf(cpf)`
3. Se tem assinatura ativa:
   - Retorna `has_plan: true, is_club_member: true`
   - Redireciona para seleção de filial
4. Se não tem:
   - Retorna `has_plan: false, is_club_member: false`
   - Oferece opção de se tornar membro do clube

### 6. Interface Administrativa

**Funcionalidades:**
- Dashboard com estatísticas
- Busca de clientes por CPF
- Registro de pagamentos manuais
- Visualização de assinaturas ativas
- Cancelamento de assinaturas
- Histórico de pagamentos

**Tecnologia:** React ou HTML simples (começar simples)

## Segurança

1. **Autenticação Admin:**
   - JWT tokens
   - Middleware de autenticação
   - Rate limiting específico

2. **Validação de Webhooks:**
   - Verificar assinatura do Stripe
   - Validar eventos recebidos

3. **Proteção de Dados:**
   - CPF armazenado de forma segura
   - Dados sensíveis criptografados
   - RLS (Row Level Security) no Supabase

## Notificações

### WhatsApp
- Quando pagamento é confirmado
- Quando assinatura está prestes a vencer
- Quando assinatura é cancelada

### Email
- Confirmação de pagamento
- Recibo de pagamento
- Lembrete de renovação

## Próximos Passos de Implementação

1. ✅ Configurar Supabase (projeto e tabelas)
2. ✅ Instalar dependências (Supabase client, Stripe SDK)
3. ✅ Criar serviços de integração
4. ✅ Atualizar cpf-handler para consultar banco
5. ✅ Criar rotas de API
6. ✅ Implementar webhook do Stripe
7. ✅ Criar interface administrativa básica
8. ✅ Implementar notificações

