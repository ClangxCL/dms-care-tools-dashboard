import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/crypto/password.js';

describe('Password Hashing & Verification', () => {
  it('should hash a password and verify it successfully', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    assert.ok(hash.startsWith('$scrypt$'));
    const isValid = await verifyPassword(password, hash);
    assert.equal(isValid, true);
  });

  it('should fail verification for incorrect password', async () => {
    const hash = await hashPassword('CorrectPassword123!');
    const isValid = await verifyPassword('WrongPassword123!', hash);
    assert.equal(isValid, false);
  });

  it('should generate different hashes for the same password due to random salt', async () => {
    const password = 'SamePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.notEqual(hash1, hash2);
    assert.equal(await verifyPassword(password, hash1), true);
    assert.equal(await verifyPassword(password, hash2), true);
  });

  it('should return false for malformed hash strings', async () => {
    assert.equal(await verifyPassword('password', 'invalid-hash'), false);
    assert.equal(await verifyPassword('password', '$other$hash$value'), false);
    assert.equal(await verifyPassword(null, '$scrypt$'), false);
  });
});
