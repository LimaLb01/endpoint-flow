/**
 * Utilitários de criptografia para WhatsApp Flow
 * Baseado na documentação oficial do WhatsApp Business API
 */

const crypto = require('crypto');

/**
 * Descriptografa a requisição do WhatsApp Flow
 * @param {string} encryptedAesKey - Chave AES criptografada com RSA
 * @param {string} encryptedFlowData - Dados do Flow criptografados com AES
 * @param {string} initialVector - Vetor de inicialização (IV)
 * @param {string} privateKey - Chave privada RSA (PEM)
 * @param {string} passphrase - Senha da chave privada (se houver)
 * @returns {object} Dados descriptografados
 */
function decryptRequest(encryptedAesKey, encryptedFlowData, initialVector, privateKey, passphrase = '') {
  try {
    // Decodificar Base64
    const encryptedAesKeyBuffer = Buffer.from(encryptedAesKey, 'base64');
    const encryptedFlowDataBuffer = Buffer.from(encryptedFlowData, 'base64');
    const ivBuffer = Buffer.from(initialVector, 'base64');

    // Descriptografar a chave AES usando RSA
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        passphrase: passphrase
      },
      encryptedAesKeyBuffer
    );

    // Separar os dados criptografados e a tag de autenticação
    // A tag tem 16 bytes (128 bits) no final
    const tagLength = 16;
    const encryptedData = encryptedFlowDataBuffer.slice(0, -tagLength);
    const authTag = encryptedFlowDataBuffer.slice(-tagLength);

    // Descriptografar os dados usando AES-GCM
    const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, ivBuffer);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, null, 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);

  } catch (error) {
    console.error('❌ Erro ao descriptografar:', error.message);
    throw new Error('Failed to decrypt request');
  }
}

/**
 * Criptografa a resposta para o WhatsApp Flow
 * @param {object} response - Resposta a ser criptografada
 * @param {string} encryptedAesKey - Chave AES original (para derivar a mesma chave)
 * @param {string} privateKey - Chave privada RSA
 * @param {string} passphrase - Senha da chave privada
 * @returns {string} Resposta criptografada em Base64
 */
function encryptResponse(response, encryptedAesKey, privateKey, passphrase = '') {
  try {
    // Descriptografar a chave AES original
    const encryptedAesKeyBuffer = Buffer.from(encryptedAesKey, 'base64');
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        passphrase: passphrase
      },
      encryptedAesKeyBuffer
    );

    // Gerar um novo IV aleatório
    const iv = crypto.randomBytes(12);

    // Criptografar a resposta usando AES-GCM
    const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
    
    const responseString = JSON.stringify(response);
    let encrypted = cipher.update(responseString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Obter a tag de autenticação
    const authTag = cipher.getAuthTag();

    // Combinar dados criptografados + tag
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);

    // Retornar resposta no formato esperado pelo WhatsApp
    return {
      encrypted_flow_data: encryptedWithTag.toString('base64'),
      initial_vector: iv.toString('base64')
    };

  } catch (error) {
    console.error('❌ Erro ao criptografar resposta:', error.message);
    throw new Error('Failed to encrypt response');
  }
}

/**
 * Valida a assinatura da requisição (opcional, mas recomendado)
 * @param {object} body - Corpo da requisição
 * @param {string} signature - Assinatura do header x-hub-signature-256
 * @returns {boolean} True se a assinatura é válida
 */
function isRequestSignatureValid(body, signature) {
  if (!process.env.APP_SECRET) {
    console.log('⚠️ APP_SECRET não configurado, pulando validação de assinatura');
    return true;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.APP_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );

  } catch (error) {
    console.error('❌ Erro ao validar assinatura:', error.message);
    return false;
  }
}

/**
 * Gera um par de chaves RSA para uso com WhatsApp Flow
 * @param {string} passphrase - Senha para proteger a chave privada
 * @returns {object} { publicKey, privateKey }
 */
function generateKeyPair(passphrase = '') {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: passphrase ? 'aes-256-cbc' : undefined,
      passphrase: passphrase || undefined
    }
  });

  return { publicKey, privateKey };
}

module.exports = {
  decryptRequest,
  encryptResponse,
  isRequestSignatureValid,
  generateKeyPair
};

