# 📋 Guia Passo a Passo - Configuração Completa

Este guia vai te ajudar a configurar tudo do zero.

## 📌 Visão Geral

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WhatsApp      │────▶│   Seu Servidor  │────▶│ Google Calendar │
│   Flow          │     │   (Node.js)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ n8n (opcional)  │
                        │ Backup/Sheets   │
                        └─────────────────┘
```

---

## 🔧 PARTE 1: Google Calendar

### Passo 1.1: Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Selecionar projeto"** > **"Novo Projeto"**
3. Nome: `barbearia-whatsapp-flow`
4. Clique **"Criar"**

### Passo 1.2: Ativar Google Calendar API

1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Pesquise: **"Google Calendar API"**
3. Clique na API e depois em **"Ativar"**

### Passo 1.3: Criar Service Account

1. No menu lateral, vá em **"APIs e Serviços"** > **"Credenciais"**
2. Clique **"+ Criar Credenciais"** > **"Conta de serviço"**
3. Nome: `barbearia-calendar`
4. Clique **"Criar e continuar"**
5. Pule as permissões, clique **"Concluir"**

### Passo 1.4: Baixar Chave JSON

1. Na lista de Contas de Serviço, clique no email criado
2. Vá na aba **"Chaves"**
3. Clique **"Adicionar chave"** > **"Criar nova chave"**
4. Tipo: **JSON**
5. Clique **"Criar"** (o arquivo será baixado)

### Passo 1.5: Copiar Credenciais

Abra o JSON baixado e copie:
- `client_email` → para `GOOGLE_CLIENT_EMAIL` no .env
- `private_key` → para `GOOGLE_PRIVATE_KEY` no .env

### Passo 1.6: Compartilhar Calendários

Para CADA barbeiro:

1. Abra o Google Calendar do barbeiro
2. Passe o mouse sobre o calendário > 3 pontinhos > **"Configurações"**
3. Role até **"Compartilhar com pessoas específicas"**
4. Clique **"+ Adicionar pessoas"**
5. Cole o `client_email` da Service Account
6. Permissão: **"Fazer alterações nos eventos"**
7. Clique **"Enviar"**

⚠️ **Importante**: Faça isso para cada calendário de barbeiro!

---

## 🔐 PARTE 2: Chaves RSA (WhatsApp)

### Passo 2.1: Instalar Dependências

```bash
cd endpoint-flow
npm install
```

### Passo 2.2: Gerar Chaves

```bash
npm run generate-keys
```

O terminal vai mostrar:
- **Chave Pública** → Copie para o WhatsApp Manager
- **Chave Privada** → Copie para o arquivo `.env`

### Passo 2.3: Criar arquivo .env

```bash
# Copie o exemplo
copy env.example .env

# Edite o .env com suas credenciais
notepad .env
```

---

## 🚀 PARTE 3: Deploy do Servidor

### Opção A: Render.com (Recomendado)

1. Crie conta em https://render.com
2. Clique **"New +"** > **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `whatsapp-flow-barbearia`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Vá em **"Environment"** e adicione as variáveis do `.env`
6. Clique **"Create Web Service"**

Sua URL será: `https://whatsapp-flow-barbearia.onrender.com`

### Opção B: Railway.app

1. Crie conta em https://railway.app
2. Clique **"New Project"** > **"Deploy from GitHub"**
3. Selecione o repositório
4. Vá em **"Variables"** e adicione as do `.env`
5. Deploy automático!

---

## 📱 PARTE 4: Configurar WhatsApp Flow

### Passo 4.1: Acessar WhatsApp Manager

1. Acesse: https://business.facebook.com/wa/manage/
2. Selecione sua conta de negócios
3. No menu lateral: **"Account Tools"** > **"Flows"**

### Passo 4.2: Criar ou Editar Flow

1. Clique **"Create Flow"** ou selecione um existente
2. Na aba **"Editor"**, cole o conteúdo do arquivo `flow.json`

### Passo 4.3: Configurar Endpoint

1. No painel do Flow, encontre **"Definir URI do ponto de extremidade"**
2. Cole sua URL:
   ```
   https://seu-app.onrender.com/webhook/whatsapp-flow
   ```
3. Salve

### Passo 4.4: Assinar Chave Pública

1. Encontre **"Assinar chave pública"**
2. Cole a chave pública gerada (inclui `-----BEGIN PUBLIC KEY-----`)
3. Salve

### Passo 4.5: Publicar o Flow

1. Clique em **"Publish"** ou **"Publicar"**
2. Confirme

---

## 🧪 PARTE 5: Testar

### Teste 1: Verificar Servidor

```bash
curl https://seu-app.onrender.com/
```

Deve retornar:
```json
{"status":"ok","message":"WhatsApp Flow Endpoint - Barbearia"}
```

### Teste 2: Testar Endpoint

```bash
curl -X POST https://seu-app.onrender.com/webhook/whatsapp-flow \
  -H "Content-Type: application/json" \
  -d '{"action":"INIT"}'
```

Deve retornar os dados iniciais com barbeiros e serviços.

### Teste 3: Testar no WhatsApp

1. No WhatsApp Manager, use o **"Builder"** para testar
2. Ou envie uma mensagem de Flow para um número de teste

---

## 🔄 PARTE 6: n8n (Opcional - Backup)

Se quiser usar n8n para backup em Google Sheets:

### Passo 6.1: Importar Workflow

1. No n8n, vá em **"Workflows"** > **"Import from File"**
2. Selecione o arquivo `n8n-workflow.json`

### Passo 6.2: Configurar Credenciais

1. Clique no nó **"Google Calendar"**
2. Configure as credenciais OAuth2 do Google
3. Faça o mesmo para **"Google Sheets (Backup)"**

### Passo 6.3: Configurar Google Sheets

1. Crie uma planilha no Google Sheets
2. Adicione as colunas: Data, Horário, Serviço, Barbeiro, Cliente, Telefone, Email, Observações, Criado em
3. Copie a URL da planilha
4. Cole no nó "Google Sheets (Backup)"

### Passo 6.4: Ativar Workflow

1. Clique em **"Active"** para ativar o workflow
2. A URL do webhook será mostrada

---

## ✅ Checklist Final

- [ ] Google Calendar API ativada
- [ ] Service Account criada
- [ ] Chave JSON baixada
- [ ] Calendários compartilhados com Service Account
- [ ] Chaves RSA geradas
- [ ] Arquivo .env configurado
- [ ] Servidor deployado (Render/Railway)
- [ ] URL do Endpoint configurada no WhatsApp
- [ ] Chave pública assinada no WhatsApp
- [ ] Flow publicado
- [ ] Teste realizado com sucesso

---

## 🆘 Problemas Comuns

### "Erro de criptografia"
- Verifique se a chave privada está correta no `.env`
- Certifique-se que as quebras de linha estão como `\n`

### "Calendário não encontrado"
- Verifique se compartilhou o calendário com a Service Account
- Confirme o ID do calendário no `.env`

### "Horários não aparecem"
- Verifique os logs do servidor
- Confirme que o Google Calendar está configurado

### "Flow não funciona"
- Verifique se o endpoint está acessível
- Confirme que a chave pública está correta
- Veja os logs no Render/Railway

---

## 📞 Próximos Passos

Depois de tudo configurado:

1. **Adicione mais barbeiros** - Edite `calendar-service.js`
2. **Personalize serviços** - Edite `index.js` na função `handleInit`
3. **Customize horários** - Edite `WORKING_HOURS` em `calendar-service.js`
4. **Adicione notificações** - Integre com WhatsApp API para enviar confirmações

Boa sorte! 🚀

