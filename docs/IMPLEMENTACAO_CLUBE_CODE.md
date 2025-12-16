# Guia de Implementação - Clube CODE

## Passo 1: Configurar Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Crie uma conta (se não tiver)
3. Clique em "New Project"
4. Escolha o plano **Free** (suficiente para começar)
5. Configure:
   - Nome do projeto: `clube-code`
   - Senha do banco: (anote em local seguro)
   - Região: escolha a mais próxima (ex: South America)

### 1.2 Executar Schema SQL
1. No painel do Supabase, vá em "SQL Editor"
2. Abra o arquivo `docs/supabase/schema.sql`
3. Cole o conteúdo no editor
4. Execute o script (botão "Run")

### 1.3 Obter Credenciais
1. Vá em "Settings" > "API"
2. Anote:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (manter secreto!)

### 1.4 Configurar Variáveis de Ambiente
Adicione ao `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Passo 2: Configurar Stripe

### 2.1 Criar Conta no Stripe
1. Acesse https://stripe.com/br
2. Crie uma conta
3. Complete o cadastro (pode usar modo teste inicialmente)

### 2.2 Obter Chaves da API
1. No painel do Stripe, vá em "Developers" > "API keys"
2. Anote:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (manter secreto!)

### 2.3 Configurar Webhook
1. Vá em "Developers" > "Webhooks"
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com/api/webhooks/stripe`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Anote o **Webhook signing secret**: `whsec_...`

### 2.4 Configurar Variáveis de Ambiente
Adicione ao `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Passo 3: Instalar Dependências

```bash
npm install @supabase/supabase-js stripe
```

## Passo 4: Estrutura de Arquivos

```
src/
├── services/
│   ├── customer-service.js      # Gerenciamento de clientes
│   ├── subscription-service.js   # Gerenciamento de assinaturas
│   ├── stripe-service.js        # Integração com Stripe
│   └── payment-service.js       # Gerenciamento de pagamentos
├── routes/
│   ├── customer-routes.js       # Rotas de clientes
│   ├── subscription-routes.js   # Rotas de assinaturas
│   ├── stripe-routes.js         # Rotas do Stripe (webhook)
│   └── admin-routes.js          # Rotas administrativas
└── config/
    └── supabase.js              # Cliente Supabase
```

## Passo 5: Ordem de Implementação

1. ✅ Configurar cliente Supabase
2. ✅ Criar customer-service.js
3. ✅ Criar subscription-service.js
4. ✅ Atualizar cpf-handler.js para usar banco
5. ✅ Criar stripe-service.js
6. ✅ Criar rotas de API
7. ✅ Implementar webhook do Stripe
8. ✅ Criar interface administrativa básica
9. ✅ Implementar notificações

## Próximos Passos

Após configurar Supabase e Stripe, execute:
```bash
# Verificar se as variáveis estão configuradas
node scripts/verify-env.js
```

