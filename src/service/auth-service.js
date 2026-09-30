import { User, validateEmail, validatePassword } from '../models/user.js';
import { hashPassword, verifyPassword } from '../crypto/password.js';
import { generateToken, verifyToken } from '../crypto/jwt.js';

export class AuthService {
  constructor({ userRepository, tokenStore, jwtSecret, tokenExpiresIn = 900 }) {
    if (!userRepository) throw new Error('userRepository is required');
    if (!tokenStore) throw new Error('tokenStore is required');
    if (!jwtSecret) throw new Error('jwtSecret is required');

    this.userRepository = userRepository;
    this.tokenStore = tokenStore;
    this.jwtSecret = jwtSecret;
    this.tokenExpiresIn = tokenExpiresIn;
  }

  /**
   * Register a new user
   */
  async register({ email, password }) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { status: 400, error: emailValidation.message };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { status: 400, error: passwordValidation.message };
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return { status: 409, error: 'Email is already registered' };
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      email,
      passwordHash
    });

    await this.userRepository.save(user);

    return {
      status: 201,
      user: user.toJSON()
    };
  }

  /**
   * Authenticate user credentials and issue token
   */
  async login({ email, password }) {
    if (!email || !password) {
      return { status: 400, error: 'Email and password are required' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { status: 401, error: 'Invalid email or password' };
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return { status: 401, error: 'Invalid email or password' };
    }

    const token = generateToken(
      { sub: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: this.tokenExpiresIn }
    );

    return {
      status: 200,
      token,
      user: user.toJSON()
    };
  }

  /**
   * Log out user and revoke active token
   */
  async logout({ token }) {
    if (!token) {
      return { status: 400, error: 'Token is required for logout' };
    }

    try {
      const payload = verifyToken(token, this.jwtSecret);
      await this.tokenStore.revoke(payload.jti, payload.exp);
      return { status: 200, message: 'Logged out successfully' };
    } catch (err) {
      return { status: 401, error: err.message };
    }
  }

  /**
   * Validate token and verify against revocation store
   */
  async authenticateToken(token) {
    if (!token) {
      return { status: 401, error: 'Missing authorization token' };
    }

    try {
      const payload = verifyToken(token, this.jwtSecret);
      const isRevoked = await this.tokenStore.isRevoked(payload.jti);
      if (isRevoked) {
        return { status: 401, error: 'Token has been revoked' };
      }

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        return { status: 401, error: 'User does not exist' };
      }

      return {
        status: 200,
        user: user.toJSON(),
        payload
      };
    } catch (err) {
      return { status: 401, error: err.message };
    }
  }
}
