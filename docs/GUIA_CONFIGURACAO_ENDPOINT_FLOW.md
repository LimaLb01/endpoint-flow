# 🔧 Guia Completo: Configuração do Endpoint no Flow - Meta Developers

## 📋 Informações Necessárias

### **URL do Endpoint (Railway):**
```
https://whatsapp-flow-endpoint-production.up.railway.app/webhook/whatsapp-flow
```

### **Chave Pública:**
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyXzkNCU9AT6XubtMbnXt
6r5lJs/Izkmx5rnfivTeSsbt860/OuHoWmYn/5z10QrHHggBUTtwlPBftI3J8CuX
Z9RalXxzKybw6HOjRJ78Mdew13sBJKlhqgiy5JzCiQ3lsZTaALKceLvjwHY/JDPY
vFZreQyRLPnIwajvRLSHQLjgtLZpDicZ9riM1+v5dGNtmAy/fhloEPmwE4xWejA+
z31vc8xNSubjbKZc4w/rVP/W7gy0W//bF8VvMqAixu5KLIT5/LpG6P35DTBi9t1z
fviqNR39H8qhssBj2btS9WZJFLpHDvyjjkfmnh0HOYwpd5Gx8kpNAptBBMkISWfk
jQIDAQAB
-----END PUBLIC KEY-----
```

---

## 🎯 Passo a Passo Completo

### **Etapa 1: Definir URI do Ponto de Extremidade** ✅

**O que fazer:**
1. No campo de texto ao lado de "Definir URI do ponto de extremidade"
2. Cole a URL **COMPLETA**:
   ```
   https://whatsapp-flow-endpoint-production.up.railway.app/webhook/whatsapp-flow
   ```
3. Clique no botão **"Enviar"** ao lado do campo

**⚠️ IMPORTANTE:**
- A URL deve ser **COMPLETA** (não pode estar cortada)
- Deve terminar com `/webhook/whatsapp-flow`
- Deve começar com `https://`
- Não pode ter espaços extras

**Como verificar se está correto:**
- Após clicar em "Enviar", deve aparecer um check verde ✅
- Se aparecer erro, verifique se a URL está completa

---

### **Etapa 2: Adicionar Número de Telefone** ✅

**O que fazer:**
1. Clique em "Adicionar número de telefone"
2. Selecione o número do WhatsApp Business configurado
3. O número deve estar conectado ao seu app Meta

**Status:** ✅ Já está marcado com check verde

---

### **Etapa 3: Assinar Chave Pública** ✅

**O que fazer:**
1. Clique em "Assinar chave pública"
2. Cole a chave pública **COMPLETA** (incluindo as linhas `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`):

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyXzkNCU9AT6XubtMbnXt
6r5lJs/Izkmx5rnfivTeSsbt860/OuHoWmYn/5z10QrHHggBUTtwlPBftI3J8CuX
Z9RalXxzKybw6HOjRJ78Mdew13sBJKlhqgiy5JzCiQ3lsZTaALKceLvjwHY/JDPY
vFZreQyRLPnIwajvRLSHQLjgtLZpDicZ9riM1+v5dGNtmAy/fhloEPmwE4xWejA+
z31vc8xNSubjbKZc4w/rVP/W7gy0W//bF8VvMqAixu5KLIT5/LpG6P35DTBi9t1z
fviqNR39H8qhssBj2btS9WZJFLpHDvyjjkfmnh0HOYwpd5Gx8kpNAptBBMkISWfk
jQIDAQAB
-----END PUBLIC KEY-----
```

**⚠️ IMPORTANTE:**
- Copie **TUDO**, incluindo as linhas `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`
- Mantenha as quebras de linha
- Não adicione espaços extras
- Cole exatamente como está acima

**Status:** ✅ Já está marcado com check verde

---

### **Etapa 4: Conectar App da Meta** ✅

**O que fazer:**
1. Clique em "Conectar app da Meta"
2. Selecione o app Meta que você criou para o WhatsApp
3. O app deve ter permissões para WhatsApp Business API

**Status:** ✅ Já está marcado com check verde

---

### **Etapa 5: Verificação de Integridade** ❌ (Com Erro)

**O que fazer:**
1. Clique no botão **"Faça a verificação de integridade"**
2. O Meta vai fazer uma requisição de health check para seu endpoint
3. Se tudo estiver correto, deve aparecer um check verde ✅

**O que o Meta verifica:**
- ✅ Endpoint está acessível (HTTPS)
- ✅ Endpoint responde corretamente
- ✅ Health check retorna status válido
- ✅ Criptografia está funcionando

**Se der erro na verificação:**
- Verifique se a URL está correta e completa
- Verifique se o servidor está rodando no Railway
- Verifique os logs do Railway para ver se a requisição chegou

---

## 🔍 Verificações Importantes

### 1. **Verificar URL do Endpoint**

Teste a URL no navegador:
```
https://whatsapp-flow-endpoint-production.up.railway.app/
```

**Deve retornar:**
```json
{
  "status": "ok",
  "message": "WhatsApp Flow Endpoint - Barbearia",
  "version": "2.0.0",
  "timestamp": "..."
}
```

### 2. **Verificar Health Check**

O Meta faz uma requisição GET para:
```
https://whatsapp-flow-endpoint-production.up.railway.app/webhook/whatsapp-flow?hub.mode=subscribe&hub.verify_token=flow_verify_token_2024&hub.challenge=test123
```

**Deve retornar:** `test123` (o valor do challenge)

### 3. **Verificar Logs do Railway**

Após fazer a verificação de integridade, verifique os logs:
- Deve aparecer: `✅ Webhook verificado com sucesso!`
- Se aparecer erro, os logs mostrarão o problema

---

## ⚠️ Problemas Comuns

### Problema 1: URL Incompleta

**Sintoma:** URL aparece cortada no campo

**Solução:**
- Cole a URL completa novamente
- Verifique se não há espaços extras
- A URL deve ser: `https://whatsapp-flow-endpoint-production.up.railway.app/webhook/whatsapp-flow`

### Problema 2: Verificação de Integridade Falha

**Possíveis causas:**
1. **Servidor não está rodando**
   - Verifique no Railway se o serviço está ativo
   - Verifique os logs do Railway

2. **URL incorreta**
   - Verifique se a URL está completa
   - Teste a URL no navegador

3. **Health check falhando**
   - Verifique se o endpoint `/webhook/whatsapp-flow` responde
   - Verifique os logs do Railway

### Problema 3: Chave Pública Inválida

**Sintoma:** Erro ao assinar chave pública

**Solução:**
- Copie a chave pública COMPLETA do arquivo `CHAVE_PUBLICA.txt`
- Inclua as linhas `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`
- Mantenha as quebras de linha

---

## ✅ Checklist Final

Antes de testar o Flow, verifique:

- [ ] **Etapa 1:** URL do endpoint configurada e completa
- [ ] **Etapa 2:** Número de telefone adicionado
- [ ] **Etapa 3:** Chave pública assinada (check verde)
- [ ] **Etapa 4:** App da Meta conectado (check verde)
- [ ] **Etapa 5:** Verificação de integridade passou (check verde)
- [ ] Servidor rodando no Railway
- [ ] Health check funcionando
- [ ] Logs do Railway sem erros

---

## 🧪 Teste Após Configuração

1. **Salvar o Flow**
   - Clique em **"Salvar"** no topo da página

2. **Publicar o Flow**
   - Clique em **"Publicar"** no topo da página
   - Aguarde a publicação ser concluída

3. **Testar o Flow**
   - Envie uma mensagem de texto para o número
   - Abra o Flow que foi enviado
   - Verifique se abre corretamente

4. **Verificar Logs**
   - Veja os logs do Railway
   - Deve aparecer requisições `INIT` quando o Flow é aberto

---

## 📝 Resumo Rápido

**URL do Endpoint:**
```
https://whatsapp-flow-endpoint-production.up.railway.app/webhook/whatsapp-flow
```

**Chave Pública:** (ver arquivo `CHAVE_PUBLICA.txt`)

**Token de Verificação:** `flow_verify_token_2024`

---

**Última atualização:** 16/12/2025

