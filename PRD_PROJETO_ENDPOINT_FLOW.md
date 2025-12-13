# 📋 PRD - Endpoint Flow WhatsApp + Google Calendar Integration

**Data:** 13/12/2025  
**Projeto:** Sistema de Agendamento de Barbearia via WhatsApp Flow  
**Status:** Em desenvolvimento - Problema com placeholders na tela terminal

---

## 🎯 Objetivo do Projeto

Criar um sistema completo de agendamento de barbearia integrado ao WhatsApp Business API usando **WhatsApp Flow** para a interface do usuário e **Google Calendar API** para gerenciar a disponibilidade e criar eventos de agendamento em tempo real.

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Endpoint (Backend)**
   - **URL:** `https://endpoint-flow.onrender.com/webhook/whatsapp-flow`
   - **Plataforma:** Render.com
   - **Tecnologia:** Node.js/Express
   - **Função:** Processa requisições do WhatsApp Flow, gerencia dados e integra com Google Calendar

2. **WhatsApp Flow**
   - **Flow ID:** `888145740552051`
   - **Nome:** "agendamento_barbearia"
   - **Função:** Interface interativa dentro do WhatsApp para coleta de dados do cliente

3. **Google Calendar**
   - **Função:** Gerencia disponibilidade de horários e cria eventos de agendamento
   - **Integração:** Via Service Account

---

## 📱 Fluxo do Usuário (WhatsApp Flow)

### Telas do Flow

1. **WELCOME** - Tela inicial de boas-vindas
2. **SERVICE_SELECTION** - Seleção do serviço (Corte Masculino, Barba, etc.)
3. **DATE_SELECTION** - Seleção da data
4. **BARBER_SELECTION** - Seleção do barbeiro
5. **TIME_SELECTION** - Seleção do horário (consultado em tempo real do Google Calendar)
6. **DETAILS** - Coleta de dados do cliente (nome, telefone, email, observações)
7. **CONFIRMATION_PREP** - Tela intermediária (não-terminal) que recebe dados do endpoint
8. **CONFIRMATION** - Tela final (terminal) com resumo do agendamento

### Ações do Flow (Data Exchange)

- `INIT` - Inicialização do Flow
- `SELECT_SERVICE` - Seleção de serviço
- `SELECT_DATE` - Seleção de data
- `SELECT_BARBER` - Seleção de barbeiro
- `SELECT_TIME` - Seleção de horário
- `SUBMIT_DETAILS` - Submissão dos dados do cliente

---

## 🔧 Funcionalidades Implementadas

### ✅ Criptografia RSA/AES
- **Status:** ✅ COMPLETO
- Descriptografia de requisições do WhatsApp (RSA OAEP SHA256 + AES-128-GCM)
- Criptografia de respostas com IV invertido
- Arquivo: `src/crypto-utils.js`

### ✅ Validação de Assinatura
- **Status:** ✅ IMPLEMENTADO
- Validação HMAC SHA256 com App Secret
- Proteção contra requisições maliciosas
- Retorna HTTP 432 se assinatura inválida

### ✅ Integração Google Calendar
- **Status:** ✅ FUNCIONANDO
- Busca horários disponíveis em tempo real
- Cria eventos automaticamente quando Flow é concluído
- Evita dupla marcação
- Arquivo: `src/calendar-service.js`

### ✅ Webhook nfm_reply
- **Status:** ✅ IMPLEMENTADO
- Detecta quando Flow é concluído (ação `complete`)
- Extrai dados do `response_json`
- Cria agendamento no Google Calendar automaticamente

---

## 🐛 Problema Atual (CRÍTICO)

### Descrição do Problema

Os **placeholders** na tela terminal `CONFIRMATION` não estão sendo preenchidos com os dados reais. Em vez de mostrar valores como "Corte Masculino" ou "R$ 45", aparecem os símbolos literais `${data.service_name}` e `${data.service_price}`.

### Tentativas de Solução

1. **Tentativa 1:** Retornar dados diretamente para tela terminal `CONFIRMATION`
   - ❌ **Resultado:** Dados não são aplicados (retorna `data: {}` vazio)

2. **Tentativa 2:** Criar tela intermediária `CONFIRMATION_PREP` (não-terminal)
   - ✅ **Implementado:** Tela recebe dados do endpoint
   - ⚠️ **Problema:** Tela intermediária aparece para o usuário (UX ruim)
   - ❌ **Resultado:** Ainda não resolve completamente o problema dos placeholders

### Comportamento Observado

- **Endpoint retorna dados corretamente:** Logs mostram que `handleSubmitDetails` retorna todos os dados formatados
- **WhatsApp Flow não aplica dados:** Quando retorna para tela terminal, `data` vem vazio `{}`
- **Webhook funciona:** Agendamento é criado no Google Calendar quando Flow é concluído

### Logs do Endpoint (Exemplo)

```json
📤 SUBMIT_DETAILS - Dados que serão retornados: {
  "selected_service": "corte_masculino",
  "selected_date": "2025-12-13",
  "selected_barber": "pedro",
  "selected_time": "16:00",
  "client_name": "Lucasbrteste03",
  "client_phone": "54992917132",
  "service_name": "Corte Masculino",
  "service_price": "R$ 45",
  "barber_name": "Pedro Santos",
  "formatted_date": "13/12/2025 (Sábado)",
  "booking_id": "AGD-888976"
}
```

Mas o WhatsApp Flow recebe:
```json
{
  "version": "3.0",
  "screen": "CONFIRMATION",
  "data": {}  // ❌ VAZIO!
}
```

---

## 📁 Estrutura de Arquivos

```
endpoint-flow/
├── src/
│   ├── index.js              # Endpoint principal, processa requisições do Flow
│   ├── calendar-service.js    # Integração com Google Calendar
│   ├── crypto-utils.js        # Criptografia RSA/AES
│   └── flow-responses.js      # Helpers para respostas do Flow
├── scripts/
│   └── send-flow.js           # Script para enviar Flow via API
├── flow-barbearia.json        # Definição do WhatsApp Flow (telas, routing, layout)
├── .env                       # Variáveis de ambiente (não commitado)
└── README.md                  # Documentação do projeto
```

---

## 🔑 Variáveis de Ambiente Necessárias

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=<token>
WHATSAPP_PHONE_NUMBER_ID=<phone_id>
WHATSAPP_FLOW_ID=888145740552051
APP_SECRET=<app_secret>

# Google Calendar
GOOGLE_CALENDAR_EMAIL=<email_do_calendario>
GOOGLE_SERVICE_ACCOUNT_KEY=<json_da_service_account>

# Criptografia
PRIVATE_KEY=<chave_privada_rsa>
PASSPHRASE=<senha_opcional>

# Servidor
PORT=3000
```

---

## 🔄 Fluxo de Dados Completo

### 1. Usuário Abre Flow
- WhatsApp envia `action: "INIT"` ou `action_type: "INIT"`
- Endpoint retorna lista de serviços
- Flow navega para `SERVICE_SELECTION`

### 2. Seleção de Serviço, Data, Barbeiro
- Cada seleção envia `data_exchange` com `action_type` específico
- Endpoint retorna dados formatados e próxima tela
- Flow navega sequencialmente: `DATE_SELECTION` → `BARBER_SELECTION` → `TIME_SELECTION`

### 3. Seleção de Horário
- Endpoint consulta Google Calendar em tempo real
- Retorna apenas horários disponíveis
- Flow navega para `DETAILS`

### 4. Coleta de Dados do Cliente
- Usuário preenche formulário na tela `DETAILS`
- Ao clicar "Revisar agendamento", envia `SUBMIT_DETAILS` com todos os dados
- **PROBLEMA AQUI:** Endpoint retorna dados, mas não são aplicados na tela terminal

### 5. Confirmação e Criação do Agendamento
- Flow deveria mostrar tela `CONFIRMATION` com dados preenchidos
- Usuário clica "Concluir" (ação `complete`)
- WhatsApp envia webhook `nfm_reply` com `response_json`
- Endpoint cria evento no Google Calendar

---

## 🎨 Estrutura do Flow JSON

### Routing Model
```json
{
  "WELCOME": ["SERVICE_SELECTION"],
  "SERVICE_SELECTION": ["DATE_SELECTION"],
  "DATE_SELECTION": ["BARBER_SELECTION"],
  "BARBER_SELECTION": ["TIME_SELECTION"],
  "TIME_SELECTION": ["DETAILS"],
  "DETAILS": ["CONFIRMATION_PREP"],
  "CONFIRMATION_PREP": ["CONFIRMATION"],
  "CONFIRMATION": []
}
```

### Tela CONFIRMATION (Terminal)
- `terminal: true`
- `success: true`
- Usa placeholders `${data.booking_id}`, `${data.service_name}`, etc.
- Botão "Concluir" com ação `complete` e payload completo

---

## 🔍 Análise do Problema

### Hipóteses

1. **WhatsApp Flow não aplica dados em telas terminais diretamente**
   - Quando endpoint retorna `screen: "CONFIRMATION"` com `data`, o WhatsApp não mescla os dados
   - Solução tentada: Tela intermediária não-terminal

2. **Dados precisam estar no contexto antes de navegar para tela terminal**
   - Tela intermediária `CONFIRMATION_PREP` recebe dados
   - Usa `navigate` com `payload` para passar dados para `CONFIRMATION`
   - Ainda não funciona completamente

3. **Limitação do WhatsApp Flow com telas terminais**
   - Pode ser necessário usar abordagem diferente
   - Talvez dados precisem vir do payload do `data_exchange` anterior

### Pesquisa Realizada

- Documentação oficial do WhatsApp Flow
- Exemplos de Flows com telas terminais
- Comunidade e fóruns sobre o problema
- **Conclusão:** Problema conhecido - dados não são aplicados quando retornando diretamente para tela terminal

---

## 📊 Status Atual das Funcionalidades

| Funcionalidade | Status | Observações |
|---------------|--------|------------|
| Criptografia RSA/AES | ✅ | Funcionando perfeitamente |
| Validação de Assinatura | ✅ | Implementado e testado |
| Integração Google Calendar | ✅ | Busca horários e cria eventos |
| Webhook nfm_reply | ✅ | Detecta conclusão e cria agendamento |
| Placeholders na tela terminal | ❌ | **PROBLEMA PRINCIPAL** |
| Mensagem "Resposta enviada" | ✅ | Aparece quando Flow é concluído |
| Criação de agendamento | ✅ | Funciona via webhook |

---

## 🎯 Objetivos Pendentes

1. **CRÍTICO:** Resolver problema dos placeholders na tela `CONFIRMATION`
   - Dados devem aparecer formatados (sem símbolos JSON)
   - Todos os campos devem ser preenchidos corretamente

2. **MELHORIA:** Remover tela intermediária `CONFIRMATION_PREP`
   - Se possível, fazer dados aparecerem diretamente na tela terminal
   - Melhorar UX (menos cliques para o usuário)

3. **TESTE:** Validar fluxo completo
   - Testar com diferentes serviços, barbeiros e horários
   - Verificar criação de eventos no Google Calendar
   - Confirmar que "Resposta enviada" aparece sempre

---

## 🔗 URLs e Recursos

- **Endpoint:** https://endpoint-flow.onrender.com/webhook/whatsapp-flow
- **WhatsApp Flow Manager:** https://business.facebook.com/wa/manage/flows/
- **Flow ID:** 888145740552051
- **Repositório:** GitHub (privado)

---

## 📝 Notas Técnicas Importantes

### Criptografia
- WhatsApp usa RSA OAEP com SHA256 para criptografar chave AES
- AES-128-GCM para criptografar dados do Flow
- IV é invertido na resposta (especificação do WhatsApp)

### Data Exchange
- Todas as ações usam `data_exchange` exceto navegação simples
- Payload contém `action_type` para identificar ação
- Resposta deve incluir `version`, `screen` (opcional) e `data`

### Telas Terminais
- Telas terminais (`terminal: true`) encerram o Flow
- Ação `complete` envia webhook `nfm_reply` com `response_json`
- Dados do `response_json` são usados para criar agendamento

### Google Calendar
- Service Account configurada com permissões necessárias
- Busca eventos em janela de tempo (9h-19h)
- Cria eventos com duração baseada no serviço selecionado
- Evita conflitos verificando horários ocupados

---

## 🚀 Próximos Passos Sugeridos

1. **Investigar mais sobre aplicação de dados em telas terminais**
   - Verificar se há propriedades específicas necessárias
   - Testar diferentes formatos de resposta do endpoint

2. **Testar abordagem alternativa**
   - Fazer tela `CONFIRMATION` não-terminal inicialmente
   - Aplicar dados e depois tornar terminal via `complete`

3. **Consultar documentação oficial atualizada**
   - WhatsApp pode ter atualizado comportamento
   - Verificar exemplos mais recentes

4. **Contatar suporte do WhatsApp Business API**
   - Se problema persistir, pode ser bug conhecido
   - Obter orientação oficial

---

## 📞 Informações de Contato/Teste

- **Número de teste:** 555492917132
- **Token atual:** (fornecido pelo usuário, expira periodicamente)
- **Phone Number ID:** 995661083621366

---

**Última atualização:** 13/12/2025  
**Versão do documento:** 1.0

