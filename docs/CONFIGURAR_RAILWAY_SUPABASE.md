# 🔧 Configurar Variáveis do Supabase no Railway

## ⚠️ IMPORTANTE: Variáveis Obrigatórias

Para o sistema de validação de CPF funcionar, você **DEVE** configurar estas variáveis no Railway:

### 1. `SUPABASE_URL`
**Valor:**
```
https://ajqyqogusrmdsyckhtay.supabase.co
```

### 2. `SUPABASE_ANON_KEY`
**Valor:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA4MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM
```

### 3. `SUPABASE_SERVICE_ROLE_KEY` ⚠️ CRÍTICA
**Como obter:**
1. Acesse: https://supabase.com/dashboard/project/ajqyqogusrmdsyckhtay/settings/api
2. **Role a página para BAIXO** (a service_role está abaixo da anon key)
3. Procure pela seção **"service_role"** ou **"Service Role"**
4. Clique no ícone de **👁️ olho** ou botão **"Reveal"** para revelar a chave
5. Clique em **"Copy"** para copiar
6. A chave começa com `eyJhbGc...` e é bem longa (mais de 200 caracteres)

**⚠️ ATENÇÃO:** Esta chave é **SECRETA** e não deve ser compartilhada!

**📖 Guia detalhado:** Veja `docs/COMO_OBTER_SERVICE_ROLE_KEY.md` para instruções passo a passo com mais detalhes.

---

## 📝 Passo a Passo no Railway

### Opção 1: Via Dashboard Web

1. Acesse: https://railway.app
2. Faça login na sua conta
3. Selecione o projeto `endpoint-flow` (ou o nome do seu projeto)
4. Clique no serviço que está rodando
5. Vá na aba **"Variables"** (no menu lateral)
6. Clique em **"+ New Variable"** para cada variável:

   **Variável 1:**
   - **Key:** `SUPABASE_URL`
   - **Value:** `https://ajqyqogusrmdsyckhtay.supabase.co`
   - Clique em **"Add"**

   **Variável 2:**
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA4MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM`
   - Clique em **"Add"**

   **Variável 3:**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `[COLE A CHAVE QUE VOCÊ COPIU DO SUPABASE]`
   - Clique em **"Add"**

7. O Railway vai fazer **redeploy automático** (~30-60 segundos)

### Opção 2: Via Railway CLI

Se você tem o Railway CLI instalado:

```bash
# Configurar variáveis
railway variables set SUPABASE_URL="https://ajqyqogusrmdsyckhtay.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcXlxb2d1c3JtZHN5Y2todGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTUzNTgsImV4cCI6MjA8MTQ5MTM1OH0.4Yhv5zImKhFKi53XhlGIWBUXsDytK4KCxGuxQ0j8wxM"
railway variables set SUPABASE_SERVICE_ROLE_KEY="[SUA_CHAVE_AQUI]"
```

---

## ✅ Verificar se Funcionou

Após configurar as variáveis e o redeploy:

1. Acesse os logs do Railway
2. Procure por mensagens como:
   - ✅ `✅ Servidor iniciado na porta 3000`
   - ❌ Se aparecer: `⚠️ Variáveis do Supabase não configuradas` → As variáveis não foram configuradas corretamente

3. Teste o Flow:
   - Envie uma mensagem para o WhatsApp
   - Informe um CPF no Flow
   - O sistema deve consultar o banco de dados

---

## 🔍 Variáveis Opcionais (para depois)

Estas variáveis podem ser configuradas depois, quando você configurar o Stripe:

- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook do Stripe

**Por enquanto, você pode deixar essas vazias ou não configurá-las ainda.**

---

## 🚨 Problemas Comuns

### ❌ "Variáveis do Supabase não configuradas"
**Solução:**
- Verifique se as 3 variáveis estão configuradas
- Verifique se não há espaços extras nos valores
- Aguarde o redeploy completar (~1 minuto)

### ❌ "Supabase Admin não configurado"
**Solução:**
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Certifique-se de copiar a chave completa (é bem longa)

### ❌ "Erro ao buscar cliente por CPF"
**Solução:**
- Verifique se as variáveis estão corretas
- Verifique os logs do Railway para mais detalhes
- Certifique-se de que o banco de dados está acessível

---

## 📋 Checklist

- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` obtida do painel do Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada no Railway
- [ ] Redeploy completado
- [ ] Logs mostram que o servidor iniciou sem erros
- [ ] Teste do Flow funcionando

---

## 🎯 Próximos Passos

Após configurar essas variáveis:

1. ✅ Sistema de validação de CPF funcionando
2. ⏳ Configurar Stripe (quando estiver pronto)
3. ⏳ Criar interface administrativa
4. ⏳ Implementar notificações

