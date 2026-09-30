import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TokenRevocationStore } from '../src/repository/token-store.js';

describe('TokenRevocationStore', () => {
  let store;

  beforeEach(() => {
    store = new TokenRevocationStore();
  });

  it('should revoke a token and recognize it as revoked', async () => {
    const jti = 'token-uuid-1';
    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    assert.equal(await store.isRevoked(jti), false);
    await store.revoke(jti, expiresAt);
    assert.equal(await store.isRevoked(jti), true);
  });

  it('should automatically ignore expired revoked tokens', async () => {
    const jti = 'expired-token-uuid';
    const expiresAt = Math.floor(Date.now() / 1000) - 10; // in the past

    await store.revoke(jti, expiresAt);
    assert.equal(await store.isRevoked(jti), false);
  });

  it('should cleanup expired tokens', async () => {
    const now = Math.floor(Date.now() / 1000);
    await store.revoke('valid', now + 100);
    await store.revoke('expired', now - 100);

    await store.cleanup();
    assert.equal(await store.isRevoked('valid'), true);
    assert.equal(await store.isRevoked('expired'), false);
  });
});
