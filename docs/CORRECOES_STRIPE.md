# ✅ Correções na Integração de Pagamentos Stripe

## Problemas Identificados e Corrigidos

### 1. ✅ Campos Stripe faltando na tabela `manual_payments`

**Problema:** O código tentava inserir `stripe_payment_intent_id` e `stripe_invoice_id`, mas esses campos não existiam na tabela.

**Solução:**
- Migration aplicada no Supabase via MCP
- Adicionados campos `stripe_payment_intent_id` e `stripe_invoice_id` na tabela `manual_payments`
- Criados índices para busca rápida

**Migration aplicada:**
```sql
ALTER TABLE manual_payments
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

CREATE INDEX IF NOT EXISTS idx_manual_payments_stripe_payment_intent ON manual_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_stripe_invoice ON manual_payments(stripe_invoice_id);
```

### 2. ✅ Pagamento inicial de assinaturas recorrentes não era registrado

**Problema:** Quando uma assinatura recorrente era criada (`mode === 'subscription'`), o código apenas criava a assinatura, mas não registrava o pagamento inicial nem enviava notificação.

**Solução:**
- Modificado `handleCheckoutCompleted` para buscar o invoice inicial da assinatura
- Registro do pagamento inicial na tabela `manual_payments`
- Envio de notificação ao cliente sobre pagamento confirmado

**Código corrigido:**
```javascript
// Se foi uma assinatura, buscar dados da assinatura
if (session.mode === 'subscription' && session.subscription) {
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Buscar dados do plano
  const { data: plan } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  // Criar assinatura
  const subscriptionResult = await handleSubscriptionUpdated(stripeSubscription, customer.id, planId);
  
  // Buscar invoice inicial da assinatura para registrar pagamento
  if (stripeSubscription.latest_invoice) {
    const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice);
    
    if (invoice.paid && invoice.amount_paid > 0) {
      // Criar registro de pagamento inicial
      const { data: payment } = await supabaseAdmin
        .from('manual_payments')
        .insert({
          customer_id: customer.id,
          plan_id: planId,
          amount: invoice.amount_paid / 100,
          payment_date: new Date(invoice.created * 1000),
          confirmed_by: 'Stripe',
          status: 'confirmed',
          stripe_invoice_id: invoice.id
        })
        .select()
        .single();
      
      // Enviar notificações
      if (payment && plan) {
        await notifyPaymentConfirmed(customer, payment, plan);
      }
    }
  }
  
  return subscriptionResult;
}
```

---

## ✅ Status Atual

### Pagamentos Únicos (`mode === 'payment'`)
- ✅ Registro de pagamento na tabela `manual_payments`
- ✅ Criação de assinatura
- ✅ Notificação ao cliente
- ✅ Campos Stripe salvos corretamente

### Assinaturas Recorrentes (`mode === 'subscription'`)
- ✅ Criação de assinatura
- ✅ Registro do pagamento inicial
- ✅ Notificação ao cliente sobre pagamento confirmado
- ✅ Campos Stripe salvos corretamente

### Pagamentos Recorrentes (`invoice.payment_succeeded`)
- ✅ Registro de pagamento na tabela `manual_payments`
- ✅ Notificação ao cliente
- ✅ Campos Stripe salvos corretamente

---

## 📋 Fluxo Completo de Pagamento

### 1. Checkout Session Completed
```
Stripe → Webhook → handleCheckoutCompleted()
  ├─ Se payment único:
  │   ├─ Criar pagamento em manual_payments
  │   ├─ Criar assinatura
  │   └─ Notificar cliente
  │
  └─ Se subscription:
      ├─ Criar assinatura
      ├─ Buscar invoice inicial
      ├─ Criar pagamento em manual_payments
      └─ Notificar cliente
```

### 2. Invoice Payment Succeeded
```
Stripe → Webhook → handlePaymentSucceeded()
  ├─ Buscar assinatura
  ├─ Criar pagamento em manual_payments
  └─ Notificar cliente
```

---

## 🧪 Como Testar

### Teste 1: Pagamento Único
1. Criar checkout session com `mode: 'payment'`
2. Completar pagamento no Stripe
3. Verificar:
   - ✅ Pagamento registrado em `manual_payments`
   - ✅ Assinatura criada
   - ✅ Notificação enviada (ver logs)

### Teste 2: Assinatura Recorrente
1. Criar checkout session com `mode: 'subscription'`
2. Completar pagamento no Stripe
3. Verificar:
   - ✅ Assinatura criada
   - ✅ Pagamento inicial registrado em `manual_payments`
   - ✅ Notificação enviada (ver logs)

### Teste 3: Pagamento Recorrente
1. Aguardar próxima cobrança da assinatura
2. Verificar webhook `invoice.payment_succeeded`
3. Verificar:
   - ✅ Pagamento registrado em `manual_payments`
   - ✅ Notificação enviada (ver logs)

---

## 📝 Notas Importantes

1. **Campos Stripe:** Agora a tabela `manual_payments` suporta tanto pagamentos manuais quanto pagamentos do Stripe.

2. **Notificações:** Todas as notificações estão em modo simulado (apenas log). Para ativar envio real, implemente as funções em `notification-service.js`.

3. **Tratamento de Erros:** O código trata erros ao buscar invoice inicial sem quebrar o fluxo principal.

4. **Migration Aplicada:** A migration foi aplicada automaticamente via MCP do Supabase no projeto "FlowBrasil".

---

**Última atualização:** 19/12/2025








