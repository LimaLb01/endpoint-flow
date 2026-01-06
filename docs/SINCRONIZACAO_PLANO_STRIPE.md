# Sincronização de Plano com Stripe Connect

**Data:** 06/01/2026  
**Status:** ✅ Rota Criada

---

## 🎯 Objetivo

Sincronizar planos existentes que foram criados sem produto/preço no Stripe Connect, criando-os automaticamente na conta Connect da barbearia.

---

## 🔧 Rota Criada

### `POST /api/admin/plans/:id/sync-stripe`

Sincroniza um plano existente com o Stripe Connect, criando produto/preço na conta Connect da barbearia.

**Validações:**
- ✅ Plano existe
- ✅ Plano não tem produto/preço já criados
- ✅ Plano tem `barbershop_id`
- ✅ Barbearia existe
- ✅ Barbearia tem `stripe_account_id`
- ✅ Onboarding do Stripe está completo
- ✅ Stripe está configurado no servidor

**Fluxo:**
1. Busca o plano pelo ID
2. Verifica se já tem produto/preço (se sim, retorna erro)
3. Busca a barbearia associada
4. Valida Stripe Connect configurado
5. Cria produto/preço na conta Connect da barbearia
6. Atualiza o plano com `stripe_product_id` e `stripe_price_id`

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Plano sincronizado com sucesso no Stripe Connect",
  "plan": { ... },
  "stripe": {
    "product_id": "prod_xxxxx",
    "price_id": "price_xxxxx",
    "stripe_account": "acct_xxxxx"
  }
}
```

---

## 🧪 Como Usar

### Via API (cURL)
```bash
curl -X POST \
  https://whatsapp-flow-endpoint-production.up.railway.app/api/admin/plans/59e7fbae-4c1c-48c9-be15-28817c3439ba/sync-stripe \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### Via Frontend (adicionar botão)
Pode adicionar um botão "Sincronizar com Stripe" na interface de edição de planos que chama esta rota.

---

## ✅ Próximos Passos

1. **Testar a rota** com o plano "Plano Teste"
2. **Adicionar botão no frontend** (opcional) para facilitar sincronização
3. **Verificar produto/preço criados** no Stripe Dashboard da conta Connect

---

**Última atualização:** 06/01/2026  
**Status:** ✅ Rota criada e pronta para uso

