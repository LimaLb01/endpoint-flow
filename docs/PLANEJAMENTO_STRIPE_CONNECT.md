# 🎯 Planejamento - Implementação Stripe Connect (Módulo no Painel Admin)

**Data de Criação:** 05/01/2026  
**Status:** 📋 Planejamento  
**Prioridade:** 🔴 Alta

---

## ⚠️ AJUSTE IMPORTANTE DE UX E ARQUITETURA

**O Stripe NÃO é um sistema separado.**  
Ele deve ser implementado como um **MÓDULO dentro do painel administrativo existente**, conforme o PRD do Painel Administrativo já fornecido.

### UX Desejada

1. **Menu no NavBar:**
   - Nome: **"Pagamentos"** ou **"Financeiro"**
   - ❌ **NÃO usar o nome "Stripe" no menu**

2. **Tela "Pagamentos" (React):**
   - Uma tela do painel construída em React
   - Layout e identidade da plataforma
   - Funciona como um **HUB financeiro**

3. **Conteúdo da Tela "Pagamentos":**
   - Status da conta Stripe (não conectada / em análise / ativa)
   - Status da assinatura
   - Valor do plano
   - Próxima cobrança
   - Aviso: "Pagamentos processados com segurança pelo Stripe"

4. **Ações Disponíveis:**
   - Botão **"Conectar pagamentos"** → Redireciona para Stripe Connect Onboarding
   - Botão **"Gerenciar cartão / pagamentos"** → Redireciona para Stripe Customer Portal
   - Botão **"Ver histórico"** → Redireciona para Stripe Customer Portal

5. **Regras Importantes:**
   - ❌ Stripe **NUNCA** deve ser embedado (iframe)
   - ✅ Sempre usar **redirecionamento seguro**
   - ✅ Após qualquer ação no Stripe, usuário retorna ao painel
   - ✅ Usuário **NUNCA** acessa Stripe diretamente
   - ✅ Toda interação começa e termina no painel administrativo
   - ✅ Toda lógica financeira via **WEBHOOKS**

---

## 📋 Contexto Atual

### Situação Atual do Sistema
- ✅ Stripe já está parcialmente integrado (Stripe direto, não Connect)
- ✅ Existe `stripe-service.js` com funções básicas
- ✅ Webhook handler implementado (`/api/webhooks/stripe`)
- ✅ Banco de dados com tabelas: `customers`, `plans`, `subscriptions`, `payments`, `manual_payments`
- ✅ Painel administrativo React já implementado
- ❌ **NÃO usa Stripe Connect** (usa Stripe direto)
- ❓ **Precisa confirmar:** É marketplace (múltiplas barbearias) ou uma única barbearia?

---

## ✅ Respostas Definidas (Escopo Confirmado)

### 1. Modelo de Negócio
- ✅ **Marketplace** (múltiplas barbearias)
- ✅ **Planejamento:**
  - Atual: 1 barbearia (Code Identidade Masculina)
  - Curto/médio prazo: 10–50 barbearias
  - Longo prazo: 100+ barbearias
- ✅ Cada barbearia terá sua própria conta Stripe Connect

### 2. Estrutura de Dados
- ✅ **Criar tabela `barbershops`** no banco
- ✅ Campos principais:
  - `id`, `nome`, `cidade`, `status`, `plano`
  - `stripe_account_id` (Connect)
  - `created_at`, `updated_at`
- ✅ Migrar dados existentes (se necessário)

### 3. Stripe Connect e Taxas
- ✅ **Conta Stripe:** Configurada em ambiente **TESTE (sandbox)**
- ✅ **Stripe Connect:** Será habilitado durante implementação
- ✅ **Taxa da plataforma:** **5%** (application_fee_percent)
  - Modelo: Percentual sobre transações
  - Futuro: Planos (Básico 5%, Pro 3%, Enterprise 0% + mensalidade)

### 4. Onboarding e Fluxo
- ✅ **Cada barbearia faz seu próprio onboarding** (marketplace)
- ✅ Fluxo:
  1. Barbearia acessa painel admin
  2. Vai em "Pagamentos"
  3. Clica "Conectar pagamentos"
  4. Redireciona para Stripe Connect Onboarding
  5. Conclui cadastro (dados bancários, CNPJ/CPF)
  6. Retorna para painel
  7. Status atualizado via webhook

### 5. Integração com WhatsApp Flow
- ⏳ **A definir durante implementação** (não é prioridade agora)

---

## 🎯 Objetivos da Implementação

### Objetivo Principal
Implementar pagamentos recorrentes via Stripe Connect (Express Accounts) para transformar o sistema em um marketplace onde:
- Cada barbearia recebe dinheiro diretamente
- Plataforma cobra taxa automaticamente
- Cliente cadastra cartão uma vez
- Pagamento é cobrado automaticamente todo mês

### Requisitos Técnicos Obrigatórios
1. ✅ Usar Stripe Connect com contas EXPRESS
2. ✅ NÃO salvar dados sensíveis de cartão
3. ✅ Usar Stripe Elements ou Checkout para tokenização
4. ✅ Lógica de status via WEBHOOK
5. ✅ Implementação PCI compliant

---

## 📊 Entidades no Banco (Modelo Sugerido)

### Tabela: `barbershops`
```sql
CREATE TABLE barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending', 'suspended')) DEFAULT 'pending',
  plano TEXT CHECK (plano IN ('basico', 'pro', 'enterprise')) DEFAULT 'basico',
  stripe_account_id TEXT UNIQUE, -- ID da conta Stripe Connect (acct_xxx)
  stripe_onboarding_completed BOOLEAN DEFAULT false,
  application_fee_percent DECIMAL(5, 2) DEFAULT 5.00, -- Taxa da plataforma (%)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_barbershops_status ON barbershops(status);
CREATE INDEX idx_barbershops_stripe_account_id ON barbershops(stripe_account_id);
```

### Tabela: `subscriptions` (MODIFICAR)
```sql
-- Adicionar campo barbershop_id
ALTER TABLE subscriptions
ADD COLUMN barbershop_id UUID REFERENCES barbershops(id);

-- Criar índice
CREATE INDEX idx_subscriptions_barbershop_id ON subscriptions(barbershop_id);
```

### Tabela: `payments` (MODIFICAR)
```sql
-- Já existe, mas pode precisar de ajustes
-- Verificar se precisa adicionar barbershop_id
```

---

## 🗂️ Tarefas de Implementação

### Fase 1: Preparação e Estrutura de Dados ✅ CONCLUÍDA
- [x] **T1.1:** Criar tabela `barbershops` no Supabase
  - Tabela criada com todos os campos necessários (id, nome, cidade, status, plano, stripe_account_id, stripe_onboarding_completed, application_fee_percent)
- [x] **T1.2:** Adicionar `barbershop_id` na tabela `subscriptions`
  - Coluna adicionada com foreign key para `barbershops(id)`
- [x] **T1.3:** Verificar e ajustar tabela `payments` se necessário
  - Tabela `payments` não precisa de `barbershop_id` (relaciona via subscription)
- [x] **T1.4:** Criar índices para performance
  - Índices criados: `idx_barbershops_status`, `idx_barbershops_stripe_account_id`, `idx_subscriptions_barbershop_id`
- [x] **T1.5:** Migrar dados existentes (se aplicável)
  - Não necessário (sistema novo)

### Fase 2: Backend - Stripe Connect Service ✅ CONCLUÍDA
- [x] **T2.1:** Criar `stripe-connect-service.js`
  - Arquivo criado em `src/services/stripe-connect-service.js`
- [x] **T2.2:** Implementar `createConnectAccount()` - Criar conta Express
  - Função implementada e exportada
- [x] **T2.3:** Implementar `createOnboardingLink()` - Gerar link de onboarding
  - Função implementada e exportada
- [x] **T2.4:** Implementar `createCheckoutSessionForConnect()` - Criar checkout na conta conectada
  - Função implementada (substitui `createSubscriptionForConnect` - usa Checkout ao invés de API direta)
- [x] **T2.5:** Implementar `getApplicationFeePercent()` - Calcular taxa da plataforma
  - Função implementada e exportada

### Fase 3: Backend - Rotas de API ✅ CONCLUÍDA
- [x] **T3.1:** `POST /api/stripe/connect/onboard` - Iniciar onboarding
  - Rota implementada em `src/routes/stripe-connect-routes.js`
- [x] **T3.2:** `GET /api/stripe/connect/status/:barbershopId` - Verificar status onboarding
  - Rota implementada
- [x] **T3.3:** `POST /api/stripe/connect/checkout` - Criar checkout para assinatura
  - Rota implementada (usa Checkout ao invés de API direta de subscription)
- [x] **T3.4:** `POST /api/stripe/connect/portal` - Link para portal do cliente
  - Rota implementada (POST ao invés de GET para segurança)

### Fase 4: Webhooks Stripe Connect ✅ CONCLUÍDA
- [x] **T4.1:** Atualizar `handleWebhookEvent()` para eventos Connect
- [x] **T4.2:** Implementar `account.updated` - Atualizar status onboarding
- [x] **T4.3:** Implementar `invoice.payment_succeeded` - Com application_fee (suporte Connect)
- [x] **T4.4:** Implementar `invoice.payment_failed` - Para conta conectada
- [x] **T4.5:** Implementar `customer.subscription.updated` - Para conta conectada
- [x] **T4.6:** Implementar `customer.subscription.deleted` - Para conta conectada (já existia)

### Fase 5: Frontend - Tela "Pagamentos" (HUB Financeiro) ✅ CONCLUÍDA
- [x] **T5.1:** Atualizar item "Pagamentos" no NavBar do Layout (já existia, atualizado para `/pagamentos`)
- [x] **T5.2:** Criar página `painel-admin/src/pages/Pagamentos.jsx` (React)
- [x] **T5.3:** Implementar layout conforme identidade da plataforma
- [x] **T5.4:** Mostrar status da conta Stripe (não conectada / em análise / ativa)
- [x] **T5.5:** Mostrar status da assinatura atual
- [x] **T5.6:** Mostrar valor do plano e próxima cobrança
- [x] **T5.7:** Adicionar aviso: "Pagamentos processados com segurança pelo Stripe"
- [x] **T5.8:** Botão "Conectar pagamentos" → Redireciona para Stripe Connect Onboarding
- [x] **T5.9:** Botão "Gerenciar cartão / pagamentos" → Redireciona para Stripe Customer Portal
- [x] **T5.10:** Botão "Ver histórico" → Redireciona para Stripe Customer Portal
- [x] **T5.11:** Integrar rota `/pagamentos` no `App.jsx`
- [x] **T5.12:** Adicionar endpoints no backend (`GET /api/admin/barbershops`, `GET /api/admin/barbershops/:id/subscription`)
- [x] **T5.13:** Adicionar funções de API no frontend (`buscarBarbershops`, `obterStatusStripeConnect`, etc.)

### Fase 6: Frontend - Onboarding (Redirecionamento) ✅ CONCLUÍDA
- [x] **T6.1:** Implementar redirecionamento seguro para Stripe Connect Onboarding
- [x] **T6.2:** Implementar callback após onboarding (retorno ao painel)
- [x] **T6.3:** Atualizar status da conta via webhook
- [x] **T6.4:** Adicionar loading state durante redirecionamento
- [x] **T6.5:** Melhorar tratamento de erros
- [x] **T6.6:** Configurar URLs dinâmicos baseados no ambiente

### Fase 7: Frontend - Cadastro de Cartão (Redirecionamento) ✅ CONCLUÍDA
- [x] **T7.1:** Usar Stripe Checkout (redirecionamento) ao invés de Elements
- [x] **T7.2:** Criar sessão de checkout no backend
- [x] **T7.3:** Redirecionar para Stripe Checkout
- [x] **T7.4:** Implementar callback após checkout (retorno ao painel)
- [x] **T7.5:** Criar assinatura após checkout bem-sucedido
- [x] **T7.6:** Adicionar modal de seleção de planos
- [x] **T7.7:** Adicionar botão "Criar Assinatura" quando não houver assinatura ativa
- [x] **T7.8:** Melhorar tratamento de erros e loading states

### Fase 8: Frontend - Gerenciamento de Assinatura ✅ CONCLUÍDA
- [x] **T8.1:** Mostrar status da assinatura na tela "Pagamentos"
- [x] **T8.2:** Mostrar próxima cobrança
- [x] **T8.3:** Botão "Gerenciar pagamento" → Redireciona para Stripe Customer Portal
- [x] **T8.4:** Aviso: "Pagamentos processados pelo Stripe"

### Fase 8: Regras de Negócio ✅ CONCLUÍDA
- [x] **T8.1:** Implementar lógica de `past_due` após falha
- [x] **T8.2:** Suspender automações após X dias sem pagamento (configurável via `DAYS_TO_SUSPEND_BARBERSHOP`, padrão: 7 dias)
- [x] **T8.3:** Reativar automaticamente quando pagamento normalizar
- [x] **T8.4:** Sincronizar cancelamento do Stripe com painel

### Fase 9: Segurança e Validações ✅ CONCLUÍDA
- [x] **T9.1:** Validar assinatura do webhook Stripe
  - Implementado em `src/routes/stripe-routes.js`
  - Validação obrigatória usando `stripe.webhooks.constructEvent()`
  - Rejeição de requisições sem assinatura
  - Logs detalhados de tentativas inválidas
- [x] **T9.2:** Usar variáveis de ambiente para API Keys
  - `STRIPE_SECRET_KEY` - Chave secreta da API
  - `STRIPE_WEBHOOK_SECRET` - Secret para validação de webhooks
  - `DAYS_TO_SUSPEND_BARBERSHOP` - Configuração de suspensão (opcional)
  - Validação de configuração antes de processar webhooks
- [x] **T9.3:** Logs de eventos críticos
  - Logs de segurança para eventos críticos (checkout, subscription deleted, payment failed, account updated)
  - Informações registradas: tipo, ID, timestamp, IP, user-agent
  - Stack traces em caso de erros
- [x] **T9.4:** Testes de segurança
  - Documentação completa em `docs/TESTES_SEGURANCA_STRIPE.md`
  - Testes manuais documentados
  - Recomendações para rate limiting e monitoramento

### Fase 10: Testes e Deploy
- [ ] **T10.1:** Testes unitários dos serviços
- [ ] **T10.2:** Testes de integração com Stripe (modo teste)
- [ ] **T10.3:** Testes de webhooks
- [ ] **T10.4:** Deploy em staging
- [ ] **T10.5:** Deploy em produção

---

## 🔧 Arquivos a Criar/Modificar

### Novos Arquivos
- `src/services/stripe-connect-service.js` - Serviço principal do Stripe Connect
- `src/routes/stripe-connect-routes.js` - Rotas de API do Connect
- `painel-admin/src/pages/Pagamentos.jsx` - **Tela principal "Pagamentos" (HUB Financeiro)**
- `docs/MIGRACAO_STRIPE_CONNECT.md` - Guia de migração

### Arquivos a Modificar
- `src/services/stripe-service.js` - Adicionar suporte a Connect
- `src/routes/stripe-routes.js` - Atualizar webhooks
- `src/services/subscription-service.js` - Adicionar suporte a Connect (se marketplace)
- `painel-admin/src/components/Layout.jsx` - **Adicionar item "Pagamentos" no NavBar** (ou renomear "Payments" existente)
- `painel-admin/src/App.jsx` - **Adicionar rota `/pagamentos`**
- `painel-admin/src/utils/api.js` - Adicionar funções para Stripe Connect

---

## 📝 Notas Importantes

### Variáveis de Ambiente Necessárias
```env
STRIPE_SECRET_KEY=sk_... (chave da plataforma)
STRIPE_PUBLISHABLE_KEY=pk_... (chave pública)
STRIPE_WEBHOOK_SECRET=whsec_... (secret do webhook)
STRIPE_CONNECT_CLIENT_ID=ca_... (se usar OAuth, opcional)
```

### Webhooks Necessários no Stripe Dashboard
- `account.updated` - Status do onboarding
- `checkout.session.completed` - Checkout concluído
- `invoice.payment_succeeded` - Pagamento bem-sucedido
- `invoice.payment_failed` - Pagamento falhou
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada

### Fluxo de Onboarding (Redirecionamento)
1. Admin acessa tela "Pagamentos" no painel
2. Clica em "Conectar pagamentos"
3. Backend cria conta Stripe Connect Express (se necessário)
4. Backend gera link de onboarding do Stripe
5. **Frontend redireciona** para link do Stripe (não iframe)
6. Admin completa onboarding no Stripe
7. Stripe redireciona de volta para painel (callback URL)
8. Webhook `account.updated` atualiza status no banco
9. Tela "Pagamentos" mostra status "Ativa"

### Fluxo de Criação de Assinatura (Redirecionamento)
1. Cliente escolhe plano no painel
2. Admin clica em "Cadastrar cartão" ou similar
3. Backend cria sessão de Stripe Checkout
4. **Frontend redireciona** para Stripe Checkout (não iframe)
5. Cliente cadastra cartão no Stripe
6. Stripe redireciona de volta para painel (success URL)
7. Webhook `checkout.session.completed` processa pagamento
8. Sistema cria subscription na conta conectada (se marketplace)
9. Sistema define `application_fee_amount` (se marketplace)
10. Sistema define `transfer_data.destination` (se marketplace)
11. Stripe cobra cliente
12. Dinheiro cai na conta da barbearia (ou plataforma)
13. Taxa cai na conta da plataforma (se marketplace)
14. Webhook atualiza status no banco
15. Tela "Pagamentos" mostra assinatura ativa

### Fluxo de Gerenciamento (Redirecionamento)
1. Admin acessa tela "Pagamentos"
2. Clica em "Gerenciar cartão / pagamentos"
3. Backend cria sessão do Stripe Customer Portal
4. **Frontend redireciona** para Stripe Customer Portal (não iframe)
5. Admin gerencia pagamento no Stripe
6. Stripe redireciona de volta para painel
7. Webhooks atualizam status no banco
8. Tela "Pagamentos" mostra informações atualizadas

---

## ⚠️ Riscos e Considerações

### Riscos
- **Migração de dados:** Pode ser complexa se houver dados existentes
- **Downtime:** Pode haver período de indisponibilidade durante migração
- **Compatibilidade:** Sistema atual pode quebrar durante implementação

### Considerações
- **Testes:** Sempre testar em modo teste do Stripe primeiro
- **Rollback:** Ter plano de rollback caso algo dê errado
- **Documentação:** Documentar todas as mudanças

---

## 📅 Próximos Passos

### ⚠️ ANTES DE COMEÇAR A IMPLEMENTAR

**Responder TODAS as perguntas da seção "❓ Perguntas para Definir Escopo"**

### Ordem de Implementação (após respostas)

1. **Responder perguntas** para definir escopo exato
2. **Ajustar estrutura de dados** no Supabase (se necessário)
3. **Implementar Fase 1** (Preparação e Estrutura de Dados)
4. **Implementar Fase 2** (Backend - Stripe Connect Service)
5. **Implementar Fase 3** (Backend - Rotas de API)
6. **Implementar Fase 4** (Webhooks Stripe Connect)
7. **Implementar Fase 5** (Frontend - Tela "Pagamentos")
8. **Implementar Fase 6** (Frontend - Onboarding)
9. **Implementar Fase 7** (Frontend - Cadastro de Cartão)
10. **Implementar Fase 8** (Frontend - Gerenciamento)
11. **Implementar Fase 9** (Regras de Negócio)
12. **Implementar Fase 10** (Testes e Deploy)

---

## 🎯 Resumo das Perguntas Críticas

**Responda estas perguntas antes de começar:**

1. **É marketplace (múltiplas barbearias) ou uma única barbearia?**
2. **Qual a taxa (application_fee) que a plataforma vai cobrar?**
3. **Quem faz o onboarding? (Admin da plataforma ou cada barbearia?)**
4. **Já tem conta Stripe configurada? (Teste ou produção?)**

---

**Última atualização:** 05/01/2026  
**Status:** 📋 Aguardando respostas para definir escopo  
**Próxima ação:** Responder perguntas da seção "❓ Perguntas para Definir Escopo"

