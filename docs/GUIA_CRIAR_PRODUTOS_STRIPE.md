# Guia: Como Criar Produtos no Stripe para os Planos

**Data:** 06/01/2026  
**Objetivo:** Criar produtos e preços no Stripe Dashboard para associar aos planos do sistema

---

## 📋 Planos do Sistema

Com base nos planos ativos no banco de dados, você precisa criar os seguintes produtos no Stripe:

1. **Plano Único** - R$ 199,90 (Tipo: `one_time`)
2. **Plano Anual** - R$ 999,90 (Tipo: `yearly`)
3. **Plano Mensal** - R$ 99,90 (Tipo: `monthly`) - Atualmente inativo, mas pode ser ativado

---

## 🎯 Passo a Passo: Criar Produto no Stripe

### Para Planos Recorrentes (Mensal e Anual)

1. **Acesse o Stripe Dashboard:**
   - URL: https://dashboard.stripe.com/test/products
   - Certifique-se de estar no modo **Test** (área restrita)

2. **Clique em "Adicionar produto"** (botão no topo direito)

3. **Preencha os campos:**

   **Nome do Produto:**
   - Exemplo: "Plano Mensal - Clube CODE" ou "Plano Anual - Clube CODE"
   - Use o mesmo nome do plano no sistema para facilitar identificação

   **Descrição (opcional):**
   - Exemplo: "Assinatura mensal do Clube CODE"
   - Ou: "Assinatura anual do Clube CODE (economia de 2 meses)"

   **Imagem (opcional):**
   - Pode adicionar uma imagem do produto
   - Formato: JPEG, PNG ou WEBP com menos de 2 MB
   - Aparece no checkout do Stripe

4. **Configurar Preço:**

   **Tipo de Preço:**
   - ✅ Selecione **"Recorrente"** (botão roxo)
   - ❌ NÃO selecione "Avulso" (isso é para pagamentos únicos)

   **Valor:**
   - **Plano Mensal:** R$ 99,90
   - **Plano Anual:** R$ 999,90
   - Moeda: **BRL** (Real Brasileiro)

   **Período de Faturamento:**
   - **Plano Mensal:** Selecione **"Mensal"**
   - **Plano Anual:** Selecione **"Anual"**

5. **Clique em "Adicionar produto"**

6. **Copiar o Price ID:**
   - Após criar o produto, você verá uma lista de produtos
   - Clique no produto criado
   - Na seção "Preços", você verá o **Price ID** (formato: `price_xxxxx`)
   - **COPIE ESTE ID** - você precisará dele!

---

### Para Plano Único (One-time)

1. **Acesse o Stripe Dashboard:**
   - URL: https://dashboard.stripe.com/test/products

2. **Clique em "Adicionar produto"**

3. **Preencha os campos:**

   **Nome do Produto:**
   - Exemplo: "Plano Único - Clube CODE"

   **Descrição:**
   - Exemplo: "Plano único em renovação automática"

4. **Configurar Preço:**

   **Tipo de Preço:**
   - ✅ Selecione **"Avulso"** (One-time payment)
   - ❌ NÃO selecione "Recorrente"

   **Valor:**
   - **Plano Único:** R$ 199,90
   - Moeda: **BRL**

   **Observação:** Para planos únicos, não há período de faturamento (já que é um pagamento único)

5. **Clique em "Adicionar produto"**

6. **Copiar o Price ID:**
   - Após criar, copie o **Price ID** (formato: `price_xxxxx`)

---

## 🔗 Associar Price ID ao Plano no Sistema

Após criar cada produto no Stripe e obter o `price_id`:

1. **Acesse o Painel Admin:**
   - URL: http://localhost:5173/planos
   - Ou: https://seu-dominio.com/planos

2. **Edite o Plano:**
   - Clique no botão **"Editar"** (ícone de lápis) do plano correspondente

3. **Cole o Price ID:**
   - No campo **"Stripe Price ID"**, cole o `price_id` copiado do Stripe
   - Exemplo: `price_1SmhMIHClmeWTuetxxxxx`

4. **Salve:**
   - Clique em **"Salvar Alterações"**

5. **Verifique:**
   - O plano agora deve aparecer como configurado no Stripe
   - Você poderá criar assinaturas usando este plano

---

## 📝 Resumo dos Produtos a Criar

| Plano | Tipo | Valor | Período | Tipo no Stripe |
|-------|------|-------|---------|----------------|
| Plano Mensal | `monthly` | R$ 99,90 | Mensal | **Recorrente** → Mensal |
| Plano Único | `one_time` | R$ 199,90 | - | **Avulso** (One-time) |
| Plano Anual | `yearly` | R$ 999,90 | Anual | **Recorrente** → Anual |

---

## ⚠️ Importante

1. **Modo Test vs Produção:**
   - Você está criando produtos no modo **Test** (área restrita)
   - Quando for para produção, crie os mesmos produtos no modo **Production**
   - Os `price_id` serão diferentes entre test e production

2. **Price ID é Único:**
   - Cada preço criado no Stripe tem um `price_id` único
   - Não reutilize o mesmo `price_id` para planos diferentes

3. **Valores Devem Coincidir:**
   - O valor no Stripe deve ser **exatamente igual** ao valor do plano no sistema
   - Exemplo: Se o plano é R$ 199,90, o preço no Stripe também deve ser R$ 199,90

4. **Moeda:**
   - Use **BRL** (Real Brasileiro) para todos os planos

---

## ✅ Checklist

- [ ] Criar produto "Plano Mensal" no Stripe (Recorrente, Mensal, R$ 99,90)
- [ ] Copiar `price_id` do Plano Mensal
- [ ] Associar `price_id` ao "Plano Mensal" no painel admin
- [ ] Criar produto "Plano Único" no Stripe (Avulso, R$ 199,90)
- [ ] Copiar `price_id` do Plano Único
- [ ] Associar `price_id` ao "Plano Único" no painel admin
- [ ] Criar produto "Plano Anual" no Stripe (Recorrente, Anual, R$ 999,90)
- [ ] Copiar `price_id` do Plano Anual
- [ ] Associar `price_id` ao "Plano Anual" no painel admin
- [ ] Testar criação de assinatura com cada plano

---

## 🎯 Próximos Passos

Após criar todos os produtos e associar os `price_id`:

1. Teste a criação de assinatura no painel admin
2. Verifique se o checkout do Stripe abre corretamente
3. Complete um pagamento de teste
4. Verifique se a assinatura é criada no banco de dados
5. Verifique se os webhooks estão funcionando

---

**Dúvidas?** Consulte a documentação do Stripe: https://stripe.com/docs/products-prices/overview

