/**
 * Base User Repository Interface
 */
export class UserRepository {
  async save(user) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async list() {
    throw new Error('Method not implemented');
  }
}

/**
 * In-Memory User Repository Implementation
 */
export class InMemoryUserRepository extends UserRepository {
  constructor() {
    super();
    this.users = new Map(); // id -> User
    this.emailIndex = new Map(); // lowercase email -> id
  }

  async save(user) {
    const existingId = this.emailIndex.get(user.email);
    if (existingId && existingId !== user.id) {
      throw new Error(`Email ${user.email} is already in use`);
    }

    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const id = this.emailIndex.get(normalized);
    if (!id) return null;
    return this.users.get(id) || null;
  }

  async delete(id) {
    const user = this.users.get(id);
    if (user) {
      this.emailIndex.delete(user.email);
      this.users.delete(id);
      return true;
    }
    return false;
  }

  async list() {
    return Array.from(this.users.values());
  }

  async clear() {
    this.users.clear();
    this.emailIndex.clear();
  }
}
