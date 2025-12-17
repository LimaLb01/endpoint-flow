# Credenciais do Supabase - Clube CODE

## Projeto Configurado

**Nome do Projeto:** FlowBrasil  
**Project ID:** `ajqyqogusrmdsyckhtay`  
**URL:** `https://ajqyqogusrmdsyckhtay.supabase.co`  
**Região:** `sa-east-1` (South America - São Paulo)

## Credenciais de API

### Anon/Public Key (para operações públicas)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA4MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM
```

### Secret Key (para operações administrativas)
⚠️ **IMPORTANTE:** Esta chave deve ser mantida em segredo!

**NOTA:** O Supabase atualizou a interface. Agora é chamada de **"Secret key"** (não mais "service_role").

Para obter a Secret Key:
1. Acesse: https://supabase.com/dashboard/project/ajqyqogusrmdsyckhtay/settings/api
2. Procure pela seção **"Secret keys"**
3. Clique no ícone de **👁️ olho** para revelar a chave mascarada
4. Copie a chave (começa com `sb_secret_...`)
5. Adicione ao Railway como `SUPABASE_SERVICE_ROLE_KEY`

## Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```env
SUPABASE_URL=https://ajqyqogusrmdsyckhtay.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA4MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM
SUPABASE_SERVICE_ROLE_KEY=[OBTENHA NO PAINEL DO SUPABASE]
```

## Tabelas Criadas

✅ `customers` - Dados dos clientes  
✅ `plans` - Planos disponíveis (3 planos já inseridos)  
✅ `subscriptions` - Assinaturas ativas  
✅ `payments` - Histórico de pagamentos  
✅ `manual_payments` - Pagamentos registrados no local  

## Planos Padrão

1. **Plano Mensal** - R$ 99,90/mês
2. **Plano Anual** - R$ 999,90/ano
3. **Plano Único** - R$ 199,90 (sem renovação)

## Próximos Passos

1. ✅ Banco de dados configurado
2. ✅ Serviços criados (customer-service, subscription-service)
3. ✅ CPF handler atualizado para usar banco
4. ⏳ Configurar Stripe
5. ⏳ Criar rotas de API
6. ⏳ Implementar webhook do Stripe
7. ⏳ Criar interface administrativa

