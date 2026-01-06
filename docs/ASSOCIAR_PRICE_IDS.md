# Como Obter e Associar Price IDs do Stripe

**Data:** 06/01/2026  
**Status:** Produtos criados no Stripe ✅

---

## 📋 Produtos Criados no Stripe

✅ **Plano Anual** - R$ 999,90 Por ano  
✅ **Plano Único** - R$ 199,90

---

## 🔍 Passo 1: Obter os Price IDs

### Opção 1: Via Interface do Stripe (Recomendado)

1. **No catálogo de produtos do Stripe:**
   - Clique no produto **"Plano Anual"**
   - Na página de detalhes, você verá a seção **"Preços"**
   - O **Price ID** estará visível (formato: `price_xxxxx`)
   - **COPIE ESTE ID**

2. **Repita para "Plano Único":**
   - Clique no produto **"Plano Único"**
   - Na seção **"Preços"**, copie o **Price ID**

### Opção 2: Via API do Stripe (Avançado)

Se preferir, você pode listar os produtos via API:
```bash
curl https://api.stripe.com/v1/products \
  -u sk_test_...:
```

---

## 🔗 Passo 2: Associar Price IDs no Painel Admin

1. **Acesse o Painel Admin:**
   - URL: http://localhost:5173/planos
   - Ou: https://seu-dominio.com/planos

2. **Edite o Plano Anual:**
   - Clique no botão **"Editar"** (ícone de lápis) do "Plano Anual"
   - No campo **"Stripe Price ID"**, cole o `price_id` do produto "Plano Anual"
   - Clique em **"Salvar Alterações"**

3. **Edite o Plano Único:**
   - Clique no botão **"Editar"** (ícone de lápis) do "Plano Único"
   - No campo **"Stripe Price ID"**, cole o `price_id` do produto "Plano Único"
   - Clique em **"Salvar Alterações"**

---

## ✅ Verificação

Após associar os Price IDs:

1. **Verifique na tabela de planos:**
   - Os planos devem aparecer sem o aviso "⚠️ Plano não configurado no Stripe"
   - Os botões de seleção devem estar habilitados

2. **Teste a criação de assinatura:**
   - Acesse: http://localhost:5173/pagamentos
   - Clique em **"Criar Assinatura"**
   - Selecione um plano
   - Deve redirecionar para o Stripe Checkout

---

## 📝 Checklist

- [ ] Obter Price ID do "Plano Anual" do Stripe
- [ ] Obter Price ID do "Plano Único" do Stripe
- [ ] Associar Price ID ao "Plano Anual" no painel admin
- [ ] Associar Price ID ao "Plano Único" no painel admin
- [ ] Verificar que os avisos desapareceram
- [ ] Testar criação de assinatura

---

## 🎯 Próximos Passos

Após associar os Price IDs:

1. ✅ Testar criação de assinatura
2. ✅ Verificar checkout do Stripe
3. ✅ Completar pagamento de teste
4. ✅ Verificar criação da assinatura no banco
5. ✅ Verificar webhooks funcionando

