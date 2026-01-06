# Problema: Plano Criado sem barbershop_id

**Data:** 06/01/2026  
**Status:** ⚠️ Problema Identificado e Corrigido Parcialmente

---

## 🔍 Problema Identificado

O plano "Plano Teste" foi criado com sucesso, mas apresentou os seguintes problemas:

### Dados do Plano Criado
```sql
id: 59e7fbae-4c1c-48c9-be15-28817c3439ba
name: "Plano Teste "
type: "monthly"
price: "149.90"
currency: "BRL"
description: "Descrição do plano teste"
active: true
barbershop_id: null ❌ (deveria ter o ID da barbearia)
stripe_product_id: null ❌ (deveria ter sido criado no Stripe Connect)
stripe_price_id: null ❌ (deveria ter sido criado no Stripe Connect)
```

### Problemas
1. ❌ **`barbershop_id` está `null`** - Plano não está associado à barbearia
2. ❌ **`stripe_product_id` está `null`** - Produto não foi criado no Stripe Connect
3. ❌ **`stripe_price_id` está `null`** - Preço não foi criado no Stripe Connect

---

## 🔧 Correção Aplicada

### 1. Atualização do `barbershop_id`
```sql
UPDATE plans 
SET barbershop_id = '612ea2c6-fa46-4e12-b3a5-91a3b605d53f' 
WHERE id = '59e7fbae-4c1c-48c9-be15-28817c3439ba';
```

✅ **Status:** Corrigido - `barbershop_id` agora está associado à barbearia

### 2. Criação de Produto/Preço no Stripe Connect
⏳ **Status:** Pendente - Precisa criar produto/preço no Stripe Connect

---

## 🔍 Análise da Causa

### Validações no Backend
O backend tem validações que deveriam bloquear a criação sem `barbershop_id`:

**Rota (`src/routes/admin-routes.js` linha 578-582):**
```javascript
if (!finalBarbershopId) {
  return res.status(400).json({
    error: 'barbershop_id é obrigatório',
    message: 'É necessário informar o ID da barbearia para criar o plano'
  });
}
```

**Serviço (`src/services/plans-service.js` linha 99-101):**
```javascript
if (!barbershop_id) {
  throw new Error('barbershop_id é obrigatório');
}
```

### Possíveis Causas
1. **Frontend não enviou `barbershop_id`** - `barbershopId` estava `null` no momento da criação
2. **Validação não funcionou** - `barbershop_id` foi enviado como string vazia `""` ou `undefined`
3. **Problema na inserção** - `barbershop_id` foi enviado mas não foi salvo no banco

---

## ✅ Próximos Passos

### 1. Criar Produto/Preço no Stripe Connect
Precisa criar uma rota ou script para sincronizar planos existentes:

```javascript
// Exemplo de função para sincronizar
async function syncPlanToStripe(planId) {
  const plan = await getPlanById(planId);
  const barbershop = await getBarbershopById(plan.barbershop_id);
  
  if (!barbershop.stripe_account_id) {
    throw new Error('Barbearia não tem Stripe Connect configurado');
  }
  
  const stripeResult = await createProductAndPriceFromPlan({
    ...plan,
    stripeAccount: barbershop.stripe_account_id,
  });
  
  // Atualizar plano com IDs do Stripe
  await updatePlan(planId, {
    stripe_product_id: stripeResult.productId,
    stripe_price_id: stripeResult.priceId,
  });
}
```

### 2. Investigar Por Que Validação Não Funcionou
- Verificar logs do Railway no momento da criação
- Verificar se `barbershopId` estava `null` no frontend
- Adicionar logs mais detalhados na validação

### 3. Melhorar Validação
- Adicionar validação mais rigorosa (verificar se é string vazia)
- Adicionar logs antes e depois da validação
- Garantir que `barbershop_id` sempre seja enviado do frontend

---

## 📊 Dados da Barbearia

```sql
id: 612ea2c6-fa46-4e12-b3a5-91a3b605d53f
nome: "Code Identidade Masculina"
stripe_account_id: "acct_1SmhMIHClmeWTuet" ✅
stripe_onboarding_completed: true ✅
```

A barbearia tem Stripe Connect configurado corretamente, então o produto/preço deveriam ter sido criados automaticamente.

---

## 🧪 Teste Manual Necessário

1. Criar um novo plano via interface
2. Verificar se `barbershop_id` é enviado corretamente
3. Verificar se produto/preço são criados no Stripe Connect
4. Verificar logs do backend para entender o fluxo completo

---

**Última atualização:** 06/01/2026  
**Status:** ⚠️ `barbershop_id` corrigido | ⏳ Produto/Preço no Stripe Connect pendente

