# 🚂 Guia Completo: Migração do Render para Railway

Este guia te ajudará a migrar seu endpoint do WhatsApp Flow do Render para o Railway passo a passo.

---

## 📋 Pré-requisitos

- ✅ Conta no GitHub (seu código já está lá)
- ✅ Conta no Railway (vamos criar agora)
- ✅ Todas as variáveis de ambiente do Render anotadas

---

## 🚀 Passo 1: Criar Conta no Railway

1. Acesse: **https://railway.app**
2. Clique em **"Start a New Project"** ou **"Login"**
3. Escolha **"Login with GitHub"**
4. Autorize o Railway a acessar seus repositórios
5. ✅ Conta criada!

---

## 📦 Passo 2: Criar Novo Projeto no Railway

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `endpoint-flow` (ou o nome do seu repositório)
4. Clique em **"Deploy Now"**

**O Railway vai:**
- ✅ Detectar automaticamente que é um projeto Node.js
- ✅ Instalar dependências (`npm install`)
- ✅ Executar `npm start`
- ✅ Gerar uma URL pública automaticamente

**⏱️ Aguarde 2-3 minutos para o deploy inicial**

---

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1. Acessar Configurações

1. No projeto Railway, clique no serviço criado
2. Vá na aba **"Variables"** (no menu lateral)
3. Clique em **"New Variable"**

### 3.2. Adicionar Todas as Variáveis

**Copie TODAS as variáveis do Render e adicione no Railway:**

#### ✅ Variáveis OBRIGATÓRIAS:

```bash
# Porta (Railway define automaticamente, mas adicione para garantir)
PORT=3000

# Chave privada RSA do WhatsApp
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[SUA_CHAVE_AQUI]\n-----END PRIVATE KEY-----"

# Google Calendar - Service Account
GOOGLE_CLIENT_EMAIL=sua-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[SUA_CHAVE_AQUI]\n-----END PRIVATE KEY-----"

# IDs dos Calendários
CALENDAR_JOAO=primary
CALENDAR_PEDRO=primary
CALENDAR_CARLOS=primary
```

#### ⚙️ Variáveis OPCIONAIS (se você usa):

```bash
# Senha da chave privada (deixe vazio se não tiver)
PASSPHRASE=

# App Secret do Meta (para validação de assinatura)
APP_SECRET=seu_app_secret_aqui

# WhatsApp Business API (para envio automático de flow)
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_FLOW_ID=888145740552051
AUTO_SEND_FLOW_NUMBER=555492917132
```

### 3.3. Como Copiar Variáveis do Render

1. **No Render:**
   - Acesse seu serviço
   - Vá em **Environment**
   - Copie cada variável (nome e valor)

2. **No Railway:**
   - Clique em **"New Variable"**
   - Cole o **nome** da variável
   - Cole o **valor** da variável
   - Clique em **"Add"**

**⚠️ IMPORTANTE para chaves privadas:**
- Mantenha as quebras de linha (`\n`)
- Cole exatamente como está no Render
- Não adicione espaços extras

---

## 🔗 Passo 4: Obter URL Pública do Railway

1. No projeto Railway, clique no serviço
2. Vá na aba **"Settings"**
3. Role até **"Domains"**
4. Você verá uma URL como: `seu-projeto.up.railway.app`
5. **Copie essa URL** - você vai precisar dela!

**Ou:**
- Na aba **"Deployments"**, clique no deploy mais recente
- A URL aparece no topo da página

**Exemplo de URL:** `https://endpoint-flow-production.up.railway.app`

---

## 🧪 Passo 5: Testar o Endpoint

### 5.1. Teste de Health Check

Abra no navegador ou use curl:

```bash
curl https://seu-projeto.up.railway.app/health
```

**Resposta esperada:**
```json
{"status": "ok"}
```

### 5.2. Verificar Logs

1. No Railway, vá na aba **"Deployments"**
2. Clique no deploy mais recente
3. Vá na aba **"Logs"**
4. Verifique se não há erros

**Se houver erros:**
- Verifique se todas as variáveis de ambiente foram adicionadas
- Verifique se as chaves privadas estão corretas (com `\n`)

---

## 📱 Passo 6: Atualizar Webhook do WhatsApp

### 6.1. Acessar Meta Developer

1. Acesse: **https://developers.facebook.com/**
2. Vá em **"My Apps"**
3. Selecione seu app do WhatsApp

### 6.2. Atualizar URL do Webhook

1. Vá em **"WhatsApp"** > **"Configuration"**
2. Role até **"Webhook"**
3. Clique em **"Edit"** ao lado de "Callback URL"
4. **Substitua a URL do Render pela URL do Railway:**
   - **Antes:** `https://seu-projeto.onrender.com/webhook/whatsapp-flow`
   - **Depois:** `https://seu-projeto.up.railway.app/webhook/whatsapp-flow`
5. Clique em **"Verify and Save"**

### 6.3. Verificar Webhook

1. No Meta Developer, clique em **"Test"** ao lado do webhook
2. Ou envie uma mensagem de teste para o número do WhatsApp
3. Verifique os logs no Railway para confirmar que está recebendo requisições

---

## ✅ Passo 7: Testar Flow Completo

1. **Envie uma mensagem** para o número do WhatsApp
2. **Verifique se o flow é enviado automaticamente** (se configurado)
3. **Complete o flow** no WhatsApp
4. **Verifique os logs no Railway** para confirmar que tudo está funcionando
5. **Verifique o Google Calendar** para confirmar que o agendamento foi criado

---

## 🔄 Passo 8: Desativar Render (Opcional)

**⚠️ IMPORTANTE:** Só faça isso após confirmar que tudo está funcionando no Railway!

1. No Render, acesse seu serviço
2. Vá em **"Settings"**
3. Role até **"Danger Zone"**
4. Clique em **"Delete Service"**
5. Confirme a exclusão

**Ou simplesmente:**
- Deixe o serviço inativo (ele vai dormir automaticamente)
- Não precisa pagar nada se não estiver usando

---

## 📊 Comparação: Render vs Railway

| Recurso | Render | Railway |
|---------|--------|---------|
| **Sempre ativo** | ❌ Dorme após 15min | ✅ Sempre ativo |
| **Free tier** | ✅ Sim (mas dorme) | ✅ $5 créditos/mês |
| **Custo sempre ativo** | $7/mês | $5/mês |
| **Deploy automático** | ✅ Sim | ✅ Sim |
| **Variáveis de ambiente** | ✅ Sim | ✅ Sim |
| **Logs** | ✅ Sim | ✅ Sim |
| **SSL automático** | ✅ Sim | ✅ Sim |
| **Facilidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🐛 Troubleshooting

### Problema: "Application failed to respond"

**Solução:**
- Verifique se a variável `PORT` está configurada
- Railway usa a variável `PORT` automaticamente, mas é bom deixar explícito

### Problema: "Cannot decrypt request"

**Solução:**
- Verifique se `PRIVATE_KEY` está correta
- Certifique-se de que as quebras de linha (`\n`) estão presentes
- Copie exatamente como está no Render

### Problema: "Google Calendar error"

**Solução:**
- Verifique se `GOOGLE_CLIENT_EMAIL` está correto
- Verifique se `GOOGLE_PRIVATE_KEY` está completa (com `\n`)
- Verifique se a Service Account tem permissões no calendário

### Problema: "Webhook não recebe requisições"

**Solução:**
- Verifique se a URL do webhook está correta no Meta Developer
- Verifique se o endpoint está acessível publicamente
- Teste a URL no navegador: `https://seu-projeto.up.railway.app/health`

---

## 📝 Checklist de Migração

Use este checklist para garantir que nada foi esquecido:

- [ ] Conta criada no Railway
- [ ] Projeto criado e conectado ao GitHub
- [ ] Deploy inicial concluído
- [ ] Todas as variáveis de ambiente copiadas do Render
- [ ] `PRIVATE_KEY` adicionada corretamente
- [ ] `GOOGLE_CLIENT_EMAIL` adicionada
- [ ] `GOOGLE_PRIVATE_KEY` adicionada corretamente
- [ ] `CALENDAR_JOAO`, `CALENDAR_PEDRO`, `CALENDAR_CARLOS` adicionadas
- [ ] Variáveis opcionais adicionadas (se necessário)
- [ ] URL pública do Railway anotada
- [ ] Endpoint testado (`/health`)
- [ ] Logs verificados (sem erros)
- [ ] Webhook do WhatsApp atualizado com nova URL
- [ ] Webhook verificado no Meta Developer
- [ ] Flow completo testado no WhatsApp
- [ ] Agendamento criado no Google Calendar confirmado
- [ ] Render desativado (opcional)

---

## 🎉 Pronto!

Seu endpoint agora está rodando no Railway, sempre ativo e pronto para receber webhooks do WhatsApp!

### Próximos Passos:

1. **Monitorar logs** regularmente no Railway
2. **Verificar uso de créditos** no dashboard do Railway
3. **Considerar upgrade** para plano pago se necessário ($5/mês)

---

## 📞 Suporte

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

---

**Última atualização:** Dezembro 2024

