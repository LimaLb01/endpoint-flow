/**
 * Utilitários de criptografia para WhatsApp Flow
 * Baseado EXATAMENTE na documentação oficial do WhatsApp
 * https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */

const crypto = require('crypto');

/**
 * Descriptografa a requisição do WhatsApp Flow
 * Código baseado no exemplo oficial NodeJS da documentação
 */
function decryptRequest(body, privatePem, passphrase = '') {
  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  // Normalizar a chave privada (converter \n literal para quebras de linha reais)
  let normalizedKey = privatePem;
  
  // Remover aspas extras se existirem
  if (normalizedKey.startsWith('"')) {
    normalizedKey = normalizedKey.slice(1);
  }
  if (normalizedKey.endsWith('"')) {
    normalizedKey = normalizedKey.slice(0, -1);
  }
  
  // Converter \n literal para quebras de linha reais
  normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  
  console.log('🔑 Primeiros 60 chars da chave:', JSON.stringify(normalizedKey.substring(0, 60)));
  console.log('🔑 Chave começa com BEGIN:', normalizedKey.includes('-----BEGIN'));

  // Decrypt the AES key created by the client
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: crypto.createPrivateKey({
        key: normalizedKey,
        format: 'pem',
        passphrase: passphrase || undefined
      }),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encrypted_aes_key, "base64"),
  );

  // Decrypt the Flow data
  const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
  const initialVectorBuffer = Buffer.from(initial_vector, "base64");

  const TAG_LENGTH = 16;
  const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    "aes-128-gcm",
    decryptedAesKey,
    initialVectorBuffer,
  );
  decipher.setAuthTag(encrypted_flow_data_tag);

  const decryptedJSONString = Buffer.concat([
    decipher.update(encrypted_flow_data_body),
    decipher.final(),
  ]).toString("utf-8");

  return {
    decryptedBody: JSON.parse(decryptedJSONString),
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer,
  };
}

/**
 * Criptografa a resposta para o WhatsApp Flow
 * Código baseado no exemplo oficial NodeJS da documentação
 */
function encryptResponse(response, aesKeyBuffer, initialVectorBuffer) {
  // Flip the initialization vector
  const flipped_iv = [];
  for (const pair of initialVectorBuffer.entries()) {
    flipped_iv.push(~pair[1]);
  }

  // Encrypt the response data
  const cipher = crypto.createCipheriv(
    "aes-128-gcm",
    aesKeyBuffer,
    Buffer.from(flipped_iv),
  );

  return Buffer.concat([
    cipher.update(JSON.stringify(response), "utf-8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}

/**
 * Valida a assinatura da requisição
 */
function isRequestSignatureValid(rawBody, signature, appSecret) {
  if (!appSecret) {
    return true; // Skip validation if no app secret
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
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

module.exports = {
  decryptRequest,
  encryptResponse,
  isRequestSignatureValid
};
