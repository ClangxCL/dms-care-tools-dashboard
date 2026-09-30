## Context

See `proposal.md` for background and motivation. The application currently lacks an integrated authentication and identity management layer. This design specifies an extensible, modular architecture for credential verification, password hashing, and stateless JWT/session tokens.

## Goals / Non-Goals

**Goals:**
- Provide a secure, pluggable password hashing service utilizing Argon2id/bcrypt.
- Provide a stateless token-based (JWT) and bearer authentication handler with configurable expiration and secret signing.
- Introduce reusable authentication middleware for route-level authorization.
- Provide in-memory/database repository interfaces for user persistence and token revocation lists.

**Non-Goals:**
- External OAuth2/SAML/SSO identity provider integrations (reserved for future changes).
- Multi-factor authentication (MFA / 2FA) and biometric authentication.
- Complex role-based or attribute-based access control (RBAC/ABAC) policies beyond identity verification.

## Decisions

### 1. Password Hashing: Argon2id with fallback to bcrypt
- **Decision**: Use Argon2id (or bcrypt) with secure salt generation and cost parameters.
- **Rationale**: Highly resistant to GPU/ASIC brute-force attacks and memory-hard.
- **Alternatives Considered**: Plain SHA-256 (insecure for passwords), PBKDF2 (less memory-hard than Argon2).

### 2. Token Format: HMAC-SHA256 Signed JWTs
- **Decision**: Issue JWT bearer tokens containing standard claims (`sub`, `iat`, `exp`) and a unique token ID (`jti`) for revocation tracking.
- **Rationale**: Enables stateless authorization checks in distributed/stateless architectures while keeping payload size minimal.
- **Alternatives Considered**: Server-side opaque sessions in database (requires database query per request, harder to scale horizontally).

### 3. Repository Abstraction for User Storage
- **Decision**: Define an interface `IUserRepository` (e.g. `findByEmail`, `save`, `findById`) decoupled from concrete database drivers.
- **Rationale**: Allows in-memory testing as well as seamless migration across database backends (PostgreSQL, SQLite, MongoDB, etc.).
- **Alternatives Considered**: Direct database querying tightly coupled to a single ORM.

## Risks / Trade-offs

- **[Risk: Stateless Token Revocation Delay]** → Mitigation: Keep access token lifetime short (e.g., 15 minutes) and maintain a fast cache / blacklist (e.g., Redis or in-memory LRU) for revoked token IDs (`jti`).
- **[Risk: Timing Attacks on Credential Checks]** → Mitigation: Use constant-time comparison algorithms when verifying hashes and secrets.
- **[Risk: CPU Overhead of Key Derivation Functions]** → Mitigation: Tune Argon2/bcrypt work factor parameters to balance security (e.g., ~100-300ms verification) against server throughput.
