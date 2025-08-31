// Small client-side email "obfuscation" using Web Crypto AES-GCM.
// NOTE: This is intentionally simple and meant for URL obfuscation only.
// It's not a secure server-side secret; both encrypt/decrypt run in the browser.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PASSPHRASE = 'uloons-client-obfuscation-v1';
const SALT = 'uloons-client-salt-v1';
const IV_LENGTH = 12; // AES-GCM recommended IV size

async function getKey() {
  const passKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toBase64(bytes: Uint8Array) {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function fromBase64(b64: string) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function encryptEmail(email: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getKey();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(email)
  );

  const cipherBytes = new Uint8Array(cipher);
  // prepend iv to ciphertext so decryptor can recover it
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);
  return toBase64(combined);
}

export async function decryptEmail(token: string): Promise<string | null> {
  try {
    const combined = fromBase64(token);
    if (combined.length <= IV_LENGTH) return null;
    const iv = combined.slice(0, IV_LENGTH);
    const cipherBytes = combined.slice(IV_LENGTH);
    const key = await getKey();
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    return decoder.decode(new Uint8Array(plain));
  } catch {
    // any failure returns null to indicate invalid token
    return null;
  }
}
