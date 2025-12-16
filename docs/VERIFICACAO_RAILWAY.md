# 🔍 Verificação Completa do Railway

## 📋 Status Atual

✅ **Railway CLI instalado**  
❌ **Não está logado** - Precisa fazer login primeiro

---

## 🔐 Passo 1: Fazer Login no Railway

Execute no terminal:

```bash
railway login
```

Isso vai:
1. Abrir o navegador automaticamente
2. Pedir para autorizar o Railway CLI
3. Fazer login automaticamente

**Ou se preferir usar token:**

```bash
railway login --browserless
```

---

## 📊 Comandos para Verificação Completa

Após fazer login, execute estes comandos para verificar tudo:

### 1. Listar Projetos
```bash
railway list
```

### 2. Ver Status do Projeto
```bash
railway status
```

### 3. Ver Deploys Recentes
```bash
railway logs
```

### 4. Ver Variáveis de Ambiente
```bash
railway variables
```

### 5. Ver Domínios/URLs
```bash
railway domain
```

---

## 🔍 Verificação Manual no Dashboard

Enquanto isso, você pode verificar manualmente:

1. **Acesse:** https://railway.app
2. **Faça login** com sua conta
3. **Verifique:**

### ✅ Checklist de Verificação:

- [ ] **Projeto criado e ativo**
  - Vá em "Projects" → Seu projeto deve aparecer
  
- [ ] **Serviço rodando**
  - Clique no projeto → Deve mostrar o serviço
  - Status deve ser "Active" (verde)
  
- [ ] **Deploy bem-sucedido**
  - Vá em "Deployments"
  - Último deploy deve ter status "Success" (verde)
  - Verifique a data/hora (deve ser recente)
  
- [ ] **URL pública configurada**
  - Vá em "Settings" → "Domains"
  - Deve ter uma URL como: `seu-projeto.up.railway.app`
  - Copie essa URL completa
  
- [ ] **Variáveis de ambiente configuradas**
  - Vá em "Variables"
  - Verifique se TODAS as variáveis do Render foram copiadas:
    - ✅ `PORT=3000`
    - ✅ `PRIVATE_KEY=...`
    - ✅ `GOOGLE_CLIENT_EMAIL=...`
    - ✅ `GOOGLE_PRIVATE_KEY=...`
    - ✅ `CALENDAR_JOAO=...`
    - ✅ `CALENDAR_PEDRO=...`
    - ✅ `CALENDAR_CARLOS=...`
    - ✅ Outras variáveis opcionais (se usar)
  
- [ ] **Logs sem erros**
  - Vá em "Deployments" → Clique no deploy mais recente
  - Vá em "Logs"
  - Verifique se não há erros vermelhos
  - Deve aparecer: `🚀 Servidor rodando na porta 3000`
  
- [ ] **Endpoint acessível**
  - Teste no navegador: `https://seu-projeto.up.railway.app/health`
  - Deve retornar: `{"status": "healthy"}`

---

## 🐛 Problemas Comuns

### Erro: "Service not found"
- Verifique se o projeto foi criado corretamente
- Verifique se está no projeto correto

### Erro: "Deploy failed"
- Verifique os logs do deploy
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o `package.json` está correto

### Erro: "Endpoint not responding"
- Verifique se o serviço está rodando (status "Active")
- Verifique se a porta está configurada (`PORT=3000`)
- Verifique os logs para erros

### Erro: "Webhook verification failed"
- Verifique se a URL está completa: `https://seu-projeto.up.railway.app/webhook/whatsapp-flow`
- Verifique se o endpoint `/health` responde
- Verifique os logs do Railway quando tentar verificar o webhook

---

## 📝 Após Fazer Login

Depois de fazer `railway login`, me avise e eu posso:
- ✅ Listar seus projetos
- ✅ Verificar status dos serviços
- ✅ Ver logs recentes
- ✅ Verificar variáveis de ambiente
- ✅ Verificar deploys
- ✅ Testar endpoints

---

**Última atualização:** Dezembro 2024

