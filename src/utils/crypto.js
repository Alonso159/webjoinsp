import CryptoJS from 'crypto-js';

// La key proporcionada (asegurarse que sea de 32 bytes)
const ENCRYPTION_KEY = 'super_secret_aes_key_of_32_bytes';
const KEY_UTF8 = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);

export const encryptAes = (plainText) => {
  // Generar un IV aleatorio de 16 bytes
  const iv = CryptoJS.lib.WordArray.random(16);
  
  // Encriptar (AES CBC PKCS7)
  const encrypted = CryptoJS.AES.encrypt(plainText, KEY_UTF8, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // Concatenar el IV (16 bytes) y el texto cifrado
  // El backend espera: [IV (16 bytes)] + [Texto Cifrado] en un solo Base64
  const ivAndCiphertext = iv.clone().concat(encrypted.ciphertext);
  
  // Retornar en Base64
  return CryptoJS.enc.Base64.stringify(ivAndCiphertext);
};

// Por si es necesario desencriptar desde el front:
export const decryptAes = (cipherTextBase64) => {
  const fullCipher = CryptoJS.enc.Base64.parse(cipherTextBase64);
  
  // Extraer el IV (primeros 16 bytes/palabras)
  // En CryptoJS, words son de 32 bits (4 bytes). 16 bytes = 4 words.
  const iv = CryptoJS.lib.WordArray.create(fullCipher.words.slice(0, 4));
  const ciphertext = CryptoJS.lib.WordArray.create(fullCipher.words.slice(4), fullCipher.sigBytes - 16);
  
  const encryptedParams = CryptoJS.lib.CipherParams.create({ ciphertext });

  const decrypted = CryptoJS.AES.decrypt(encryptedParams, KEY_UTF8, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};
