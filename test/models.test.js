import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User, TokenPayload, validatePassword, validateEmail } from '../src/models/user.js';

describe('User Models & Validation', () => {
  it('should validate strong password correctly', () => {
    const res = validatePassword('ValidPass123!');
    assert.equal(res.valid, true);
  });

  it('should reject short password (< 8 chars)', () => {
    const res = validatePassword('Short1!');
    assert.equal(res.valid, false);
    assert.match(res.message, /at least 8 characters/);
  });

  it('should reject password missing uppercase', () => {
    const res = validatePassword('nouppercase123!');
    assert.equal(res.valid, false);
    assert.match(res.message, /uppercase/);
  });

  it('should reject password missing lowercase', () => {
    const res = validatePassword('NOLOWERCASE123!');
    assert.equal(res.valid, false);
    assert.match(res.message, /lowercase/);
  });

  it('should reject password missing numbers or symbols', () => {
    const res = validatePassword('NoNumbersOrSymbols');
    assert.equal(res.valid, false);
    assert.match(res.message, /number or special character/);
  });

  it('should validate email format', () => {
    assert.equal(validateEmail('test@example.com').valid, true);
    assert.equal(validateEmail('invalid-email').valid, false);
    assert.equal(validateEmail('').valid, false);
  });

  it('should instantiate User and exclude passwordHash in toJSON()', () => {
    const user = new User({
      email: 'USER@example.com',
      passwordHash: '$scrypt$hashedpassword'
    });

    assert.equal(user.email, 'user@example.com');
    assert.ok(user.id);
    assert.ok(user.createdAt);

    const json = user.toJSON();
    assert.equal(json.email, 'user@example.com');
    assert.equal(json.id, user.id);
    assert.equal(json.passwordHash, undefined);
  });

  it('should manage TokenPayload lifecycle and expiration check', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = new TokenPayload({
      sub: 'user-123',
      email: 'user@example.com',
      iat: now,
      exp: now + 300
    });

    assert.equal(token.sub, 'user-123');
    assert.ok(token.jti);
    assert.equal(token.isExpired(), false);

    const expiredToken = new TokenPayload({
      sub: 'user-123',
      email: 'user@example.com',
      iat: now - 600,
      exp: now - 300
    });
    assert.equal(expiredToken.isExpired(), true);
  });
});
