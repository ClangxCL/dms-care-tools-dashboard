/**
 * Token Revocation Store (Blacklist) Interface & In-Memory Store
 */
export class TokenRevocationStore {
  constructor() {
    this.revokedTokens = new Map(); // jti -> expiresAt (timestamp in seconds)
  }

  /**
   * Revoke a token ID until its natural expiration
   */
  async revoke(jti, expiresAt) {
    if (!jti) return;
    const exp = typeof expiresAt === 'number' ? expiresAt : Math.floor(Date.now() / 1000) + 3600;
    this.revokedTokens.set(jti, exp);
  }

  /**
   * Check whether a token ID has been revoked
   */
  async isRevoked(jti) {
    if (!jti) return false;
    const expiresAt = this.revokedTokens.get(jti);
    if (!expiresAt) return false;

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      // Natural expiration passed; clean up entry
      this.revokedTokens.delete(jti);
      return false;
    }
    return true;
  }

  /**
   * Clean up all expired entries
   */
  async cleanup() {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, expiresAt] of this.revokedTokens.entries()) {
      if (now > expiresAt) {
        this.revokedTokens.delete(jti);
      }
    }
  }

  async clear() {
    this.revokedTokens.clear();
  }
}
