/**
 * Creates an authentication middleware function compatible with standard Node HTTP handlers / Express / Koa / Connect.
 */
export function createAuthMiddleware(authService) {
  if (!authService) {
    throw new Error('authService is required');
  }

  return async function authMiddleware(req, res, next) {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      res.writeHead?.(401, { 'Content-Type': 'application/json' });
      res.end?.(JSON.stringify({ error: 'Missing authorization header' }));
      return { status: 401, error: 'Missing authorization header' };
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      res.writeHead?.(401, { 'Content-Type': 'application/json' });
      res.end?.(JSON.stringify({ error: 'Malformed authorization header. Expected "Bearer <token>"' }));
      return { status: 401, error: 'Malformed authorization header. Expected "Bearer <token>"' };
    }

    const token = parts[1];
    const authResult = await authService.authenticateToken(token);

    if (authResult.status !== 200) {
      res.writeHead?.(401, { 'Content-Type': 'application/json' });
      res.end?.(JSON.stringify({ error: authResult.error }));
      return { status: 401, error: authResult.error };
    }

    req.user = authResult.user;
    req.tokenPayload = authResult.payload;

    if (typeof next === 'function') {
      return next();
    }

    return { status: 200, user: req.user, payload: req.tokenPayload };
  };
}
