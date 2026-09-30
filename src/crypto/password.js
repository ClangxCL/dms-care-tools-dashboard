import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const DEFAULT_OPTIONS = {
  cost: 16384, // N: CPU/memory cost parameter
  blockSize: 8, // r: block size parameter
  parallelization: 1, // p: parallelization parameter
  keyLength: 64,
  saltLength: 16
};

/**
 * Hashes a plaintext password securely using scrypt with a unique random salt.
 * Output format: $scrypt$N=16384,r=8,p=1$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(password, customOptions = {}) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }

  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const salt = crypto.randomBytes(options.saltLength);
  const derivedKey = await scryptAsync(password, salt, options.keyLength, {
    N: options.cost,
    r: options.blockSize,
    p: options.parallelization,
    maxmem: 32 * 1024 * 1024
  });

  const saltHex = salt.toString('hex');
  const keyHex = derivedKey.toString('hex');

  return `$scrypt$N=${options.cost},r=${options.blockSize},p=${options.parallelization}$${saltHex}$${keyHex}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split('$');
  // Expected parts: ['', 'scrypt', 'N=16384,r=8,p=1', saltHex, keyHex]
  if (parts.length !== 5 || parts[1] !== 'scrypt') {
    return false;
  }

  const paramsStr = parts[2];
  const saltHex = parts[3];
  const keyHex = parts[4];

  const params = {};
  for (const item of paramsStr.split(',')) {
    const [k, v] = item.split('=');
    params[k] = parseInt(v, 10);
  }

  const salt = Buffer.from(saltHex, 'hex');
  const originalKey = Buffer.from(keyHex, 'hex');

  try {
    const testDerivedKey = await scryptAsync(password, salt, originalKey.length, {
      N: params.N || DEFAULT_OPTIONS.cost,
      r: params.r || DEFAULT_OPTIONS.blockSize,
      p: params.p || DEFAULT_OPTIONS.parallelization,
      maxmem: 32 * 1024 * 1024
    });

    if (testDerivedKey.length !== originalKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(testDerivedKey, originalKey);
  } catch {
    return false;
  }
}
