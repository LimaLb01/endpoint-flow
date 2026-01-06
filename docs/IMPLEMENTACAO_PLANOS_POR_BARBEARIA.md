# Implementação: Planos por Barbearia com Stripe Connect

**Data:** 06/01/2026  
**Status:** ✅ Implementado

---

## 📋 Arquitetura Implementada

### Decisões de Arquitetura

1. ✅ **Planos são por barbearia** (não globais)
2. ✅ **Cada barbearia cria seus próprios planos**
3. ✅ **Tabela `plans` tem `barbershop_id`**
4. ✅ **Produtos criados na conta Stripe Connect da barbearia**
5. ✅ **Bloqueio se Stripe Connect não configurado**
6. ✅ **Cliente nunca acessa Stripe Dashboard**

---

## 🗄️ Mudanças no Banco de Dados

### Tabela `plans` - Novos Campos

```sql
ALTER TABLE plans 
ADD COLUMN barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE;

ALTER TABLE plans 
ADD COLUMN stripe_product_id TEXT;

CREATE INDEX idx_plans_barbershop_id ON plans(barbershop_id);
```

**Campos adicionados:**
- `barbershop_id` - UUID da barbearia (obrigatório)
- `stripe_product_id` - ID do produto no Stripe (prod_xxx)

---

## 🔧 Mudanças no Backend

### 1. `stripe-products-service.js` - Suporte a Stripe Connect

**Funções atualizadas:**
- `createProduct()` - Aceita `stripeAccount` (conta Connect)
- `createPrice()` - Aceita `stripeAccount` (conta Connect)
- `createProductAndPriceFromPlan()` - Cria produtos na conta Connect

**Exemplo de uso:**
```javascript
// Criar produto na conta Connect da barbearia
const product = await createProduct({
  name: 'Plano Mensal',
  description: 'Assinatura mensal',
  stripeAccount: 'acct_1SmhMIHClmeWTuet' // Conta Connect
});
```

### 2. `plans-service.js` - Validações e Criação Automática

**Validações implementadas:**
- ✅ `barbershop_id` é obrigatório
- ✅ Barbearia deve ter `stripe_account_id`
- ✅ Onboarding do Stripe deve estar completo
- ✅ Produto/preço criados automaticamente na conta Connect

**Fluxo de criação:**
```javascript
1. Validar barbershop_id
2. Buscar barbearia no banco
3. Validar stripe_account_id existe
4. Validar stripe_onboarding_completed === true
5. Criar produto no Stripe Connect (stripeAccount)
6. Criar preço no Stripe Connect (stripeAccount)
7. Salvar plano com barbershop_id, stripe_product_id, stripe_price_id
```

### 3. `admin-routes.js` - Rotas Atualizadas

**GET `/api/admin/plans`:**
- Aceita `barbershop_id` na query
- Filtra planos por barbearia

**POST `/api/admin/plans`:**
- Aceita `barbershop_id` no body
- Valida Stripe Connect antes de criar
- Cria produto/preço automaticamente

---

## 🎨 Mudanças no Frontend

### 1. `Planos.jsx` - Gerenciamento por Barbearia

**Novos estados:**
- `barbershopId` - ID da barbearia logada
- `stripeConnected` - Status do Stripe Connect

**Validações:**
- ✅ Verifica Stripe Connect antes de criar plano
- ✅ Mostra mensagem clara se não estiver conectado
- ✅ Envia `barbershop_id` nas requisições

**Fluxo:**
```javascript
1. Carregar barbearia (buscarBarbershops)
2. Verificar status Stripe Connect
3. Carregar planos da barbearia
4. Ao criar plano, validar Stripe Connect
5. Enviar barbershop_id no body
```

### 2. `api.js` - Funções Atualizadas

**`listarPlanos(active, barbershopId)`:**
- Aceita `barbershopId` como parâmetro
- Inclui na query string

**`criarPlano(dados)`:**
- `dados` deve incluir `barbershop_id`

---

## 🔄 Fluxo Completo

### Criação de Plano

```
1. Usuário acessa "Planos"
   ↓
2. Sistema busca barbearia do usuário
   ↓
3. Sistema verifica Stripe Connect
   ↓
4. Usuário clica "Novo Plano"
   ↓
5. Sistema valida Stripe Connect (se não conectado, bloqueia)
   ↓
6. Usuário preenche dados do plano
   ↓
7. Usuário clica "Criar Plano"
   ↓
8. Backend valida:
   - barbershop_id existe
   - stripe_account_id existe
   - stripe_onboarding_completed === true
   ↓
9. Backend cria produto no Stripe Connect:
   stripe.products.create(..., { stripeAccount: barbershop.stripe_account_id })
   ↓
10. Backend cria preço no Stripe Connect:
    stripe.prices.create(..., { stripeAccount: barbershop.stripe_account_id })
    ↓
11. Backend salva plano no banco:
    - barbershop_id
    - stripe_product_id
    - stripe_price_id
    ↓
12. ✅ Plano criado com sucesso!
```

---

## ✅ Validações Implementadas

### Backend

1. **`barbershop_id` obrigatório:**
   ```javascript
   if (!barbershop_id) {
     throw new Error('barbershop_id é obrigatório');
   }
   ```

2. **Barbearia existe:**
   ```javascript
   const barbershop = await getBarbershopById(barbershop_id);
   if (!barbershop) {
     throw new Error('Barbearia não encontrada');
   }
   ```

3. **Stripe Connect configurado:**
   ```javascript
   if (!barbershop.stripe_account_id) {
     throw new Error('Antes de criar planos, conecte sua conta de pagamento (Stripe).');
   }
   ```

4. **Onboarding completo:**
   ```javascript
   if (!barbershop.stripe_onboarding_completed) {
     throw new Error('Onboarding do Stripe não foi concluído.');
   }
   ```

### Frontend

1. **Validação antes de abrir modal:**
   ```javascript
   if (!stripeConnected) {
     toast.error('Conecte sua conta Stripe primeiro');
     return;
   }
   ```

2. **Validação antes de criar:**
   ```javascript
   if (!barbershopId) {
     toast.error('Barbearia não identificada');
     return;
   }
   ```

---

## 🎯 Benefícios da Arquitetura

1. ✅ **Isolamento:** Cada barbearia tem seus próprios produtos
2. ✅ **Escalabilidade:** Fácil adicionar novas barbearias
3. ✅ **Relatórios separados:** Cada barbearia vê seus próprios produtos
4. ✅ **Sem conflitos:** Preços podem ser diferentes por barbearia
5. ✅ **Liberdade comercial:** Cada barbearia define seus preços
6. ✅ **Automação:** Cliente nunca acessa Stripe Dashboard

---

## 📝 Próximos Passos

### Melhorias Futuras

1. **JWT com `barbershop_id`:**
   - Incluir `barbershop_id` no token JWT
   - Remover necessidade de enviar no body/query

2. **Sincronização:**
   - Botão "Sincronizar com Stripe" para planos existentes
   - Atualizar produtos no Stripe quando plano é editado

3. **Visualização:**
   - Mostrar produtos Stripe no painel
   - Link para produto no Stripe Dashboard (opcional)

4. **Validação de preços:**
   - Verificar se preço no Stripe corresponde ao preço do plano
   - Alertar se houver divergência

---

## 🧪 Testes Necessários

1. ✅ Criar plano com Stripe Connect configurado
2. ✅ Tentar criar plano sem Stripe Connect (deve bloquear)
3. ✅ Listar planos por barbearia
4. ✅ Verificar produto criado na conta Connect correta
5. ✅ Verificar preço criado na conta Connect correta
6. ✅ Criar assinatura usando plano da barbearia

---

## ✅ Checklist de Implementação

- [x] Adicionar `barbershop_id` na tabela `plans`
- [x] Adicionar `stripe_product_id` na tabela `plans`
- [x] Modificar `stripe-products-service.js` para aceitar `stripeAccount`
- [x] Modificar `plans-service.js` para validar Stripe Connect
- [x] Modificar `plans-service.js` para criar produtos na conta Connect
- [x] Modificar rotas para aceitar `barbershop_id`
- [x] Modificar frontend para buscar `barbershop_id`
- [x] Modificar frontend para validar Stripe Connect
- [x] Modificar frontend para enviar `barbershop_id` nas requisições
- [ ] Testar criação de plano
- [ ] Testar validações
- [ ] Testar criação de produto no Stripe Connect

