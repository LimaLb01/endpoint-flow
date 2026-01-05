# 🚀 Guia: Clonar Projeto do GitHub em Outro Computador

## ✅ O que funciona 100% ao clonar

Quando você clonar o projeto do GitHub, você terá:

- ✅ **Todo o código fonte** (`src/`, `scripts/`, etc.)
- ✅ **Todas as dependências listadas** (`package.json`)
- ✅ **Documentação completa** (`docs/`)
- ✅ **Arquivos de configuração** (`railway.json`, `vercel.json`, etc.)
- ✅ **Exemplos e templates** (`examples/`, `flow.json`)
- ✅ **Arquivo de exemplo de variáveis** (`env.example`)

---

## ⚠️ O que precisa ser configurado manualmente

Por segurança, estes arquivos **NÃO** estão no GitHub:

### 1. **Arquivo `.env`** (CRÍTICO)
- **O que é:** Variáveis de ambiente com credenciais
- **Como criar:**
  ```bash
  copy env.example .env
  # Depois edite o .env com suas credenciais
  ```

### 2. **Chaves RSA** (`keys/`)
- **O que é:** Chaves de criptografia do WhatsApp
- **Como gerar:**
  ```bash
  npm run generate-keys
  ```
- Isso criará a pasta `keys/` e mostrará as chaves para copiar no `.env`

### 3. **Dependências** (`node_modules/`)
- **O que é:** Bibliotecas do projeto
- **Como instalar:**
  ```bash
  npm install
  ```

### 4. **Configurações locais do Railway** (`.railway/`)
- **O que é:** Configurações locais do Railway CLI
- **Como configurar:**
  ```bash
  railway login
  railway link
  ```

---

## 📋 Passo a Passo Completo

### Passo 1: Clonar do GitHub

```bash
# Navegue até onde quer salvar o projeto
cd C:\Projetos

# Clone o repositório
git clone https://github.com/LimaLb01/endpoint-flow.git FlowBrasil

# Entre na pasta
cd FlowBrasil
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Isso instalará todas as bibliotecas necessárias.

### Passo 3: Criar Arquivo `.env`

```bash
# Copie o arquivo de exemplo
copy env.example .env
```

Depois edite o `.env` e configure:

#### Variáveis OBRIGATÓRIAS:

```env
# Porta do servidor
PORT=3000

# Chave privada RSA (gere no passo 4)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----"

# Google Calendar
GOOGLE_CLIENT_EMAIL=sua-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_GOOGLE\n-----END PRIVATE KEY-----"

# Calendário (use o mesmo para todos ou configure individual)
CALENDAR_LUCAS=lucaslimabr200374@gmail.com
```

#### Variáveis OPCIONAIS (se usar):

```env
# WhatsApp API (para envio automático de flow)
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
WHATSAPP_FLOW_ID=888145740552051

# Supabase (se usar banco de dados)
SUPABASE_URL=https://ajqyqogusrmdsyckhtay.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Stripe (se usar pagamentos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT (para autenticação)
JWT_SECRET=seu-secret-super-seguro
```

### Passo 4: Gerar Chaves RSA

```bash
npm run generate-keys
```

Isso vai:
1. Criar a pasta `keys/`
2. Gerar chave pública e privada
3. Mostrar a chave pública (copie para o WhatsApp)
4. Mostrar a chave privada (copie para o `.env`)

**⚠️ IMPORTANTE:** 
- A chave pública vai no WhatsApp Manager
- A chave privada vai no `.env` como `PRIVATE_KEY`

### Passo 5: Configurar Google Calendar (Se necessário)

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use existente)
3. Ative a **Google Calendar API**
4. Crie uma **Service Account**
5. Baixe o JSON da credencial
6. Copie `client_email` e `private_key` para o `.env`
7. **Compartilhe os calendários** com o email da Service Account

### Passo 6: Testar Localmente

```bash
# Modo desenvolvimento
npm run dev

# Ou modo produção
npm start
```

O servidor deve iniciar em: `http://localhost:3000`

### Passo 7: Verificar se Funcionou

Abra outro terminal e teste:

```bash
curl http://localhost:3000/health
```

Deve retornar: `{"status": "healthy"}`

---

## 🔗 Conectar ao Railway (Opcional)

Se quiser gerenciar o deploy:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Linkar o projeto
railway link
# Selecione: FlowBrasil > whatsapp-flow-endpoint
```

---

## ✅ Checklist Final

Antes de usar, verifique:

- [ ] Projeto clonado do GitHub
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Chaves RSA geradas (`npm run generate-keys`)
- [ ] Chave privada copiada para `.env`
- [ ] Google Calendar configurado (se usar)
- [ ] Servidor inicia sem erros (`npm start`)
- [ ] Health check funciona (`/health`)

---

## 🆘 Problemas Comuns

### Erro: "Cannot find module"
**Solução:** Execute `npm install`

### Erro: "Chave privada não configurada"
**Solução:** 
1. Execute `npm run generate-keys`
2. Copie a chave privada para o `.env` como `PRIVATE_KEY`

### Erro: "Google Calendar não configurado"
**Solução:** Configure `GOOGLE_CLIENT_EMAIL` e `GOOGLE_PRIVATE_KEY` no `.env`

### Erro: "Port 3000 already in use"
**Solução:** 
- Altere `PORT=3001` no `.env`
- Ou feche o processo que está usando a porta 3000

---

## 📝 Resumo

### ✅ Funciona automaticamente:
- Código completo
- Estrutura do projeto
- Documentação
- Scripts e utilitários

### ⚠️ Precisa configurar:
- `.env` (variáveis de ambiente)
- `keys/` (chaves RSA)
- `node_modules/` (dependências)
- Credenciais do Google Calendar
- Tokens do WhatsApp (se usar)

---

## 🎯 Conclusão

**SIM, você pode clonar do GitHub e usar 100%!**

Mas precisa configurar:
1. Instalar dependências (`npm install`)
2. Criar `.env` com suas credenciais
3. Gerar chaves RSA (`npm run generate-keys`)
4. Configurar serviços externos (Google Calendar, WhatsApp, etc.)

**Tempo estimado:** 10-15 minutos para configurar tudo.

---

**Última atualização:** Janeiro 2026

