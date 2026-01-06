# Solução: Erro "Something went wrong" no Dashboard Stripe

**Data:** 06/01/2026  
**Problema:** Dashboard do Stripe bloqueado na tela de "adicionar dados de teste" com erro "Something went wrong, try again"

---

## 🔍 Análise do Problema

O erro ocorre durante o processo de habilitação do Stripe Connect no dashboard. Mesmo que o usuário tente ignorar, a tela fica bloqueada e não permite avançar.

## ✅ Solução: Criar Conta via API (Bypass do Dashboard)

Como o código já cria contas Connect via API automaticamente, podemos **pular completamente o dashboard** e criar a conta diretamente via API.

### Opção 1: Testar via Painel Admin (Recomendado)

1. **Acesse o painel admin:** `http://localhost:5173/pagamentos`
2. **Clique em "Conectar Pagamento"**
3. O backend criará a conta automaticamente via API
4. Você será redirecionado para o onboarding do Stripe

**Vantagem:** Funciona mesmo com o dashboard bloqueado, pois usa API diretamente.

### Opção 2: Criar Conta via API Manualmente (Teste)

Se quiser testar a criação da conta antes:

```bash
# Usando curl
curl https://api.stripe.com/v1/accounts \
  -u sk_test_...: \
  -d type=express \
  -d country=BR \
  -d "capabilities[card_payments][requested]=true" \
  -d "capabilities[transfers][requested]=true" \
  -d email=test@example.com
```

**Nota:** Substitua `sk_test_...` pela sua chave secreta completa.

### Opção 3: Usar o Endpoint do Backend

O backend já tem um endpoint que cria a conta automaticamente:

```bash
POST https://whatsapp-flow-endpoint-production.up.railway.app/api/stripe/connect/onboard
Headers: {
  "Authorization": "Bearer {seu-token-jwt}",
  "Content-Type": "application/json"
}
Body: {
  "barbershopId": "612ea2c6-fa46-4e12-b3a5-91a3b605d53f"
}
```

---

## 🎯 Recomendação

**Use a Opção 1** (via painel admin). É a forma mais simples e já está implementada:

1. O código cria a conta via API automaticamente
2. Gera o link de onboarding
3. Redireciona você para completar o cadastro
4. Não depende do dashboard do Stripe

---

## ⚠️ Importante

- O erro no dashboard **não impede** o funcionamento via API
- O código já está preparado para criar contas programaticamente
- Não é necessário completar o processo no dashboard
- Basta habilitar o Stripe Connect (selecionar Marketplace) e depois usar o painel admin

---

## 📝 Próximos Passos

1. **Se ainda não habilitou o Connect:**
   - Tente fechar e reabrir o dashboard
   - Ou tente em outro navegador/aba anônima
   - O importante é selecionar "Marketplace" e salvar

2. **Após habilitar (ou mesmo sem habilitar, para testar):**
   - Acesse o painel admin: `/pagamentos`
   - Clique em "Conectar Pagamento"
   - A conta será criada via API
   - Se der erro "Connect não habilitado", então precisa habilitar primeiro

3. **Se o Connect já estiver habilitado:**
   - O painel admin funcionará normalmente
   - A conta será criada automaticamente
   - Você será redirecionado para o onboarding

---

## 🔧 Verificação

Para verificar se o Connect está habilitado:

1. Acesse: https://dashboard.stripe.com/connect/overview
2. Se aparecer "Contas conectadas" ou "Connected accounts", está habilitado
3. Se aparecer "Get started" ou "Enable Connect", ainda não está habilitado

**Nota:** Mesmo que o dashboard esteja bloqueado na tela de dados de teste, o Connect pode já estar habilitado. Tente usar o painel admin para testar.

