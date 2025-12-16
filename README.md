# 📱 WhatsApp Flow Endpoint - Barbearia

Servidor Node.js para integrar WhatsApp Flow com Google Calendar para agendamentos de barbearia.

## ✨ Funcionalidades

- 🔐 **Criptografia RSA** - Descriptografa e criptografa mensagens do WhatsApp
- 📅 **Google Calendar** - Consulta horários disponíveis em tempo real
- 🔄 **Dados Dinâmicos** - Horários atualizados automaticamente
- 💇 **Agendamentos** - Cria eventos no calendário do barbeiro
- 🤖 **Envio Automático de Flow** - Envia o flow automaticamente quando recebe mensagem de texto

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Google Cloud Platform
- WhatsApp Business API

## 🚀 Instalação

### 1. Clone e instale dependências

```bash
git clone <seu-repositorio>
cd endpoint-flow
npm install
```

### 2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas credenciais
```

### 3. Gere as chaves RSA

```bash
npm run generate-keys
```

Isso irá:
- Criar a pasta `keys/` com as chaves
- Mostrar a chave pública para copiar para o WhatsApp
- Mostrar a chave privada para copiar para o `.env`

### 4. Configure o Google Calendar

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a **Google Calendar API**
4. Crie uma **Service Account**
5. Baixe o JSON da credencial
6. Copie `client_email` e `private_key` para o `.env`
7. **Importante:** Compartilhe os calendários dos barbeiros com o email da Service Account

### 5. Configure o WhatsApp Flow

1. Acesse [WhatsApp Manager](https://business.facebook.com/wa/manage/)
2. Vá em **Account Tools** > **Flows**
3. Crie um novo Flow ou selecione existente
4. Cole o conteúdo do arquivo `flow.json`
5. Clique em **"Assinar chave pública"** e cole a chave gerada
6. Clique em **"Definir URI do ponto de extremidade"** e cole a URL do seu servidor

### 6. Configure o Envio Automático de Flow (Opcional)

Para enviar o flow automaticamente quando receber mensagens de texto, adicione ao `.env`:

```bash
# WhatsApp API (para envio automático de flow)
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_FLOW_ID=888145740552051

# Número específico para enviar flow (deixe vazio para enviar para qualquer número)
AUTO_SEND_FLOW_NUMBER=555492917132
```

**Como funciona:**
- Quando alguém enviar uma mensagem de texto para o número configurado, o flow será enviado automaticamente
- Se `AUTO_SEND_FLOW_NUMBER` estiver vazio, o flow será enviado para qualquer número que enviar mensagem
- Se `AUTO_SEND_FLOW_NUMBER` estiver configurado, o flow será enviado apenas para esse número específico

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

## 🌐 Deploy

### Render (Recomendado - Gratuito)

1. Crie conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um **Web Service**
4. Configure as variáveis de ambiente
5. Deploy!

URL gerada: `https://seu-app.onrender.com/webhook/whatsapp-flow`

#### 🤖 MCP Render (Automação)

Este projeto suporta o **MCP Render** para automação de tarefas:

- ✅ Deploy automatizado
- ✅ Gerenciamento de variáveis de ambiente
- ✅ Monitoramento de logs em tempo real
- ✅ Verificação de status e saúde do serviço

**Configuração:** Veja `MCP_RENDER_CONFIG.md` para instruções detalhadas.

**Exemplos de uso:** Veja `scripts/render-mcp-examples.js` para casos de uso práticos.

### Vercel

```bash
npm install -g vercel
vercel
```

### Railway

1. Crie conta em [railway.app](https://railway.app)
2. Conecte seu repositório
3. Configure variáveis de ambiente
4. Deploy automático!

## 📁 Estrutura do Projeto

```
endpoint-flow/
├── src/
│   ├── config/            # Configurações
│   │   ├── constants.js   # Constantes do sistema
│   │   └── services.js    # Configuração de serviços
│   ├── handlers/          # Handlers do Flow
│   │   ├── init-handler.js
│   │   ├── service-handler.js
│   │   ├── date-handler.js
│   │   ├── barber-handler.js
│   │   ├── time-handler.js
│   │   ├── details-handler.js
│   │   ├── booking-handler.js
│   │   └── flow-router.js
│   ├── middleware/        # Middlewares Express
│   │   ├── encryption-middleware.js
│   │   └── signature-middleware.js
│   ├── routes/            # Rotas Express
│   │   └── webhook-routes.js
│   ├── services/          # Serviços externos
│   │   ├── calendar-service.js
│   │   └── whatsapp-service.js
│   ├── storage/           # Armazenamento
│   │   └── booking-storage.js
│   ├── utils/             # Utilitários
│   │   ├── crypto-utils.js
│   │   ├── date-formatter.js
│   │   ├── placeholder-cleaner.js
│   │   └── booking-id-generator.js
│   └── index.js           # Servidor principal
├── scripts/               # Scripts utilitários
│   ├── generate-keys.js
│   └── send-flow.js
├── docs/                  # Documentação
├── examples/              # Exemplos e templates
├── flow-barbearia.json    # Flow JSON principal
├── package.json
├── env.example
└── README.md
```

**📖 Para mais detalhes sobre a estrutura, veja:** `ESTRUTURA_PROJETO.md`

## 🔧 Configuração dos Barbeiros

Edite o arquivo `src/services/calendar-service.js` para configurar:

```javascript
// Lista de barbeiros
const barbers = [
  { id: 'joao', title: 'João Silva', description: 'Especialista em cortes modernos' },
  { id: 'pedro', title: 'Pedro Santos', description: 'Expert em barbas' },
  { id: 'carlos', title: 'Carlos Oliveira', description: 'Cortes clássicos' }
];

// Calendários (configure no .env)
CALENDAR_JOAO=primary
CALENDAR_PEDRO=calendar-id-do-pedro@group.calendar.google.com
CALENDAR_CARLOS=calendar-id-do-carlos@group.calendar.google.com
```

## 📅 Como obter o ID do calendário

1. Abra o Google Calendar
2. Clique nos 3 pontinhos ao lado do calendário
3. Clique em **Configurações**
4. Role até **ID do calendário**
5. Copie o ID (formato: xxx@group.calendar.google.com)

## 🔐 Compartilhar calendário com Service Account

Para que o servidor acesse os calendários dos barbeiros:

1. Abra o Google Calendar
2. Clique nos 3 pontinhos ao lado do calendário do barbeiro
3. Clique em **Configurações**
4. Role até **Compartilhar com pessoas específicas**
5. Adicione o email da Service Account
6. Defina permissão: **Fazer alterações nos eventos**

## 📱 Testando o Flow

### Teste local

```bash
# Inicie o servidor
npm run dev

# Em outro terminal, teste o endpoint
curl -X POST http://localhost:3000/webhook/whatsapp-flow \
  -H "Content-Type: application/json" \
  -d '{"action": "INIT"}'
```

### Teste no WhatsApp

1. Configure o Endpoint no WhatsApp Manager
2. Use o **Builder** do WhatsApp para testar
3. Ou envie uma mensagem de Flow para um número de teste

## ⚠️ Troubleshooting

### Erro: "Chave privada não configurada"
- Verifique se `PRIVATE_KEY` está no `.env`
- Certifique-se de que as quebras de linha estão corretas (`\n`)

### Erro: "Google Calendar não configurado"
- Verifique `GOOGLE_CLIENT_EMAIL` e `GOOGLE_PRIVATE_KEY`
- Confirme que a Service Account tem acesso aos calendários

### Erro: "Assinatura inválida"
- Configure `APP_SECRET` com o App Secret do Meta

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os logs do servidor
2. Teste o endpoint localmente
3. Confira a documentação do WhatsApp Flows

## 📝 Licença

MIT

