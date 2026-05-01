import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Get or derive a 32-byte key from the environment.
 * It uses ENCRYPTION_KEY or falls back to JWT_SECRET.
 */
function getEncryptionKey(): Uint8Array {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be defined for token encryption');
  }
  // If the secret is exactly 32 bytes, use it directly (hex or raw)
  // Otherwise, hash it to ensure it's exactly 32 bytes for aes-256
  return Uint8Array.from(crypto.createHash('sha256').update(String(secret)).digest());
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined;
}

/**
 * Encrypt a string (e.g. an OAuth token) using AES-256-GCM.
 * Format: base64(iv:salt:tag:encrypted)
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey() as crypto.CipherKey;
  const iv = Uint8Array.from(crypto.randomBytes(IV_LENGTH));
  const salt = Uint8Array.from(crypto.randomBytes(SALT_LENGTH)); // optional, just to add entropy
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv as crypto.BinaryLike);
  const encrypted = concatBytes(
    Uint8Array.from(cipher.update(token, 'utf8')),
    Uint8Array.from(cipher.final()),
  );
  const tag = Uint8Array.from(cipher.getAuthTag());

  // Combine iv, salt, tag, encrypted data
  const combined = concatBytes(iv, salt, tag, encrypted);
  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt a previously encrypted token string.
 */
export function decryptToken(encryptedTokenBase64: string): string {
  const key = getEncryptionKey() as crypto.CipherKey;
  const combined = Uint8Array.from(Buffer.from(encryptedTokenBase64, 'base64'));

  const iv = combined.subarray(0, IV_LENGTH);
  // Reserved for forward compatibility with future key derivation.
  combined.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
  const tag = combined.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv as crypto.BinaryLike,
  );
  decipher.setAuthTag(Uint8Array.from(tag));

  const decrypted = concatBytes(
    Uint8Array.from(decipher.update(encrypted)),
    Uint8Array.from(decipher.final()),
  );
  return Buffer.from(decrypted).toString('utf8');
}
