# 🔑 Guia Completo: Variáveis de Ambiente no Render

Este guia explica **exatamente** o que colocar em cada variável de ambiente no Render.

---

## 📍 Como Adicionar Variáveis no Render

1. Acesse: https://dashboard.render.com
2. Selecione seu serviço `endpoint-flow`
3. Vá em **Environment** (no menu lateral)
4. Clique em **Add Environment Variable**
5. Adicione cada variável abaixo
6. Clique **Save Changes**
7. Aguarde o redeploy automático (~30 segundos)

---

## ✅ Variáveis OBRIGATÓRIAS

### 1. `PORT`
**O que é:** Porta do servidor  
**Valor:** `3000`  
**Exemplo:**
```
PORT=3000
```
**Nota:** Render define automaticamente, mas é bom deixar explícito.

---

### 2. `PRIVATE_KEY`
**O que é:** Chave privada RSA para descriptografar mensagens do WhatsApp  
**Onde encontrar:** 
- Gere com: `npm run generate-keys` (localmente)
- Ou copie do arquivo `keys/private_key.pem` (se já gerou)

**Como colar no Render:**
1. Abra o arquivo `keys/private_key.pem`
2. Copie **TUDO**, incluindo as linhas:
   ```
   -----BEGIN PRIVATE KEY-----
   [conteúdo da chave]
   -----END PRIVATE KEY-----
   ```
3. No Render, cole **exatamente assim** (com quebras de linha):
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   [resto da chave]
   -----END PRIVATE KEY-----
   ```

**⚠️ IMPORTANTE:** 
- Mantenha as quebras de linha (`\n`)
- Não adicione espaços extras
- Cole exatamente como está no arquivo

---

### 3. `GOOGLE_CLIENT_EMAIL`
**O que é:** Email da Service Account do Google Calendar  
**Onde encontrar:**
1. Acesse: https://console.cloud.google.com/
2. Vá em **IAM & Admin** > **Service Accounts**
3. Clique na Service Account criada
4. Copie o **Email** (formato: `nome@projeto.iam.gserviceaccount.com`)

**Exemplo:**
```
GOOGLE_CLIENT_EMAIL=calendar-service@minha-barbearia.iam.gserviceaccount.com
```

---

### 4. `GOOGLE_PRIVATE_KEY`
**O que é:** Chave privada da Service Account do Google Calendar  
**Onde encontrar:**
1. No Google Cloud Console, na Service Account
2. Vá em **Keys** > **Add Key** > **Create new key**
3. Escolha **JSON**
4. Baixe o arquivo JSON
5. Abra o JSON e copie o valor de `private_key` (dentro de `"private_key": "-----BEGIN PRIVATE KEY-----\n..."`)

**Como colar no Render:**
1. Copie **TUDO** do campo `private_key` do JSON
2. Cole **exatamente como está** (com `\n` para quebras de linha):
   ```
   -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
   ```

**⚠️ IMPORTANTE:** 
- Mantenha os `\n` (não substitua por quebras de linha reais)
- Cole exatamente como está no JSON

---

### 5. `CALENDAR_JOAO`
**O que é:** ID do calendário do barbeiro João  
**Onde encontrar:**
1. Acesse: https://calendar.google.com/
2. Vá em **Configurações** > **Configurações de compartilhamento**
3. Procure o calendário do barbeiro
4. Role até **Integrar calendário**
5. Copie o **ID do calendário** (formato: `abc123@group.calendar.google.com`)

**Exemplo:**
```
CALENDAR_JOAO=joao.barber@group.calendar.google.com
```

**Ou use:**
```
CALENDAR_JOAO=primary
```
(Se compartilhou o calendário principal com a Service Account)

---

### 6. `CALENDAR_PEDRO`
**O que é:** ID do calendário do barbeiro Pedro  
**Mesmo processo acima**

**Exemplo:**
```
CALENDAR_PEDRO=pedro.barber@group.calendar.google.com
```

---

### 7. `CALENDAR_CARLOS`
**O que é:** ID do calendário do barbeiro Carlos  
**Mesmo processo acima**

**Exemplo:**
```
CALENDAR_CARLOS=carlos.barber@group.calendar.google.com
```

---

## 🔧 Variáveis OPCIONAIS (mas recomendadas)

### 8. `APP_SECRET`
**O que é:** App Secret do Meta para validar assinatura de requisições  
**Onde encontrar:**
1. Acesse: https://developers.facebook.com/
2. Vá em **Meus Apps** > Seu app
3. Vá em **Configurações** > **Básico**
4. Role até **App Secret**
5. Clique em **Mostrar** e copie

**Exemplo:**
```
APP_SECRET=1a5fb882fce78c5fdbf5be5364b6e13e
```

**⚠️ IMPORTANTE:** Sem isso, a validação de assinatura fica desativada (menos seguro).

---

### 9. `PASSPHRASE`
**O que é:** Senha da chave privada RSA (se você definiu uma ao gerar)  
**Valor:** Deixe **VAZIO** se não usou senha ao gerar a chave

**Exemplo:**
```
PASSPHRASE=
```

---

## 🤖 Variáveis para ENVIO AUTOMÁTICO DE FLOW

### 10. `WHATSAPP_ACCESS_TOKEN`
**O que é:** Token de acesso da API do WhatsApp  
**Onde encontrar:**
1. Acesse: https://developers.facebook.com/
2. Vá em **Meus Apps** > Seu app
3. Vá em **WhatsApp** > **Configuração da API**
4. Role até **Token de acesso temporário**
5. Clique em **Gerar token** ou copie o existente

**Exemplo:**
```
WHATSAPP_ACCESS_TOKEN=EAAMDGFdA9S4BQBKd6MJkSevGITJUHsjJHASDGsZAlrAzn2zk6EbhvH1UV2BYtib4Jl23IshEMOybpEFz08vCEXHG6PPQKXAi9KwFa45RDVeOIBjVkjQ8XuxZC8vUPabjelR2S9yh7aFS0d30MUyZAJ5S7vNQazbZCPcnD6C8wjKzXBvpfPyTHD8nHfI7WwZDZD
```

**⚠️ IMPORTANTE:** 
- Tokens temporários expiram em 24 horas
- Para produção, use um token permanente (via sistema de tokens)

---

### 11. `WHATSAPP_PHONE_NUMBER_ID`
**O que é:** ID do número de telefone do WhatsApp Business  
**Onde encontrar:**
1. Acesse: https://business.facebook.com/wa/manage/
2. Vá em **Configurações da conta** > **Números de telefone**
3. Clique no número
4. Copie o **ID do número de telefone** (formato: `995661083621366`)

**Exemplo:**
```
WHATSAPP_PHONE_NUMBER_ID=995661083621366
```

---

### 12. `WHATSAPP_FLOW_ID`
**O que é:** ID do Flow criado no WhatsApp Manager  
**Onde encontrar:**
1. Acesse: https://business.facebook.com/wa/manage/flows/
2. Clique no Flow criado
3. Na URL, você verá: `.../flows/888145740552051`
4. Copie o número (última parte da URL)

**Exemplo:**
```
WHATSAPP_FLOW_ID=888145740552051
```

---

### 13. `AUTO_SEND_FLOW_NUMBER`
**O que é:** Número específico para enviar flow automaticamente  
**Valor:** 
- Deixe **VAZIO** para enviar para qualquer número que enviar mensagem
- Ou coloque um número específico (ex: `555492917132`)

**Exemplo (para qualquer número):**
```
AUTO_SEND_FLOW_NUMBER=
```

**Exemplo (número específico):**
```
AUTO_SEND_FLOW_NUMBER=555492917132
```

---

## 📋 Resumo: Checklist de Variáveis

### ✅ Obrigatórias
- [ ] `PORT=3000`
- [ ] `PRIVATE_KEY` (chave privada RSA completa)
- [ ] `GOOGLE_CLIENT_EMAIL` (email da Service Account)
- [ ] `GOOGLE_PRIVATE_KEY` (chave privada do Google)
- [ ] `CALENDAR_JOAO` (ID do calendário)
- [ ] `CALENDAR_PEDRO` (ID do calendário)
- [ ] `CALENDAR_CARLOS` (ID do calendário)

### 🔧 Recomendadas
- [ ] `APP_SECRET` (App Secret do Meta)
- [ ] `PASSPHRASE` (deixe vazio se não usou senha)

### 🤖 Envio Automático (Opcional)
- [ ] `WHATSAPP_ACCESS_TOKEN` (token da API)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` (ID do número)
- [ ] `WHATSAPP_FLOW_ID` (ID do Flow)
- [ ] `AUTO_SEND_FLOW_NUMBER` (número específico ou vazio)

---

## 🚨 Problemas Comuns

### ❌ "Invalid signature"
**Solução:** Adicione `APP_SECRET` corretamente

### ❌ "Private key format error"
**Solução:** 
- Certifique-se de colar a chave completa (com `-----BEGIN` e `-----END`)
- Mantenha as quebras de linha (`\n`)

### ❌ "Google Calendar API error"
**Solução:**
- Verifique se `GOOGLE_CLIENT_EMAIL` está correto
- Verifique se `GOOGLE_PRIVATE_KEY` está completa
- Certifique-se de que compartilhou os calendários com o email da Service Account

### ❌ "Flow não envia automaticamente"
**Solução:**
- Verifique se `WHATSAPP_ACCESS_TOKEN` está válido (não expirado)
- Verifique se `WHATSAPP_PHONE_NUMBER_ID` está correto
- Verifique se `WHATSAPP_FLOW_ID` está correto

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas sobre onde encontrar algum valor, consulte:
- **Google Calendar:** https://calendar.google.com/
- **Google Cloud Console:** https://console.cloud.google.com/
- **Meta Developers:** https://developers.facebook.com/
- **WhatsApp Manager:** https://business.facebook.com/wa/manage/

