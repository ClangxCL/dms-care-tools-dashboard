import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken, decodeToken } from '../src/crypto/jwt.js';

describe('JWT Generation & Verification', () => {
  const secret = 'super-secret-test-key-32-chars-minimum!';

  it('should generate and verify a valid JWT token', () => {
    const token = generateToken(
      { sub: 'user-001', email: 'alice@example.com' },
      secret,
      { expiresIn: 300 }
    );

    assert.ok(token);
    assert.equal(token.split('.').length, 3);

    const payload = verifyToken(token, secret);
    assert.equal(payload.sub, 'user-001');
    assert.equal(payload.email, 'alice@example.com');
    assert.ok(payload.jti);
  });

  it('should fail verification if signature is tampered with', () => {
    const token = generateToken(
      { sub: 'user-001', email: 'alice@example.com' },
      secret
    );

    const parts = token.split('.');
    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'admin', email: 'alice@example.com' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    assert.throws(() => verifyToken(tamperedToken, secret), {
      message: 'Invalid token signature'
    });
  });

  it('should fail verification if verified with wrong secret', () => {
    const token = generateToken(
      { sub: 'user-001', email: 'alice@example.com' },
      secret
    );

    assert.throws(() => verifyToken(token, 'different-wrong-secret'), {
      message: 'Invalid token signature'
    });
  });

  it('should fail verification if token is expired', () => {
    const token = generateToken(
      { sub: 'user-001', email: 'alice@example.com' },
      secret,
      { expiresIn: -10 } // Expired 10 seconds ago
    );

    assert.throws(() => verifyToken(token, secret), {
      message: 'Token has expired'
    });
  });

  it('should allow decoding without verification', () => {
    const token = generateToken(
      { sub: 'user-002', email: 'bob@example.com' },
      secret
    );

    const decoded = decodeToken(token);
    assert.equal(decoded.sub, 'user-002');
    assert.equal(decoded.email, 'bob@example.com');
  });
});
