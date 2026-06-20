const SALT_KEY = 'snipnote_crypto_salt';
const IV_LENGTH = 12;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getOrCreateSalt(): Promise<Uint8Array> {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

export async function encryptText(plain: string, password: string): Promise<string> {
  if (!plain) return plain;
  const salt = await getOrCreateSalt();
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return `enc:${btoa(String.fromCharCode(...combined))}`;
}

export async function decryptText(value: string, password: string): Promise<string> {
  if (!value.startsWith('enc:')) return value;
  const salt = await getOrCreateSalt();
  const key = await deriveKey(password, salt);
  const combined = Uint8Array.from(atob(value.slice(4)), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(dec);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}

export async function encryptNotes(notes: { note: string }[], password: string): Promise<void> {
  for (const n of notes) {
    if (n.note && !isEncrypted(n.note)) {
      n.note = await encryptText(n.note, password);
    }
  }
}

export async function decryptNotes(notes: { note: string }[], password: string): Promise<void> {
  for (const n of notes) {
    if (n.note && isEncrypted(n.note)) {
      try {
        n.note = await decryptText(n.note, password);
      } catch {
        n.note = '[Encrypted — wrong password]';
      }
    }
  }
}
