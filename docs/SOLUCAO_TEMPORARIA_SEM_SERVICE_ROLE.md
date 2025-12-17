# ⚠️ Solução Temporária: Funcionar sem Service Role Key

## 🎯 Situação Atual

Se você não conseguiu encontrar a **service_role key** ainda, o sistema foi configurado para funcionar **temporariamente** apenas com a **anon key**.

## ✅ O Que Funciona

Com apenas a **anon key** configurada:
- ✅ Consulta de CPF no banco de dados
- ✅ Verificação se cliente tem plano ativo
- ✅ Leitura de dados (SELECT)

## ⚠️ O Que NÃO Funciona (ou tem limitações)

Sem a **service_role key**:
- ❌ Criação de novos clientes (pode falhar se RLS estiver ativo)
- ❌ Criação de assinaturas
- ❌ Atualização de dados
- ❌ Operações administrativas completas

## 🔧 Configuração Mínima no Railway

Por enquanto, configure apenas estas 2 variáveis:

1. `SUPABASE_URL` = `https://ajqyqogusrmdsyckhtay.supabase.co`
2. `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA4MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM`

**Deixe `SUPABASE_SERVICE_ROLE_KEY` vazia por enquanto.**

## 🧪 Teste Básico

Após configurar essas 2 variáveis:

1. O sistema vai iniciar (com avisos nos logs)
2. A validação de CPF vai funcionar para **consultas**
3. Se um CPF não existir no banco, pode dar erro ao tentar criar

## 📋 Próximos Passos

### Opção 1: Encontrar a Service Role Key (Recomendado)
- Siga o guia: `docs/COMO_OBTER_SERVICE_ROLE_KEY.md`
- Adicione a chave quando encontrar
- Sistema funcionará completamente

### Opção 2: Desabilitar RLS Temporariamente
Se você precisar que funcione completamente agora:

1. No Supabase, vá em **Authentication > Policies**
2. Desabilite temporariamente o RLS nas tabelas:
   - `customers`
   - `subscriptions`
   - `payments`
   - `manual_payments`

**⚠️ ATENÇÃO:** Isso remove a segurança. Use apenas para testes!

### Opção 3: Criar Políticas RLS Permissivas
Configure políticas que permitam operações com anon key:

```sql
-- Permitir leitura pública
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura pública" ON customers FOR SELECT USING (true);

-- Permitir inserção pública (apenas para testes)
CREATE POLICY "Permitir inserção pública" ON customers FOR INSERT WITH CHECK (true);
```

## ✅ Quando Encontrar a Service Role Key

1. Adicione `SUPABASE_SERVICE_ROLE_KEY` no Railway
2. O sistema vai usar automaticamente
3. Todas as funcionalidades estarão disponíveis

---

## 🆘 Ainda Precisa de Ajuda?

Se você:
- Não consegue encontrar a service_role key
- Quer que eu ajude a configurar RLS
- Tem dúvidas sobre o que fazer

Me avise e eu ajudo!

