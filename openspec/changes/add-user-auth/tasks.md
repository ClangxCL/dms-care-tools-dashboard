## 1. Core Models and Cryptography Utilities

- [x] 1.1 Implement user data models (User, Credentials, Session/TokenPayload) and verify unit tests for model validation pass.
- [x] 1.2 Implement password hashing and verification service using Argon2id/bcrypt and verify hashing/verification unit tests pass.
- [x] 1.3 Implement JWT token generator, parser, and signature verifier and verify token expiration and tamper tests pass.

## 2. User Storage and Repository Layer

- [x] 2.1 Implement `IUserRepository` interface and in-memory storage implementation and verify user CRUD unit tests pass.
- [x] 2.2 Implement token revocation store / blacklist mechanism and verify token revocation tests pass.

## 3. Authentication Services and Handlers

- [x] 3.1 Implement registration handler with input validation and duplicate user rejection, verifying endpoint tests for 201, 400, and 409 status codes.
- [x] 3.2 Implement login handler with credential verification and token issuance, verifying tests for valid logins (200) and invalid logins (401).
- [x] 3.3 Implement logout handler with token invalidation and verify invalidation prevents subsequent reuse.

## 4. Authorization Middleware and Integration Testing

- [x] 4.1 Implement authentication middleware/guard to intercept and validate bearer tokens, verifying unauthorized access rejection (401) on protected routes.
- [x] 4.2 Create end-to-end integration test suite covering the full user lifecycle (register -> login -> access protected route -> logout -> fail protected route).
