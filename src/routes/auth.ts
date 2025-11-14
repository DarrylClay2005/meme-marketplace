import { Router } from 'express';

export const authRoutes = Router();

// These endpoints are mostly placeholders because Cognito handles
// the actual hosted UI for signup/login. The frontend will call Cognito
// directly, then send the JWT access token to our protected API routes.

authRoutes.get('/me', (req, res) => {
  // In a real app you would decode the token and return profile info.
  res.json({ message: 'Auth handled by Cognito hosted UI; API trusts JWTs.' });
});
