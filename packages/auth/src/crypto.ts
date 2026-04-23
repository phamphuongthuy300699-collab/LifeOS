import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Get or derive a 32-byte key from the environment.
 * It uses ENCRYPTION_KEY or falls back to JWT_SECRET.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be defined for token encryption');
  }
  // If the secret is exactly 32 bytes, use it directly (hex or raw)
  // Otherwise, hash it to ensure it's exactly 32 bytes for aes-256
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypt a string (e.g. an OAuth token) using AES-256-GCM.
 * Format: base64(iv:salt:tag:encrypted)
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey() as unknown as crypto.CipherKey;
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH); // optional, just to add entropy
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv as unknown as crypto.BinaryLike);
  const encrypted = Buffer.concat([
    Buffer.from(cipher.update(token, 'utf8') as unknown as Uint8Array),
    Buffer.from(cipher.final() as unknown as Uint8Array),
  ]);
  const tag = Buffer.from(cipher.getAuthTag() as unknown as Uint8Array);

  // Combine iv, salt, tag, encrypted data
  const combined = Buffer.concat([iv, salt, tag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt a previously encrypted token string.
 */
export function decryptToken(encryptedTokenBase64: string): string {
  const key = getEncryptionKey() as unknown as crypto.CipherKey;
  const combined = Buffer.from(encryptedTokenBase64, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  // Reserved for forward compatibility with future key derivation.
  combined.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
  const tag = combined.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv as unknown as crypto.BinaryLike,
  );
  decipher.setAuthTag(tag as unknown as Buffer);

  const decrypted = Buffer.concat([
    Buffer.from(decipher.update(encrypted as unknown as Uint8Array) as unknown as Uint8Array),
    Buffer.from(decipher.final() as unknown as Uint8Array),
  ]);
  return decrypted.toString('utf8');
}
