# Testes: Sincronização de Plano com Stripe Connect

**Data:** 06/01/2026  
**Status:** ⏳ Aguardando Deploy

---

## ✅ Implementação Concluída

### 1. Rota Criada
- **Endpoint:** `POST /api/admin/plans/:id/sync-stripe`
- **Posição:** Antes de `/plans/:id` (para evitar conflito de rotas)
- **Autenticação:** Requerida (`requireAuth`)

### 2. Função Frontend
- **Arquivo:** `painel-admin/src/utils/api.js`
- **Função:** `sincronizarPlanoStripe(planId)`

### 3. Validações Implementadas
- ✅ Plano existe
- ✅ Plano não tem produto/preço já criados
- ✅ Plano tem `barbershop_id`
- ✅ Barbearia existe
- ✅ Barbearia tem `stripe_account_id`
- ✅ Onboarding do Stripe está completo
- ✅ Stripe está configurado no servidor

---

## 🧪 Testes a Realizar

### Teste 1: Sincronização do "Plano Teste"
- **Plano ID:** `59e7fbae-4c1c-48c9-be15-28817c3439ba`
- **Status Atual:**
  - `barbershop_id`: ✅ `612ea2c6-fa46-4e12-b3a5-91a3b605d53f`
  - `stripe_product_id`: ❌ `null`
  - `stripe_price_id`: ❌ `null`

### Teste 2: Verificar Criação no Stripe Connect
- Verificar se produto foi criado na conta Connect da barbearia
- Verificar se preço foi criado na conta Connect da barbearia
- Verificar se IDs foram salvos no banco

### Teste 3: Verificar Logs
- Verificar logs do Railway para confirmar criação
- Verificar se não houve erros

---

## ⚠️ Problema Identificado

### Rota Retornando 404
- **Causa:** Código ainda não foi deployado no Railway
- **Solução:** Aguardar deploy ou testar localmente

### Ordem das Rotas Corrigida
- A rota `sync-stripe` foi movida para ANTES de `/plans/:id`
- Isso evita conflito de rotas no Express

---

## 📋 Próximos Passos

1. **Fazer deploy** do código atualizado
2. **Testar sincronização** do "Plano Teste"
3. **Verificar criação** no Stripe Connect
4. **Verificar atualização** no banco de dados

---

**Última atualização:** 06/01/2026  
**Status:** ⏳ Aguardando Deploy para Testar

