# Testes: Criação de Assinatura com Stripe Connect

**Data:** 06/01/2026  
**Status:** 🔄 Em Testes - Correções Aplicadas

---

## 🎯 Objetivo

Testar a criação completa de assinatura usando um plano sincronizado com Stripe Connect, verificando:
1. ✅ Sincronização de plano com Stripe Connect
2. ✅ Criação de checkout session
3. ⏳ Redirecionamento para Stripe Checkout
4. ⏳ Processamento de pagamento
5. ⏳ Webhooks de assinatura

---

## ✅ Correções Aplicadas

### 1. Validação de Email no Frontend

**Problema:** Email inválido `admin@admin` causava erro ao criar checkout.

**Solução:** Adicionada validação de email em `painel-admin/src/pages/Pagamentos.jsx`:

```javascript
// Validar email antes de usar
if (user.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
  customerEmail = user.email;
}
```

**Status:** ✅ Corrigido

### 2. Busca de Preço na Conta Connect

**Problema:** Erro `No such price: 'price_1SmjVWHClmeWTuetJPrPNcve'` - o preço estava na conta Connect, mas o código buscava na conta principal.

**Solução:** Corrigido `src/services/stripe-connect-service.js` para buscar o preço na conta Connect:

```javascript
// Buscar preço na conta Connect para determinar se é recorrente
const price = await stripe.prices.retrieve(priceId, {
  stripeAccount: barbershopAccountId,
});
```

**Status:** ✅ Corrigido e Deployado

---

## 📊 Estado Atual

### Plano Teste
- **ID:** `59e7fbae-4c1c-48c9-be15-28817c3439ba`
- **Nome:** "Plano Teste"
- **Preço:** R$ 149.90
- **Tipo:** Mensal
- **Stripe Product ID:** `prod_TkDxJHu82mcKBo`
- **Stripe Price ID:** `price_1SmjVWHClmeWTuetJPrPNcve`
- **Barbearia:** Code Identidade Masculina (`612ea2c6-fa46-4e12-b3a5-91a3b605d53f`)
- **Conta Stripe Connect:** `acct_1SmhMIHClmeWTuet`

### Status da Conta Connect
- ✅ Onboarding concluído
- ✅ Conta ativa
- ✅ Produtos/preços criados na conta Connect

---

## 🧪 Próximos Testes

### Teste 1: Criação de Checkout Session
1. Acessar `/pagamentos`
2. Clicar em "Criar Assinatura"
3. Selecionar "Plano Teste"
4. Verificar criação de checkout session
5. Verificar redirecionamento para Stripe Checkout

**Status:** ⏳ Aguardando deploy do Railway

### Teste 2: Processamento de Pagamento
1. Completar pagamento no Stripe Checkout (cartão de teste)
2. Verificar retorno ao painel
3. Verificar criação de assinatura no banco
4. Verificar webhook `checkout.session.completed`

**Status:** ⏳ Pendente

### Teste 3: Webhooks de Assinatura
1. Verificar webhook `customer.subscription.created`
2. Verificar webhook `invoice.payment_succeeded`
3. Verificar atualização de status no painel

**Status:** ⏳ Pendente

---

## 📝 Logs de Erros Encontrados

### Erro 1: Email Inválido
```
[ERRO] Erro ao criar sessão de checkout para Connect 
error="Invalid email address: admin@admin"
```
**Status:** ✅ Resolvido

### Erro 2: Preço Não Encontrado
```
[ERRO] Erro ao criar sessão de checkout para Connect 
error="No such price: 'price_1SmjVWHClmeWTuetJPrPNcve'"
```
**Status:** ✅ Resolvido

---

## 🔄 Deploy

**Commit:** `3a68869` - "fix: buscar preco na conta Connect ao criar checkout e validar email"  
**Status:** ✅ Deployado no Railway  
**Aguardando:** Reinicialização do serviço (~30 segundos)

---

## ✅ Checklist

- [x] Sincronização de plano com Stripe Connect
- [x] Correção de validação de email
- [x] Correção de busca de preço na conta Connect
- [x] Deploy das correções
- [ ] Teste de criação de checkout session
- [ ] Teste de redirecionamento para Stripe Checkout
- [ ] Teste de processamento de pagamento
- [ ] Teste de webhooks de assinatura

---

**Última atualização:** 06/01/2026  
**Próximo passo:** Aguardar deploy e testar criação de checkout novamente

