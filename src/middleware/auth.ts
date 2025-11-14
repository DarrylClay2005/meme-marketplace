import { Request, Response, NextFunction } from 'express';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const userPoolId = process.env.COGNITO_USER_POOL_ID || '';
const region = process.env.REGION || 'us-east-1';

const jwks = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
    if (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    req.user = {
      sub: decoded.sub,
      email: decoded.email
    };
    next();
  });
}
