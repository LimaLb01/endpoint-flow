# Problema: Price na Conta Connect vs Checkout Session

**Data:** 06/01/2026  
**Status:** 🔍 Investigando

---

## 🐛 Problema Identificado

Ao tentar criar um checkout session com um price que está na conta Connect, recebemos o erro:

```
No such price: 'price_1SmjVWHClmeWTuetJPrPNcve'
```

### Contexto

- ✅ Produto e preço criados na conta Connect (`acct_1SmhMIHClmeWTuet`)
- ✅ Código busca o preço na conta Connect corretamente
- ❌ Erro ao criar checkout session

---

## 🔍 Análise do Stripe Connect

### Comportamento Esperado

No Stripe Connect Marketplace:
- **Checkout Sessions** são sempre criadas na **conta principal** (plataforma)
- Quando você usa `transfer_data` com `destination`, o Stripe:
  1. Cria o checkout na conta principal
  2. Processa o pagamento na conta principal
  3. Transfere o valor para a conta Connect (menos a taxa da plataforma)

### Limitação

- **Prices na conta Connect** não podem ser usados diretamente em checkout sessions da conta principal
- O Stripe espera que o price esteja na conta principal quando você cria o checkout session

---

## 💡 Possíveis Soluções

### Opção 1: Criar Price na Conta Principal (Recomendado)

**Vantagens:**
- ✅ Funciona com checkout sessions padrão
- ✅ Simples de implementar
- ✅ Suportado oficialmente pelo Stripe

**Desvantagens:**
- ❌ Prices ficam na conta principal, não na conta Connect
- ❌ Relatórios ficam na conta principal

**Implementação:**
```javascript
// Criar price na conta principal (sem stripeAccount)
const price = await stripe.prices.create({
  product: productId,
  unit_amount: amount,
  currency: 'brl',
  recurring: { interval: 'month' }
});

// Usar em checkout session com transfer_data
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: priceId, quantity: 1 }],
  subscription_data: {
    application_fee_percent: 5,
    transfer_data: {
      destination: barbershopAccountId
    }
  }
});
```

### Opção 2: Usar Payment Intents Diretos (Não Recomendado)

**Vantagens:**
- ✅ Permite usar prices da conta Connect

**Desvantagens:**
- ❌ Mais complexo
- ❌ Não usa checkout sessions (pior UX)
- ❌ Requer mais código

### Opção 3: Criar Price Duplicado (Não Recomendado)

**Vantagens:**
- ✅ Mantém price na conta Connect para relatórios

**Desvantagens:**
- ❌ Duplicação de dados
- ❌ Sincronização complexa
- ❌ Manutenção difícil

---

## 🎯 Recomendação

**Usar Opção 1:** Criar prices na conta principal e usar `transfer_data` para transferir pagamentos.

### Por quê?

1. **Suportado oficialmente** pelo Stripe
2. **Mais simples** de implementar e manter
3. **Melhor UX** com checkout sessions
4. **Relatórios** podem ser filtrados por `barbershop_id` no banco de dados

### Arquitetura Ajustada

```
Conta Principal (Plataforma)
├── Products (criados por barbearia)
├── Prices (criados por barbearia)
└── Checkout Sessions (com transfer_data)

Conta Connect (Barbearia)
├── Recebe transferências
└── Relatórios de pagamentos recebidos
```

---

## 📝 Próximos Passos

1. ✅ Identificar o problema
2. ⏳ Decidir qual solução implementar
3. ⏳ Ajustar código para criar prices na conta principal
4. ⏳ Testar checkout com novo fluxo
5. ⏳ Atualizar documentação

---

**Última atualização:** 06/01/2026  
**Status:** Aguardando decisão sobre qual solução implementar

