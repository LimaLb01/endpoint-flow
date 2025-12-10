# ✅ Passo 1 Concluído: Chaves RSA Geradas!

## 📋 O que foi feito:
- ✅ Chaves RSA geradas com sucesso
- ✅ Arquivo `.env` criado com a chave privada
- ✅ Arquivo `CHAVE_PUBLICA.txt` criado para facilitar a cópia

---

## 🎯 PRÓXIMO PASSO: Configurar Google Calendar

### 📅 Passo 2: Criar Service Account no Google Cloud

**Tempo estimado:** 10-15 minutos

#### 2.1. Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Se não tiver conta, crie uma (é grátis)
3. Clique em **"Selecionar projeto"** (canto superior direito)
4. Clique em **"Novo Projeto"**
5. Nome do projeto: `barbearia-whatsapp-flow`
6. Clique em **"Criar"**
7. Aguarde alguns segundos e selecione o projeto criado

#### 2.2. Ativar Google Calendar API

1. No menu lateral esquerdo, clique em **"APIs e Serviços"** > **"Biblioteca"**
2. Na barra de pesquisa, digite: `Google Calendar API`
3. Clique na opção **"Google Calendar API"**
4. Clique no botão azul **"ATIVAR"**
5. Aguarde alguns segundos até aparecer "API ativada"

#### 2.3. Criar Service Account

1. No menu lateral, vá em **"APIs e Serviços"** > **"Credenciais"**
2. Clique no botão **"+ CRIAR CREDENCIAIS"** (no topo)
3. Selecione **"Conta de serviço"**
4. Preencha:
   - **Nome da conta de serviço:** `barbearia-calendar`
   - **ID da conta de serviço:** (deixe o padrão)
   - **Descrição:** `Conta para WhatsApp Flow - Barbearia`
5. Clique em **"Criar e continuar"**
6. Na próxima tela (Conceder acesso), **PULE** clicando em **"Continuar"**
7. Na última tela, clique em **"Concluído"**

#### 2.4. Baixar Chave JSON

1. Na lista de **"Contas de serviço"**, clique no email que você criou (algo como `barbearia-calendar@seu-projeto.iam.gserviceaccount.com`)
2. Vá na aba **"Chaves"** (no topo)
3. Clique em **"Adicionar chave"** > **"Criar nova chave"**
4. Selecione o tipo: **JSON**
5. Clique em **"Criar"**
6. ⚠️ **IMPORTANTE:** O arquivo JSON será baixado automaticamente. **GUARDE ELE EM LUGAR SEGURO!**

#### 2.5. Copiar Credenciais para o .env

1. Abra o arquivo JSON que foi baixado
2. Você verá algo assim:
```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "barbearia-calendar@seu-projeto.iam.gserviceaccount.com",
  ...
}
```

3. Copie o valor de `client_email` e cole no arquivo `.env` na linha `GOOGLE_CLIENT_EMAIL=`
4. Copie o valor de `private_key` (todo o conteúdo entre as aspas, incluindo `\n`) e cole no arquivo `.env` na linha `GOOGLE_PRIVATE_KEY=`

**Exemplo:**
```env
GOOGLE_CLIENT_EMAIL=barbearia-calendar@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n"
```

#### 2.6. Compartilhar Calendários com a Service Account

Para cada barbeiro, você precisa compartilhar o calendário:

1. Abra o Google Calendar (https://calendar.google.com)
2. No lado esquerdo, passe o mouse sobre o calendário do barbeiro
3. Clique nos **3 pontinhos** ao lado do nome
4. Clique em **"Configurações e compartilhamento"**
5. Role até a seção **"Compartilhar com pessoas específicas"**
6. Clique em **"+ Adicionar pessoas"**
7. Cole o email da Service Account (o `client_email` que você copiou)
8. No menu de permissões, selecione: **"Fazer alterações nos eventos"**
9. Clique em **"Enviar"**
10. ⚠️ **IMPORTANTE:** Repita isso para CADA calendário de barbeiro!

---

## ✅ Quando terminar o Passo 2:

Me avise quando:
- ✅ Service Account criada
- ✅ Chave JSON baixada
- ✅ Credenciais copiadas para o `.env`
- ✅ Calendários compartilhados

Depois disso, vamos para o **Passo 3: Deploy do Servidor**! 🚀

---

## 💡 Dica:

Se você ainda não tem calendários criados para os barbeiros:
1. No Google Calendar, clique em **"+"** ao lado de "Outros calendários"
2. Clique em **"Criar novo calendário"**
3. Nome: `João Silva - Barbearia` (ou o nome do barbeiro)
4. Clique em **"Criar calendário"**
5. Repita para cada barbeiro

