/**
 * Script para converter imagem de URL para Base64
 * Uso: node scripts/convert-image-to-base64.js <URL>
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const imageUrl = process.argv[2];

if (!imageUrl) {
  console.error('❌ Erro: URL da imagem não fornecida');
  console.log('Uso: node scripts/convert-image-to-base64.js <URL>');
  process.exit(1);
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Erro ao baixar imagem: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

async function convertToBase64() {
  try {
    console.log('📥 Baixando imagem...');
    console.log(`   URL: ${imageUrl}`);
    
    const imageBuffer = await downloadImage(imageUrl);
    
    // Detectar tipo MIME
    const contentType = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 ? 'image/jpeg' :
                        imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 ? 'image/png' :
                        'image/png'; // default
    
    console.log(`   Tipo detectado: ${contentType}`);
    console.log(`   Tamanho: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    
    // Converter para Base64
    const base64 = imageBuffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    
    console.log('\n✅ Conversão concluída!');
    console.log('\n📋 Base64 (primeiros 100 caracteres):');
    console.log(dataUri.substring(0, 100) + '...');
    
    // Salvar em arquivo
    const outputFile = path.join(__dirname, '..', 'temp', 'image-base64.txt');
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, dataUri, 'utf8');
    
    console.log(`\n💾 Base64 completo salvo em: ${outputFile}`);
    console.log(`\n📏 Tamanho do Base64: ${(dataUri.length / 1024).toFixed(2)} KB`);
    
    // Verificar limite do WhatsApp (300KB para imagens)
    if (imageBuffer.length > 300 * 1024) {
      console.warn('\n⚠️  AVISO: Imagem maior que 300KB! Pode não funcionar no WhatsApp Flow.');
      console.warn('   Recomendado: Redimensionar ou comprimir a imagem.');
    } else {
      console.log('\n✅ Tamanho dentro do limite recomendado (300KB)');
    }
    
    console.log('\n📝 Para usar no Flow JSON, substitua o campo "src" por:');
    console.log(`   "src": "${dataUri.substring(0, 80)}..."`);
    console.log('\n💡 Dica: Para imagens grandes, considere usar binding dinâmico:');
    console.log('   "src": "${data.logo_image}"');
    console.log('   E fornecer a imagem via API no endpoint de data_exchange.');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

convertToBase64();

