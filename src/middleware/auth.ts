import { Request, Response, NextFunction } from 'express';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const userPoolId = process.env.COGNITO_USER_POOL_ID || '';
const region = process.env.REGION || 'us-east-1';

if (!userPoolId) {
  // If this happens in production it means the API is misconfigured.
  // In local development you can temporarily bypass auth by not using requireAuth.
  console.warn('[auth] COGNITO_USER_POOL_ID is not set. Auth middleware will reject all tokens.');
}

const jwks = jwksClient({
  jwksUri: userPoolId
    ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
    : ''
});

function getKey(header: any, callback: any) {
  jwks.getSigningKey(header.kid, (err, key: any) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!userPoolId) {
    res.status(500).json({ error: 'Auth not configured on server' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
    if (err || !decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { sub, email } = decoded as { sub?: string; email?: string };
    if (!sub) {
      res.status(401).json({ error: 'Token missing subject' });
      return;
    }

    req.user = {
      sub,
      email: email ?? 'unknown@example.com'
    };
    next();
  });
}
