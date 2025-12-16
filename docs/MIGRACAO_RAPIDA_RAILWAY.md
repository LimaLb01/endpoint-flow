# ⚡ Migração Rápida: Render → Railway

## 🎯 Resumo em 5 Passos

### 1️⃣ Criar Conta e Projeto
- Acesse: https://railway.app
- Login com GitHub
- New Project → Deploy from GitHub repo
- Selecione seu repositório

### 2️⃣ Copiar Variáveis do Render
No Railway → Variables → Adicione todas:

**OBRIGATÓRIAS:**
```
PORT=3000
PRIVATE_KEY=[copiar do Render]
GOOGLE_CLIENT_EMAIL=[copiar do Render]
GOOGLE_PRIVATE_KEY=[copiar do Render]
CALENDAR_JOAO=[copiar do Render]
CALENDAR_PEDRO=[copiar do Render]
CALENDAR_CARLOS=[copiar do Render]
```

**OPCIONAIS (se usar):**
```
PASSPHRASE=[copiar do Render]
APP_SECRET=[copiar do Render]
WHATSAPP_ACCESS_TOKEN=[copiar do Render]
WHATSAPP_PHONE_NUMBER_ID=[copiar do Render]
WHATSAPP_FLOW_ID=[copiar do Render]
AUTO_SEND_FLOW_NUMBER=[copiar do Render]
```

### 3️⃣ Obter URL do Railway
- Settings → Domains
- Copie a URL: `seu-projeto.up.railway.app`

### 4️⃣ Atualizar Webhook do WhatsApp
- Meta Developer → WhatsApp → Configuration
- Editar Callback URL
- Substituir: `onrender.com` → `up.railway.app`
- Salvar

### 5️⃣ Testar
- Enviar mensagem no WhatsApp
- Verificar logs no Railway
- Confirmar agendamento no Google Calendar

---

## ✅ Checklist Rápido

- [ ] Projeto criado no Railway
- [ ] Variáveis copiadas do Render
- [ ] URL anotada
- [ ] Webhook atualizado
- [ ] Teste realizado

**⏱️ Tempo total: ~10 minutos**

---

## 🔗 Links Úteis

- **Railway Dashboard:** https://railway.app
- **Guia Completo:** Ver `GUIA_MIGRACAO_RAILWAY.md`

