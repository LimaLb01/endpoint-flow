/**
 * Script para criar arquivo .env automaticamente
 * Execute com: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando arquivo .env...\n');

// Ler a chave privada do arquivo
const privateKeyPath = path.join(__dirname, '..', 'keys', 'private_key.pem');
let privateKey = '';

if (fs.existsSync(privateKeyPath)) {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  // Converter quebras de linha para \n
  privateKey = privateKey.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n');
} else {
  console.log('⚠️ Arquivo de chave privada não encontrado');
  console.log('⚠️ Execute primeiro: npm run generate-keys\n');
  process.exit(1);
}

// Template do .env
const envContent = `# =================================
# Configurações do Servidor
# =================================
PORT=3000

# =================================
# Chaves de Criptografia WhatsApp
# =================================
# Chave privada RSA (gerada automaticamente)
PRIVATE_KEY="${privateKey}"

# Senha da chave privada (deixe vazio se não tiver)
PASSPHRASE=

# App Secret do Meta (opcional, para validação de assinatura)
APP_SECRET=

# =================================
# Google Calendar - Service Account
# =================================
# Crie uma Service Account em: https://console.cloud.google.com/
# 1. Crie um projeto
# 2. Ative a Google Calendar API
# 3. Crie uma Service Account
# 4. Baixe o JSON da credencial
# 5. Copie os valores abaixo

GOOGLE_CLIENT_EMAIL=sua-service-account@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nSUA_CHAVE_DO_GOOGLE_AQUI\\n-----END PRIVATE KEY-----"

# =================================
# IDs dos Calendários dos Barbeiros
# =================================
# Deixe 'primary' para usar o calendário principal da Service Account
# Ou use o ID do calendário específico (encontrado nas configurações do Google Calendar)
CALENDAR_JOAO=primary
CALENDAR_PEDRO=primary
CALENDAR_CARLOS=primary

# =================================
# WhatsApp Business API (opcional)
# =================================
# Se quiser enviar mensagens de confirmação
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
`;

// Caminho do arquivo .env
const envPath = path.join(__dirname, '..', '.env');

// Verificar se já existe
if (fs.existsSync(envPath)) {
  console.log('⚠️ Arquivo .env já existe!');
  console.log('⚠️ Deseja sobrescrever? (S/N)');
  console.log('⚠️ Se não, edite manualmente o arquivo .env');
  console.log(`⚠️ Localização: ${envPath}\n`);
} else {
  // Criar arquivo .env
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log(`📍 Localização: ${envPath}\n`);
}

console.log('📋 PRÓXIMOS PASSOS:');
console.log('='.repeat(60));
console.log(`
1. ✅ Chave privada já configurada no .env
2. 📅 Configure o Google Calendar (veja PROXIMOS_PASSOS.md)
3. 🔧 Edite o .env com as credenciais do Google quando tiver
4. 🚀 Faça o deploy do servidor

📖 Para mais detalhes, veja: PROXIMOS_PASSOS.md
`);

