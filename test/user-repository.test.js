import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryUserRepository } from '../src/repository/user-repository.js';
import { User } from '../src/models/user.js';

describe('InMemoryUserRepository CRUD', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  it('should save and find user by id and email', async () => {
    const user = new User({
      email: 'john@example.com',
      passwordHash: '$scrypt$hash'
    });

    await repo.save(user);

    const byId = await repo.findById(user.id);
    assert.deepEqual(byId, user);

    const byEmail = await repo.findByEmail('JOHN@example.com');
    assert.deepEqual(byEmail, user);
  });

  it('should reject duplicate email on save', async () => {
    const user1 = new User({ email: 'duplicate@example.com', passwordHash: 'hash1' });
    const user2 = new User({ email: 'duplicate@example.com', passwordHash: 'hash2' });

    await repo.save(user1);
    await assert.rejects(
      async () => repo.save(user2),
      /already in use/
    );
  });

  it('should update existing user with same id and email', async () => {
    const user = new User({ email: 'update@example.com', passwordHash: 'hash1' });
    await repo.save(user);

    user.passwordHash = 'newhash';
    await repo.save(user);

    const retrieved = await repo.findById(user.id);
    assert.equal(retrieved.passwordHash, 'newhash');
  });

  it('should delete user and remove from index', async () => {
    const user = new User({ email: 'delete@example.com', passwordHash: 'hash' });
    await repo.save(user);

    const deleted = await repo.delete(user.id);
    assert.equal(deleted, true);

    const byId = await repo.findById(user.id);
    assert.equal(byId, null);

    const byEmail = await repo.findByEmail(user.email);
    assert.equal(byEmail, null);
  });

  it('should list all users', async () => {
    await repo.save(new User({ email: 'u1@example.com', passwordHash: 'h1' }));
    await repo.save(new User({ email: 'u2@example.com', passwordHash: 'h2' }));

    const list = await repo.list();
    assert.equal(list.length, 2);
  });
});
