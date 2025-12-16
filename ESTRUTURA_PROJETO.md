# 📁 Estrutura do Projeto

## 📂 Organização de Pastas

```
endpoint-flow/
├── src/                          # Código fonte principal
│   ├── config/                  # Configurações
│   │   ├── constants.js         # Constantes do sistema
│   │   └── services.js          # Configuração de serviços
│   ├── handlers/                # Handlers do Flow
│   │   ├── init-handler.js      # Inicialização
│   │   ├── service-handler.js   # Seleção de serviço
│   │   ├── date-handler.js      # Seleção de data
│   │   ├── barber-handler.js    # Seleção de barbeiro
│   │   ├── time-handler.js      # Seleção de horário
│   │   ├── details-handler.js   # Dados pessoais
│   │   ├── booking-handler.js   # Confirmação
│   │   └── flow-router.js      # Roteador principal
│   ├── middleware/               # Middlewares Express
│   │   ├── encryption-middleware.js    # Descriptografia
│   │   └── signature-middleware.js     # Validação de assinatura
│   ├── routes/                   # Rotas Express
│   │   └── webhook-routes.js    # Rotas do webhook
│   ├── services/                 # Serviços externos
│   │   ├── calendar-service.js   # Google Calendar
│   │   └── whatsapp-service.js  # WhatsApp API
│   ├── storage/                  # Armazenamento
│   │   └── booking-storage.js   # Storage de agendamentos
│   ├── utils/                    # Utilitários
│   │   ├── crypto-utils.js      # Criptografia
│   │   ├── date-formatter.js    # Formatação de datas
│   │   ├── placeholder-cleaner.js # Limpeza de placeholders
│   │   ├── booking-id-generator.js # Geração de IDs
│   │   └── flow-responses.js    # Helpers de resposta
│   └── index.js                  # Arquivo principal
│
├── scripts/                      # Scripts utilitários
│   ├── generate-keys.js         # Gerar chaves RSA
│   ├── setup-env.js             # Setup de ambiente
│   └── send-flow.js             # Enviar flow manualmente
│
├── docs/                         # Documentação
│   ├── GUIA_*.md                # Guias diversos
│   ├── CONFIGURACAO_*.md        # Configurações
│   └── ...
│
├── examples/                     # Exemplos e templates
│   ├── templateexemple.json     # Template exemplo
│   └── exemplosummary.json      # Exemplo summary
│
├── temp/                         # Arquivos temporários
│   ├── body.json
│   ├── tmp_body.json
│   └── send_flow.json
│
├── flow-barbearia.json          # Flow JSON principal
├── package.json                 # Dependências
├── railway.json                 # Config Railway
├── README.md                    # Documentação principal
└── PRD_PROJETO_ENDPOINT_FLOW.md # PRD do projeto
```

---

## 🔄 Fluxo de Dados

### 1. Requisição do WhatsApp
```
WhatsApp → POST /webhook/whatsapp-flow
         → signatureValidationMiddleware
         → encryptionMiddleware
         → webhook-routes.js
         → flow-router.js
         → handler específico
```

### 2. Handlers
```
init-handler.js       → Lista de serviços
service-handler.js    → Datas disponíveis
date-handler.js       → Lista de barbeiros
barber-handler.js     → Horários disponíveis (Google Calendar)
time-handler.js       → Tela de detalhes
details-handler.js    → Tela de confirmação + armazenamento
booking-handler.js    → Cria agendamento no Google Calendar
```

### 3. Serviços
```
calendar-service.js   → Integração Google Calendar
whatsapp-service.js   → Envio automático de Flow
```

### 4. Storage
```
booking-storage.js    → Armazenamento temporário de agendamentos
                     → Usado para recuperar dados no webhook nfm_reply
```

---

## 📝 Convenções de Código

### Nomenclatura
- **Arquivos:** `kebab-case.js` (ex: `booking-handler.js`)
- **Funções:** `camelCase` (ex: `handleSelectService`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `WHATSAPP_CONFIG`)
- **Classes:** `PascalCase` (ex: `BookingStorage`)

### Estrutura de Handlers
```javascript
/**
 * Descrição do handler
 */

// Imports
const { ... } = require('...');

// Função principal
async function handleXxx(payload) {
  // 1. Validação
  // 2. Processamento
  // 3. Resposta
  return {
    version: '3.0',
    screen: 'NEXT_SCREEN',
    data: { ... }
  };
}

module.exports = { handleXxx };
```

### Estrutura de Services
```javascript
/**
 * Descrição do serviço
 */

// Imports
const { ... } = require('...');

// Funções públicas
async function serviceFunction(params) {
  // Implementação
}

module.exports = { serviceFunction };
```

---

## 🔧 Configurações

### Variáveis de Ambiente
Todas as variáveis estão documentadas em:
- `docs/GUIA_VARIAVEIS_AMBIENTE_RENDER.md`
- `env.example`

### Constantes
Todas as constantes estão em:
- `src/config/constants.js`
- `src/config/services.js`

---

## 📚 Documentação

### Guias Principais
- `README.md` - Documentação principal
- `PRD_PROJETO_ENDPOINT_FLOW.md` - PRD completo
- `docs/GUIA_MIGRACAO_RAILWAY.md` - Migração para Railway
- `docs/CONFIGURACAO_WEBHOOK_META.md` - Configuração webhook

### Outros Documentos
Todos os outros documentos estão em `docs/`

---

## 🧹 Limpeza

### Arquivos Temporários
- `temp/` - Arquivos temporários de teste
- `examples/` - Exemplos e templates

### Arquivos a Ignorar
Ver `.gitignore` para lista completa

---

**Última atualização:** 16/12/2025

