import crypto from 'node:crypto';

/**
 * Validates password complexity:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains at least one digit or symbol
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number or special character' };
  }
  return { valid: true };
}

/**
 * Validates email format
 */
export function validateEmail(email) {
  if (typeof email !== 'string') {
    return { valid: false, message: 'Email must be a string' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Invalid email address format' };
  }
  return { valid: true };
}

export class User {
  constructor({ id, email, passwordHash, createdAt, updatedAt }) {
    this.id = id || crypto.randomUUID();
    this.email = email.toLowerCase().trim();
    this.passwordHash = passwordHash;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Sanitized representation without sensitive credentials
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export class TokenPayload {
  constructor({ sub, email, jti, exp, iat }) {
    this.sub = sub; // User ID
    this.email = email;
    this.jti = jti || crypto.randomUUID();
    this.iat = iat || Math.floor(Date.now() / 1000);
    this.exp = exp || this.iat + 15 * 60; // default 15 minutes
  }

  isExpired() {
    const now = Math.floor(Date.now() / 1000);
    return now >= this.exp;
  }
}
