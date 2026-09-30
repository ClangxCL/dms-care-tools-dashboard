import crypto from 'node:crypto';
import { TokenPayload } from '../models/user.js';

function base64urlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(typeof input === 'string' ? input : JSON.stringify(input));
  return buf.toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * Creates an HMAC-SHA256 signed JWT string
 */
export function generateToken(payload, secret, options = {}) {
  if (!secret) {
    throw new Error('JWT secret is required');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn ?? 15 * 60; // default 15 minutes (in seconds)

  const tokenPayload = {
    sub: payload.sub || payload.userId,
    email: payload.email,
    jti: payload.jti || crypto.randomUUID(),
    iat: payload.iat || now,
    exp: payload.exp || now + expiresIn,
    ...(options.customClaims || {})
  };

  const encodedHeader = base64urlEncode(header);
  const encodedPayload = base64urlEncode(tokenPayload);
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Verifies the signature and expiration of a JWT token.
 * Returns the decoded TokenPayload if valid, or throws an error.
 */
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }
  if (!secret) {
    throw new Error('JWT secret is required');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token: token must contain 3 parts');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedSigBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
    throw new Error('Invalid token signature');
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    throw new Error('Invalid token payload encoding');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) {
    throw new Error('Token has expired');
  }

  return new TokenPayload(payload);
}

/**
 * Decodes a token without verifying signature
 */
export function decodeToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token');
  }
  return JSON.parse(base64urlDecode(parts[1]));
}
