# 📋 Contexto Completo do Projeto FlowBrasil

**Última atualização:** 06/01/2026  
**Status:** Em desenvolvimento ativo

---

## 🎯 Visão Geral do Projeto

**Nome:** FlowBrasil  
**Tipo:** Marketplace SaaS para barbearias  
**Objetivo:** Plataforma que conecta barbearias com clientes via WhatsApp Flow, gerencia assinaturas e processa pagamentos via Stripe Connect

---

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Backend:** Node.js + Express (deploy no Railway)
- **Frontend:** React + Vite (painel-admin)
- **Database:** Supabase (PostgreSQL)
- **Pagamentos:** Stripe Connect (Express Accounts - Marketplace)
- **Deploy:** Automático via GitHub → Railway
- **Autenticação:** JWT

### Estrutura de Diretórios
```
endpoint-flow/
├── src/                    # Backend
│   ├── services/          # Lógica de negócio
│   ├── routes/            # Rotas da API
│   └── middleware/        # Middlewares (auth, etc)
├── painel-admin/          # Frontend React
│   └── src/
│       ├── pages/         # Páginas do admin
│       ├── components/    # Componentes reutilizáveis
│       └── utils/         # Utilitários (API client, etc)
└── docs/                  # Documentação
```

---

## ✅ Melhorias Implementadas no Painel Admin

### 1. ✅ Dashboard com Gráficos e Métricas
- Gráficos de receita (últimos 6 meses)
- Funil de conversão do Flow
- Cards de alertas
- Comparação mês anterior
- Top 5 clientes por receita
- Taxa de conversão do Flow
- Receita por plano (gráfico de pizza)

### 2. ✅ Integração com Google Calendar
- Visualização de agendamentos
- Calendário mensal/semanal
- Filtros (barbeiro, data, status)
- Ações: cancelar, reagendar, ver detalhes
- Sincronização em tempo real
- Atualização automática a cada 15 segundos
- Botão manual de atualização

### 3. ✅ Analytics do Flow
- Funil de conversão visual
- Taxa de abandono por etapa
- Tempo médio por etapa
- Gráfico de interações ao longo do tempo
- Heatmap de horários
- Análise de localização
- Seleção múltipla e exclusão em lote

### 4. ✅ Relatórios e Exportação
- Relatório financeiro (mensal/anual)
- Exportar clientes (CSV)
- Exportar pagamentos
- Relatório de assinaturas
- Relatório de agendamentos

### 5. ✅ Gerenciamento de Planos
- Criar/Editar/Desativar planos
- Histórico de alterações de preço
- Estatísticas por plano
- Filtros (Todos/Ativos/Inativos)

### 6. ✅ Notificações e Alertas
- Badge de notificações no header
- Alertas de assinaturas vencendo (7 dias)
- Pagamentos pendentes
- Agendamentos cancelados
- Novos clientes (últimas 24h)

### 7. ✅ Busca Avançada
- Busca global (clientes, assinaturas, pagamentos)
- Filtros avançados (data, valor, status)
- Histórico de buscas recentes
- Busca por CPF

### 8. ✅ Melhorias de UX
- Atalhos de teclado (Ctrl+K para busca, Esc para modais)
- Modo escuro completo
- Loading skeletons
- Animações de transição
- Feedback visual em ações
- Tooltips informativos
- Toast notifications

---

## 💳 Implementação Stripe Connect

### Fases Concluídas (1-9)

#### Fase 1: Estrutura de Dados ✅
- Tabela `barbershops` criada
- Campo `barbershop_id` adicionado em `subscriptions`
- Campo `barbershop_id` e `stripe_product_id` adicionados em `plans`

#### Fase 2: Backend Service ✅
- `src/services/stripe-connect-service.js` criado
- Funções: criar conta Connect, onboarding link, checkout, customer portal

#### Fase 3: Backend Routes ✅
- `src/routes/stripe-connect-routes.js` criado
- Endpoints: `/api/stripe/connect/onboard`, `/api/stripe/connect/status/:barbershopId`, etc.

#### Fase 4: Webhooks ✅
- `account.updated` - atualiza status de onboarding
- `checkout.session.completed` - cria assinatura
- `customer.subscription.updated` - atualiza status
- `invoice.payment_succeeded` - confirma pagamento
- `invoice.payment_failed` - marca como pendente
- `customer.subscription.deleted` - cancela assinatura

#### Fase 5: Frontend - Hub de Pagamentos ✅
- `painel-admin/src/pages/Pagamentos.jsx` criado
- Exibe status da conta Stripe Connect
- Botões: "Conectar pagamentos", "Gerenciar Cartão", "Ver Histórico", "Criar Assinatura"

#### Fase 6: Onboarding Redirection ✅
- Redirecionamento para Stripe Connect Onboarding
- Callback para atualizar status no banco

#### Fase 7: Cadastro de Cartão via Checkout ✅
- Modal de seleção de planos
- Redirecionamento para Stripe Checkout
- Criação de assinatura

#### Fase 8: Regras de Negócio ✅
- Status `past_due` implementado
- Suspensão automática após X dias de pagamento falho
- Reativação automática ao pagar
- Sincronização de cancelamento

#### Fase 9: Segurança e Validações ✅
- Validação de assinatura de webhook
- Logging de eventos críticos
- Uso correto de variáveis de ambiente

### Fase 10: Testes e Deploy 🔄 (EM ANDAMENTO)

**Status Atual:**
- ✅ Validação de Stripe Connect funcionando
- ⚠️ **PROBLEMA:** Campo de preço no formulário não captura valor
- ⏳ Aguardando correção para testar criação completa

**Problema Identificado:**
- Campo de preço (`formData.price`) não está sendo atualizado quando usuário digita
- Erro: "Nome, tipo e preço são obrigatórios" mesmo com campos preenchidos
- Campo foi alterado de `type="number"` para `type="text"` mas ainda não funciona

---

## 🏪 Modelo de Marketplace

### Arquitetura de Planos
- **Modelo:** Planos por barbearia (NÃO globais)
- **Criação:** Cada barbearia cria seus próprios planos
- **Stripe:** Produtos/preços criados automaticamente na conta Connect da barbearia
- **Validação:** Bloqueia criação se Stripe Connect não estiver configurado

### Fluxo de Criação de Plano
1. Barbearia acessa painel → "Planos"
2. Clica em "Novo Plano"
3. Preenche formulário (nome, tipo, preço, descrição)
4. Sistema valida Stripe Connect configurado
5. Sistema cria produto no Stripe Connect da barbearia
6. Sistema cria preço no Stripe Connect da barbearia
7. Sistema salva plano no banco com `barbershop_id`, `stripe_product_id`, `stripe_price_id`

### Taxa da Plataforma
- `application_fee_percent = 5%` (inicial)
- Cobrada automaticamente via Stripe Connect
- Planos futuros para taxas escalonadas

---

## 🔐 Variáveis de Ambiente

### Railway (Backend)
- `STRIPE_SECRET_KEY` ✅ Configurado
- `STRIPE_PUBLISHABLE_KEY` ✅ Configurado
- `STRIPE_WEBHOOK_SECRET` ⚠️ Verificar se configurado
- `FRONTEND_URL` ✅ Configurado (http://localhost:5173)
- `SUPABASE_URL` ✅ Configurado
- `SUPABASE_SERVICE_ROLE_KEY` ✅ Configurado
- `DAYS_TO_SUSPEND_BARBERSHOP` ⚠️ Verificar se configurado

### Supabase
- Projeto: FlowBrasil
- RLS: Habilitado
- Índices: Criados para performance

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `barbershops`
```sql
- id (UUID)
- nome (TEXT)
- cidade (TEXT)
- status (TEXT) - 'active', 'suspended', 'inactive'
- plano (TEXT)
- stripe_account_id (TEXT) - ID da conta Connect
- stripe_onboarding_completed (BOOLEAN)
- application_fee_percent (NUMERIC) - Default: 5
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `plans`
```sql
- id (UUID)
- barbershop_id (UUID) - NOVO
- name (TEXT)
- description (TEXT)
- price (NUMERIC)
- type (TEXT) - 'monthly', 'yearly', 'one_time'
- currency (TEXT) - Default: 'BRL'
- stripe_product_id (TEXT) - NOVO
- stripe_price_id (TEXT)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `subscriptions`
```sql
- id (UUID)
- barbershop_id (UUID) - NOVO
- customer_id (TEXT)
- plan_id (UUID)
- stripe_subscription_id (TEXT)
- status (TEXT)
- current_period_start (TIMESTAMP)
- current_period_end (TIMESTAMP)
- ...
```

---

## 🔧 Arquivos Importantes

### Backend
- `src/services/stripe-connect-service.js` - Lógica do Stripe Connect
- `src/services/stripe-products-service.js` - Criação automática de produtos/preços
- `src/services/plans-service.js` - CRUD de planos (com validação de Stripe Connect)
- `src/services/stripe-service.js` - Webhooks e lógica de pagamentos
- `src/routes/stripe-connect-routes.js` - Rotas do Stripe Connect
- `src/routes/admin-routes.js` - Rotas do admin (inclui planos filtrados por barbershop_id)

### Frontend
- `painel-admin/src/pages/Pagamentos.jsx` - Hub de pagamentos
- `painel-admin/src/pages/Planos.jsx` - Gerenciamento de planos (⚠️ problema no campo de preço)
- `painel-admin/src/utils/api.js` - Cliente API (inclui funções para Stripe Connect)
- `painel-admin/src/components/Layout.jsx` - Layout com navegação

### Documentação
- `docs/PLANEJAMENTO_STRIPE_CONNECT.md` - Planejamento completo das fases
- `docs/IMPLEMENTACAO_PLANOS_POR_BARBEARIA.md` - Detalhes da implementação de planos por barbearia
- `docs/TESTES_PLANOS_STRIPE_CONNECT.md` - Testes em andamento
- `docs/MELHORIAS_PAINEL_ADMINISTRATIVO.md` - Status das melhorias

---

## 🐛 Problemas Conhecidos

### 1. Campo de Preço Não Captura Valor ⚠️ URGENTE
**Arquivo:** `painel-admin/src/pages/Planos.jsx`  
**Descrição:** Campo de preço não atualiza `formData.price` quando usuário digita  
**Tentativas:**
- Alterado de `type="number"` para `type="text"`
- Adicionado logs de debug
- Adicionado sanitização de input

**Próximos Passos:**
1. Verificar se `onChange` está sendo disparado
2. Verificar se há `useEffect` resetando o valor
3. Testar com `useRef` para acessar valor diretamente

---

## 📝 Próximos Passos

### Imediato
1. ✅ Corrigir captura do campo de preço
2. ⏳ Testar criação completa de plano
3. ⏳ Verificar criação de produto/preço no Stripe Connect
4. ⏳ Validar que produto é criado na conta Connect correta

### Curto Prazo
- Testar criação de assinatura com plano criado automaticamente
- Implementar autenticação por barbearia (atualmente usa primeira barbearia encontrada)
- Adicionar validação de `DAYS_TO_SUSPEND_BARBERSHOP` no backend

### Médio Prazo
- Implementar taxas escalonadas por volume
- Dashboard de analytics por barbearia
- Relatórios por barbearia

---

## 🔗 Links Úteis

- **Railway Dashboard:** https://railway.app
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **GitHub Repo:** (verificar URL do repositório)

---

## 📞 Informações de Acesso

### Painel Admin
- **URL Local:** http://localhost:5173
- **URL Produção:** (verificar no Railway)
- **Login:** (verificar credenciais)

### Stripe
- **Modo:** Test (sandbox)
- **Connect:** Habilitado (Marketplace)
- **Conta Connect Test:** `acct_1SmhMIHClmeWTuet` (Code Identidade Masculina)

---

## 🎯 Decisões Arquiteturais Importantes

1. **Planos por Barbearia:** Cada barbearia tem seus próprios planos
2. **Stripe Connect:** Produtos criados na conta Connect da barbearia, não na plataforma
3. **Criação Automática:** Sistema cria produto/preço automaticamente via API
4. **Bloqueio sem Connect:** Não permite criar plano sem Stripe Connect configurado
5. **Webhooks:** Toda lógica financeira vem via webhook (status, pagamento, cancelamento)
6. **Redirecionamento Seguro:** Nunca usa iframe, sempre redirecionamento para Stripe

---

## 📚 Comandos Úteis

### Deploy
```bash
git add -A
git commit -m "mensagem"
git push origin main
# Railway faz deploy automático
```

### Verificar Logs Railway
```bash
# Via MCP Railway ou dashboard
```

### Testar Localmente
```bash
# Backend
cd endpoint-flow
npm start

# Frontend
cd painel-admin
npm run dev
```

---

**Nota:** Este documento deve ser atualizado sempre que houver mudanças significativas no projeto.

