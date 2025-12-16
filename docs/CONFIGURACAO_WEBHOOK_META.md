# 🔗 Configuração do Webhook no Meta Developers

Este guia mostra **exatamente** o que colocar em cada campo na tela de configuração de webhooks do Meta Developers.

---

## 📋 Informações do Webhook

### **URL de Callback (Callback URL):**

**Se você já migrou para Railway:**
```
https://seu-projeto.up.railway.app/webhook/whatsapp-flow
```

**Se ainda está no Render:**
```
https://seu-projeto.onrender.com/webhook/whatsapp-flow
```

**⚠️ IMPORTANTE:**
- Substitua `seu-projeto` pelo nome real do seu projeto
- A URL deve terminar com `/webhook/whatsapp-flow`
- Use `https://` (não `http://`)

---

### **Token de Verificação (Verify Token):**

```
flow_verify_token_2024
```

**Ou, se você configurou uma variável de ambiente personalizada:**
- Use o valor da variável `WEBHOOK_VERIFY_TOKEN` (se configurada)
- Caso contrário, use o padrão: `flow_verify_token_2024`

---

## 🎯 Passo a Passo no Meta Developers

### 1. Acessar a Configuração

1. Acesse: **https://developers.facebook.com/**
2. Selecione seu app: **"Flow Barbearia"**
3. No menu lateral, vá em **"Webhooks"** (já está selecionado na sua tela)

### 2. Selecionar o Produto

1. No dropdown **"Selecione o produto"**, escolha:
   - **"Whatsapp Business Account"** ✅

### 3. Configurar o Webhook

1. **URL de callback:**
   - Cole a URL completa do seu endpoint
   - Exemplo: `https://endpoint-flow-production.up.railway.app/webhook/whatsapp-flow`
   - ⚠️ **Substitua pelo seu domínio real!**

2. **Token de verificação:**
   - Cole: `flow_verify_token_2024`
   - Ou use o valor da variável `WEBHOOK_VERIFY_TOKEN` se configurada

3. **Certificado de cliente:**
   - Deixe **desativado** (toggle off) ✅
   - Não é necessário para este projeto

### 4. Verificar e Salvar

1. Clique no botão azul **"Verificar e salvar"**
2. O Meta vai fazer uma requisição GET para seu endpoint
3. Se tudo estiver correto, você verá: **"Webhook verificado com sucesso!"**
4. Se der erro, verifique:
   - Se a URL está correta
   - Se o token está correto
   - Se o endpoint está acessível publicamente

---

## 📊 Campos do Webhook (Webhook Fields)

### Campos que você DEVE assinar:

Na seção **"Campos do webhook"**, ative (toggle ON) os seguintes campos:

#### ✅ **messages** (Obrigatório)
- **Versão:** v24.0 (ou a mais recente)
- **Assinar:** ✅ Ativado (toggle ON)
- **O que faz:** Recebe mensagens de texto e respostas de Flow

#### ✅ **flows** (Opcional, mas recomendado)
- **Versão:** v24.0 (ou a mais recente)
- **Assinar:** ✅ Ativado (toggle ON)
- **O que faz:** Recebe notificações sobre mudanças no Flow (publicação, etc.)

#### ⚠️ **account_alerts** (Opcional)
- **Versão:** v24.0 (ou a mais recente)
- **Assinar:** ⚠️ Opcional (pode deixar desativado)
- **O que faz:** Recebe alertas sobre a conta

---

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar no Meta Developers

1. Após clicar em **"Verificar e salvar"**, você deve ver:
   - ✅ Status: **"Verificado"**
   - ✅ URL: Sua URL aparecerá em verde

### 2. Verificar nos Logs

1. No Railway (ou Render), vá em **"Logs"**
2. Quando o Meta verificar o webhook, você verá:
   ```
   ✅ Webhook verificado com sucesso!
   ```

### 3. Testar Enviando Mensagem

1. Envie uma mensagem de texto para o número do WhatsApp
2. Verifique os logs - você deve ver:
   ```
   📥 Requisição recebida
   🔍 Detectado webhook do WhatsApp Business Account
   📨 Mensagem de texto recebida de [número]
   ```

---

## ⚠️ Troubleshooting

### Erro: "Webhook verification failed"

**Possíveis causas:**
1. **URL incorreta:**
   - Verifique se a URL está completa e correta
   - Teste a URL no navegador: `https://seu-projeto.up.railway.app/health`
   - Deve retornar: `{"status": "healthy"}`

2. **Token incorreto:**
   - Verifique se o token é exatamente: `flow_verify_token_2024`
   - Sem espaços extras
   - Case-sensitive (minúsculas)

3. **Endpoint não acessível:**
   - Verifique se o serviço está rodando no Railway
   - Verifique se não há firewall bloqueando
   - Teste a URL no navegador

### Erro: "Invalid signature"

**Solução:**
- Isso é normal se você não configurou `APP_SECRET`
- O código está configurado para continuar mesmo sem validação de assinatura
- Para ativar validação, adicione a variável `APP_SECRET` no Railway

### Webhook não recebe mensagens

**Verifique:**
1. Se o campo **"messages"** está assinado (toggle ON)
2. Se a URL está correta
3. Se o endpoint está respondendo (verifique logs)
4. Se o número do WhatsApp está conectado ao app

---

## 📝 Resumo Rápido

**URL de Callback:**
```
https://seu-projeto.up.railway.app/webhook/whatsapp-flow
```

**Token de Verificação:**
```
flow_verify_token_2024
```

**Campos para Assinar:**
- ✅ **messages** (obrigatório)
- ✅ **flows** (recomendado)

**Certificado de Cliente:**
- ❌ Desativado

---

## ✅ Checklist

- [ ] URL de callback configurada corretamente
- [ ] Token de verificação configurado
- [ ] Webhook verificado com sucesso
- [ ] Campo "messages" assinado
- [ ] Campo "flows" assinado (opcional)
- [ ] Teste enviando mensagem
- [ ] Logs confirmando recebimento

---

**Última atualização:** Dezembro 2024

