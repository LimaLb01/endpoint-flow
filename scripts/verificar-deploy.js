/**
 * Script para verificar o status do deploy
 * Testa se o endpoint está respondendo corretamente
 */

const https = require('https');
const http = require('http');

const ENDPOINT_URL = process.env.ENDPOINT_URL || 'https://whatsapp-flow-endpoint-production.up.railway.app';

console.log('🔍 Verificando status do deploy...\n');
console.log(`📍 Endpoint: ${ENDPOINT_URL}\n`);

function verificarHealthCheck() {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Health Check: OK');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Resposta: ${data.substring(0, 100)}...`);
          resolve(true);
        } else {
          console.log(`⚠️  Health Check: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Erro ao conectar: ${error.message}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('❌ Timeout ao conectar');
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  try {
    await verificarHealthCheck();
    console.log('\n✅ Deploy parece estar funcionando!');
    process.exit(0);
  } catch (error) {
    console.log('\n❌ Deploy pode estar com problemas');
    console.log(`   Erro: ${error.message}`);
    process.exit(1);
  }
}

main();

