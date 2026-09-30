import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AuthService,
  InMemoryUserRepository,
  TokenRevocationStore,
  createAuthMiddleware
} from '../src/index.js';

describe('4.2 End-to-End User Authentication Lifecycle Integration', () => {
  it('should successfully execute the complete auth lifecycle and satisfy all spec scenarios', async () => {
    // Setup environment
    const userRepo = new InMemoryUserRepository();
    const tokenStore = new TokenRevocationStore();
    const authService = new AuthService({
      userRepository: userRepo,
      tokenStore,
      jwtSecret: 'integration-test-secret-key-32-chars-long!',
      tokenExpiresIn: 1800
    });
    const authMiddleware = createAuthMiddleware(authService);

    // Mock protected endpoint handler
    const protectedEndpoint = async (req, res) => {
      return await authMiddleware(req, res, () => {
        return { status: 200, message: `Hello ${req.user.email}! Welcome to protected dashboard.` };
      });
    };

    // 1. Spec Scenario: Registration with weak password
    const weakPassRes = await authService.register({
      email: 'alex@example.com',
      password: 'weak'
    });
    assert.equal(weakPassRes.status, 400);

    // 2. Spec Scenario: Successful user registration
    const regRes = await authService.register({
      email: 'alex@example.com',
      password: 'SuperSecurePassword2026!'
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.user.email, 'alex@example.com');
    assert.ok(regRes.user.id);
    assert.equal(regRes.user.passwordHash, undefined);

    // 3. Spec Scenario: Registration with duplicate identity
    const dupRes = await authService.register({
      email: 'alex@example.com',
      password: 'AnotherPassword2026!'
    });
    assert.equal(dupRes.status, 409);

    // 4. Spec Scenario: Login failure with invalid password
    const failLoginRes = await authService.login({
      email: 'alex@example.com',
      password: 'WrongPassword!'
    });
    assert.equal(failLoginRes.status, 401);

    // 5. Spec Scenario: Successful login with valid credentials
    const loginRes = await authService.login({
      email: 'alex@example.com',
      password: 'SuperSecurePassword2026!'
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.token);
    const token = loginRes.token;

    // 6. Spec Scenario: Accessing protected resource with valid token
    const protectedReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const protectedRes = {};
    const accessResult = await protectedEndpoint(protectedReq, protectedRes);
    assert.equal(accessResult.status, 200);
    assert.match(accessResult.message, /alex@example.com/);

    // 7. Spec Scenario: Accessing protected resource without token
    let unauthCode = null;
    let unauthBody = null;
    const noTokenReq = { headers: {} };
    const noTokenRes = {
      writeHead(c) { unauthCode = c; },
      end(b) { unauthBody = JSON.parse(b); }
    };
    const noTokenResult = await protectedEndpoint(noTokenReq, noTokenRes);
    assert.equal(noTokenResult.status, 401);
    assert.equal(unauthCode, 401);

    // 8. Spec Scenario: Successful logout
    const logoutRes = await authService.logout({ token });
    assert.equal(logoutRes.status, 200);

    // 9. Spec Scenario: Accessing protected resource after logout
    let revokedCode = null;
    let revokedBody = null;
    const afterLogoutReq = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const afterLogoutRes = {
      writeHead(c) { revokedCode = c; },
      end(b) { revokedBody = JSON.parse(b); }
    };
    const afterLogoutResult = await protectedEndpoint(afterLogoutReq, afterLogoutRes);
    assert.equal(afterLogoutResult.status, 401);
    assert.equal(revokedCode, 401);
    assert.match(revokedBody.error, /revoked/i);
  });
});
