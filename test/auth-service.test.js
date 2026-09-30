import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/service/auth-service.js';
import { InMemoryUserRepository } from '../src/repository/user-repository.js';
import { TokenRevocationStore } from '../src/repository/token-store.js';

describe('AuthService Handlers & Workflows', () => {
  let authService;
  let userRepo;
  let tokenStore;
  const jwtSecret = 'test-auth-service-secret-key-32-chars-long!';

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    tokenStore = new TokenRevocationStore();
    authService = new AuthService({
      userRepository: userRepo,
      tokenStore,
      jwtSecret,
      tokenExpiresIn: 600
    });
  });

  describe('3.1 Registration Handler', () => {
    it('should register a valid user and return 201', async () => {
      const res = await authService.register({
        email: 'newuser@example.com',
        password: 'ValidPassword123!'
      });

      assert.equal(res.status, 201);
      assert.equal(res.user.email, 'newuser@example.com');
      assert.ok(res.user.id);
      assert.equal(res.user.passwordHash, undefined);
    });

    it('should reject invalid email with 400', async () => {
      const res = await authService.register({
        email: 'invalid-email',
        password: 'ValidPassword123!'
      });

      assert.equal(res.status, 400);
      assert.match(res.error, /email/i);
    });

    it('should reject weak password with 400', async () => {
      const res = await authService.register({
        email: 'user@example.com',
        password: 'weak'
      });

      assert.equal(res.status, 400);
      assert.match(res.error, /password/i);
    });

    it('should reject duplicate email with 409 Conflict', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'ValidPassword123!'
      });

      const duplicateRes = await authService.register({
        email: 'duplicate@example.com',
        password: 'AnotherPassword123!'
      });

      assert.equal(duplicateRes.status, 409);
      assert.match(duplicateRes.error, /already registered/i);
    });
  });

  describe('3.2 Login Handler', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'existing@example.com',
        password: 'CorrectPassword123!'
      });
    });

    it('should successfully log in with valid credentials and return 200 + token', async () => {
      const res = await authService.login({
        email: 'existing@example.com',
        password: 'CorrectPassword123!'
      });

      assert.equal(res.status, 200);
      assert.ok(res.token);
      assert.equal(res.user.email, 'existing@example.com');
    });

    it('should reject invalid password with 401', async () => {
      const res = await authService.login({
        email: 'existing@example.com',
        password: 'WrongPassword123!'
      });

      assert.equal(res.status, 401);
      assert.equal(res.error, 'Invalid email or password');
    });

    it('should reject non-existent user with 401', async () => {
      const res = await authService.login({
        email: 'nobody@example.com',
        password: 'SomePassword123!'
      });

      assert.equal(res.status, 401);
      assert.equal(res.error, 'Invalid email or password');
    });
  });

  describe('3.3 Logout Handler & Invalidation', () => {
    it('should log out user and invalidate token', async () => {
      await authService.register({
        email: 'logoutuser@example.com',
        password: 'Password123!'
      });

      const loginRes = await authService.login({
        email: 'logoutuser@example.com',
        password: 'Password123!'
      });

      const token = loginRes.token;

      // Verify token is initially valid
      const initialAuth = await authService.authenticateToken(token);
      assert.equal(initialAuth.status, 200);
      assert.equal(initialAuth.user.email, 'logoutuser@example.com');

      // Perform logout
      const logoutRes = await authService.logout({ token });
      assert.equal(logoutRes.status, 200);

      // Verify token is now revoked
      const postLogoutAuth = await authService.authenticateToken(token);
      assert.equal(postLogoutAuth.status, 401);
      assert.match(postLogoutAuth.error, /revoked/i);
    });
  });
});
