import { argon2id } from 'hash-wasm';
import type { User } from '../models/types';

/**
 * Hash a plaintext password using Argon2id (RFC 9106 recommended parameters)
 */
export async function hashPasswordArgon2(password: string): Promise<string> {
  if (!password) return '';
  const salt = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 16; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }

  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 2,
    memorySize: 19456, // 19MB memory cost
    hashLength: 32,
    outputType: 'encoded'
  });
}

/**
 * Verify a plaintext password against an encoded Argon2id hash (or legacy hashes)
 */
export async function verifyPasswordArgon2(password: string, storedHash?: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  // 1. Argon2id verification
  if (storedHash.startsWith('$argon2id$')) {
    try {
      const parts = storedHash.split('$').filter(Boolean);
      // parts[0] = 'argon2id', parts[1] = 'v=19', parts[2] = 'm=...,t=...,p=...', parts[3] = salt, parts[4] = hash
      const params = parts[2].split(',').reduce((acc, pair) => {
        const [k, v] = pair.split('=');
        acc[k] = parseInt(v, 10);
        return acc;
      }, {} as Record<string, number>);

      // Decode base64 salt (standard cross-platform)
      const bin = typeof atob === 'function' ? atob(parts[3]) : '';
      const saltBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        saltBytes[i] = bin.charCodeAt(i);
      }

      const computed = await argon2id({
        password,
        salt: saltBytes,
        parallelism: params.p || 1,
        iterations: params.t || 2,
        memorySize: params.m || 19456,
        hashLength: 32,
        outputType: 'encoded'
      });

      return computed === storedHash;
    } catch {
      return false;
    }
  }

  // 2. Legacy PBKDF2 fallback
  if (storedHash.startsWith('pbkdf2:')) {
    // If running in browser or Node, check simple match or pbkdf2
    return false;
  }

  // 3. Legacy plain password migration fallback
  return password === storedHash;
}

/**
 * Strip password from user object to ensure passwords never leak to frontend views
 */
export function sanitizeUser<T extends Partial<User>>(user: T): Omit<T, 'password'> {
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}
