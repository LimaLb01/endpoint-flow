/**
 * Script para gerar par de chaves RSA para WhatsApp Flow
 * Execute com: npm run generate-keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Gerando par de chaves RSA para WhatsApp Flow...\n');

// Gerar par de chaves
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Criar pasta keys se não existir
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Salvar chave privada
const privateKeyPath = path.join(keysDir, 'private_key.pem');
fs.writeFileSync(privateKeyPath, privateKey);
console.log(`✅ Chave privada salva em: ${privateKeyPath}`);

// Salvar chave pública
const publicKeyPath = path.join(keysDir, 'public_key.pem');
fs.writeFileSync(publicKeyPath, publicKey);
console.log(`✅ Chave pública salva em: ${publicKeyPath}`);

// Mostrar chave pública para copiar
console.log('\n' + '='.repeat(60));
console.log('📋 CHAVE PÚBLICA (copie para o WhatsApp Manager):');
console.log('='.repeat(60));
console.log(publicKey);

// Mostrar chave privada para o .env
console.log('\n' + '='.repeat(60));
console.log('🔒 CHAVE PRIVADA (copie para o arquivo .env):');
console.log('='.repeat(60));
console.log('\nPRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');

console.log('\n' + '='.repeat(60));
console.log('📌 PRÓXIMOS PASSOS:');
console.log('='.repeat(60));
console.log(`
1. Copie a CHAVE PÚBLICA acima
2. Vá no WhatsApp Manager > Account Tools > Flows
3. Selecione seu Flow
4. Clique em "Assinar chave pública"
5. Cole a chave pública e salve

6. Copie a CHAVE PRIVADA acima
7. Cole no arquivo .env (substitua a linha PRIVATE_KEY)

8. Configure a URL do Endpoint no WhatsApp Manager:
   - Clique em "Definir URI do ponto de extremidade"
   - Cole a URL do seu servidor (ex: https://seu-app.onrender.com/webhook/whatsapp-flow)
`);

console.log('\n✅ Chaves geradas com sucesso!\n');

