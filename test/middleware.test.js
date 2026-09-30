import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/service/auth-service.js';
import { InMemoryUserRepository } from '../src/repository/user-repository.js';
import { TokenRevocationStore } from '../src/repository/token-store.js';
import { createAuthMiddleware } from '../src/middleware/auth-middleware.js';

describe('4.1 Auth Middleware & Route Protection', () => {
  let authService;
  let middleware;
  let validToken;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    const tokenStore = new TokenRevocationStore();
    authService = new AuthService({
      userRepository: userRepo,
      tokenStore,
      jwtSecret: 'test-middleware-secret-key-32-chars-long!',
      tokenExpiresIn: 600
    });

    await authService.register({
      email: 'member@example.com',
      password: 'StrongPassword123!'
    });

    const loginRes = await authService.login({
      email: 'member@example.com',
      password: 'StrongPassword123!'
    });
    validToken = loginRes.token;

    middleware = createAuthMiddleware(authService);
  });

  it('should allow access to protected route with valid Bearer token', async () => {
    let nextCalled = false;
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`
      }
    };
    const res = {};

    await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.ok(req.user);
    assert.equal(req.user.email, 'member@example.com');
  });

  it('should reject request without Authorization header with 401', async () => {
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;

    const req = { headers: {} };
    const res = {
      writeHead(code) { statusCode = code; },
      end(body) { responseBody = JSON.parse(body); }
    };

    const result = await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 401);
    assert.match(responseBody.error, /missing/i);
    assert.equal(result.status, 401);
  });

  it('should reject request with malformed Authorization header with 401', async () => {
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;

    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const res = {
      writeHead(code) { statusCode = code; },
      end(body) { responseBody = JSON.parse(body); }
    };

    const result = await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 401);
    assert.match(responseBody.error, /malformed/i);
  });

  it('should reject request with expired or invalid token with 401', async () => {
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;

    const req = { headers: { authorization: 'Bearer invalid.token.value' } };
    const res = {
      writeHead(code) { statusCode = code; },
      end(body) { responseBody = JSON.parse(body); }
    };

    const result = await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 401);
  });
});
